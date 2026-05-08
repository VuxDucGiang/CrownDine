import http from "k6/http";
import {check, sleep} from "k6";
import exec from "k6/execution";
import {Rate} from "k6/metrics";
import {buildTokenPool, ensureBearer, pickTokenByVu} from "./lib/k6-auth.js";

/**
 * LOAD TEST ONLY
 * Mục tiêu: đo latency/throughput happy path cho create reservation.
 * Không trộn kịch bản conflict vào script này.
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const CREATE_PATH = __ENV.CREATE_PATH || "/api/reservations/create";
const LOGIN_PATH = __ENV.LOGIN_PATH || "/api/auth/login";
const LOAD_USERS = (__ENV.LOAD_USERNAMES || "minhanh")
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const LOAD_PASSWORD = __ENV.LOAD_PASSWORD || "123456";
const GUEST_NUMBER = Number(__ENV.GUEST_NUMBER || 2);
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0.05);
const status200Rate = new Rate("reservation_load_status_200_rate");

const TABLE_IDS = (__ENV.TABLE_IDS || "10,11,12,13,14,15,16,17")
    .split(",")
    .map((x) => Number(x.trim()))
    .filter(Boolean);
const START_TIMES = (
    __ENV.START_TIMES ||
    "11:00,11:30,12:00,12:30,13:00,18:00,18:30,19:00,19:30,20:00"
)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);

function futureDate(offsetDays = 7) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

// Sinh slot theo global iteration (toàn cục) để tránh trùng sớm giữa nhiều VU
function buildPayload() {
    const tableCount = TABLE_IDS.length;
    const timeCount = START_TIMES.length;
    const dateSpread = Number(__ENV.DATE_OFFSET_SPREAD || 14);
    const dateBase = Number(__ENV.DATE_OFFSET_BASE || 7);

    if (tableCount === 0 || timeCount === 0 || dateSpread <= 0) {
        throw new Error(
            "Invalid load config: TABLE_IDS/START_TIMES/DATE_OFFSET_SPREAD",
        );
    }

    const globalIndex = Number(exec.scenario.iterationInTest || 0);
    const tableIdx = globalIndex % tableCount;
    const timeIdx = Math.floor(globalIndex / tableCount) % timeCount;
    const dateIdx =
        Math.floor(globalIndex / (tableCount * timeCount)) % dateSpread;

    const tableId = TABLE_IDS[tableIdx];
    const startTime = START_TIMES[timeIdx];
    const dateOffset = dateBase + dateIdx;

    return {
        date: futureDate(dateOffset),
        startTime,
        guestNumber: GUEST_NUMBER,
        tableId,
        note: "k6-load-reservation",
    };
}

export const options = {
    scenarios: {
        reservation_load: {
            executor: "ramping-vus",
            startVUs: Number(__ENV.START_VUS || 2),
            stages: [
                {
                    duration: __ENV.STAGE1_DURATION || "30s",
                    target: Number(__ENV.STAGE1_VUS || 10),
                },
                {
                    duration: __ENV.STAGE2_DURATION || "60s",
                    target: Number(__ENV.STAGE2_VUS || 30),
                },
                {duration: __ENV.STAGE3_DURATION || "30s", target: 0},
            ],
            gracefulRampDown: "10s",
        },
    },
    thresholds: {
        checks: ["rate>0.99"],
        http_req_failed: ["rate<0.01"],
        http_req_duration: ["p(50)<120", "p(95)<500", "p(99)<1200"],
    },
};

export function setup() {
    if (LOAD_USERS.length === 0) {
        throw new Error("No users configured. Please set LOAD_USERNAMES.");
    }
    const tokens = buildTokenPool({
        baseUrl: BASE_URL,
        loginPath: LOGIN_PATH,
        usernames: LOAD_USERS,
        password: LOAD_PASSWORD,
    });
    return {tokens, users: LOAD_USERS};
}

export default function (data) {
    const tokens = data?.tokens || [];
    const token = pickTokenByVu(tokens, __VU);
    const payload = buildPayload();
    const res = http.post(`${BASE_URL}${CREATE_PATH}`, JSON.stringify(payload), {
        headers: {
            "Content-Type": "application/json",
            Authorization: ensureBearer(token),
        },
    });

    check(res, {
        "status is 200": (r) => r.status === 200,
        "response < 1500ms": (r) => r.timings.duration < 1500,
    });
    status200Rate.add(res.status === 200);

    sleep(SLEEP_SECONDS);
}

export function handleSummary(data) {
    const durationMs = data.state?.testRunDurationMs || 0;
    const durationSec = durationMs > 0 ? durationMs / 1000 : 1;

    const totalReq = data.metrics.http_reqs?.values?.count || 0;
    const failedReq = data.metrics.http_req_failed?.values?.passes || 0;
    const failedRate = data.metrics.http_req_failed?.values?.rate || 0;
    const successReq = Math.max(0, totalReq - failedReq);
    const successRate = totalReq > 0 ? successReq / totalReq : 0;
    const status200 = data.metrics.reservation_load_status_200_rate?.values?.rate || 0;

    const p50 = data.metrics.http_req_duration?.values?.["p(50)"] || 0;
    const p95 = data.metrics.http_req_duration?.values?.["p(95)"] || 0;
    const p99 = data.metrics.http_req_duration?.values?.["p(99)"] || 0;
    const avg = data.metrics.http_req_duration?.values?.avg || 0;
    const max = data.metrics.http_req_duration?.values?.max || 0;

    const iterations = data.metrics.iterations?.values?.count || 0;
    const rps = totalReq / durationSec;

    const thresholdFailed = [];
    for (const [metricName, metric] of Object.entries(data.metrics || {})) {
        const thresholds = metric?.thresholds || {};
        for (const [thresholdExpr, thresholdResult] of Object.entries(thresholds)) {
            if (thresholdResult && thresholdResult.ok === false) {
                thresholdFailed.push(`${metricName}: ${thresholdExpr}`);
            }
        }
    }

    const lines = [
        "=== Reservation Load Report ===",
        `Duration: ${durationSec.toFixed(2)}s`,
        `Requests: total=${totalReq}, success=${successReq}, failed=${failedReq}`,
        `Rates: success=${(successRate * 100).toFixed(2)}%, failed=${(failedRate * 100).toFixed(2)}%`,
        `Business status 200 rate: ${(status200 * 100).toFixed(2)}%`,
        `RPS: ${rps.toFixed(2)}`,
        `Latency(ms): avg=${avg.toFixed(2)}, p50=${p50.toFixed(2)}, p95=${p95.toFixed(2)}, p99=${p99.toFixed(2)}, max=${max.toFixed(2)}`,
        `Iterations: ${iterations}`,
        thresholdFailed.length > 0 ? `Threshold FAILED: ${thresholdFailed.join(" | ")}` : "Threshold: ALL PASSED",
    ];

    return {
        stdout: `${lines.join("\n")}\n`,
    };
}
