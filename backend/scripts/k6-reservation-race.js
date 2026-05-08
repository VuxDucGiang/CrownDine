import http from "k6/http";
import {check, sleep} from "k6";
import {Rate} from "k6/metrics";
import exec from "k6/execution";
import {buildTokenPool, ensureBearer, pickTokenByVu} from "./lib/k6-auth.js";

/**
 * RACE-CONDITION TEST ONLY
 * Mục tiêu: bắn đồng thời cùng slot để verify tính đúng nghiệp vụ conflict.
 * Kỳ vọng: chỉ 200/409, không 500.
 */

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const CREATE_PATH = __ENV.CREATE_PATH || "/api/reservations/create";
const LOGIN_PATH = __ENV.LOGIN_PATH || "/api/auth/login";
const TEST_USERS = (
    __ENV.CONFLICT_USERNAMES ||
    "johndoe,alice,johncena,minhanh,thutrang,quochuy,ngocmai,thanhtung,baovy,hoangyen,ductri,kimngan,nguyenkhoa,thuyduong,hoanglong,mylinh,quanghuy,diemmy"
)
    .split(",")
    .map((x) => x.trim())
    .filter(Boolean);
const TEST_PASSWORD = __ENV.CONFLICT_PASSWORD || "123456";

const TABLE_ID = Number(__ENV.CONFLICT_TABLE_ID || 10);
const START_TIME = __ENV.CONFLICT_START_TIME || "19:00";
const GUEST_NUMBER = Number(__ENV.GUEST_NUMBER || 2);

const conflictRate = new Rate("reservation_conflict_rate");
const successRate = new Rate("reservation_success_rate");
const serverErrorRate = new Rate("reservation_server_error_rate");

function futureDate(offsetDays = 10) {
    const date = new Date();
    date.setDate(date.getDate() + offsetDays);
    const yyyy = date.getFullYear();
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const dd = String(date.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
}

export const options = {
    scenarios: {
        reservation_race: {
            // Mỗi VU chạy đúng 1 lần -> dễ assert "exactly 1 success" cho 1 batch race
            executor: "per-vu-iterations",
            vus: Number(__ENV.VUS || 20),
            iterations: Number(__ENV.ITERATIONS || 1),
            gracefulStop: "5s",
        },
    },
    thresholds: {
        checks: ["rate>0.99"],
        reservation_server_error_rate: ["rate==0"],
        http_req_duration: ["p(95)<1200", "p(99)<2500"],
    },
};

export function setup() {
    if (TEST_USERS.length === 0) {
        throw new Error("No users configured. Please set CONFLICT_USERNAMES.");
    }

    const tokens = buildTokenPool({
        baseUrl: BASE_URL,
        loginPath: LOGIN_PATH,
        usernames: TEST_USERS,
        password: TEST_PASSWORD,
    });
    return {tokens, users: TEST_USERS};
}

export default function (data) {
    const tokens = data?.tokens || [];
    if (tokens.length === 0) {
        throw new Error("No tokens from setup()");
    }

    const token = pickTokenByVu(tokens, __VU);
    const payload = {
        date: futureDate(Number(__ENV.CONFLICT_DATE_OFFSET_DAYS || 5)),
        startTime: START_TIME,
        guestNumber: GUEST_NUMBER,
        tableId: TABLE_ID,
        note: "k6-race-reservation",
    };

    const res = http.post(`${BASE_URL}${CREATE_PATH}`, JSON.stringify(payload), {
        headers: {
            "Content-Type": "application/json",
            Authorization: ensureBearer(token),
        },
        tags: {name: "RaceConditionRequest"},
    });

    successRate.add(res.status === 200);
    conflictRate.add(res.status === 409);
    serverErrorRate.add(res.status >= 500);

    check(res, {
        "status is 200 or 409": (r) => r.status === 200 || r.status === 409,
        "response < 1500ms": (r) => r.timings.duration < 1500,
    });

    // Lưu status của từng VU cho batch hiện tại
    exec.vu.metrics.metadata.status = String(res.status);
    sleep(0.01);
}

// In summary để bạn thấy ngay số 200/409 và check "exactly 1 success"
export function handleSummary(data) {
    const sub = data.root_group?.checks ?? [];
    const statusCheck = sub.find((c) => c.name === "status is 200 or 409");

    const vus = Number(__ENV.VUS || 20);
    const successes = data.metrics.reservation_success_rate
        ? Math.round((data.metrics.reservation_success_rate.values.rate || 0) * vus)
        : 0;
    const conflicts = data.metrics.reservation_conflict_rate
        ? Math.round(
            (data.metrics.reservation_conflict_rate.values.rate || 0) * vus,
        )
        : 0;
    const exactlyOne = successes === 1;

    const report = [
        "=== Reservation Race Report ===",
        `VUs: ${vus}`,
        `Users configured: ${TEST_USERS.length}`,
        `Success(200): ${successes}`,
        `Conflict(409): ${conflicts}`,
        `Exactly one success: ${exactlyOne ? "YES" : "NO"}`,
        statusCheck
            ? `Status validity check pass: ${statusCheck.passes}/${statusCheck.passes + statusCheck.fails}`
            : "",
    ]
        .filter(Boolean)
        .join("\n");

    return {
        stdout: `${report}\n`,
    };
}

// CONFLICT_TABLE_ID=9 \
// CONFLICT_START_TIME="19:00" \
// CONFLICT_DATE_OFFSET_DAYS=11 \
// VUS=100 \
// ITERATIONS=1 \
// k6 run scripts/k6-reservation-race.js
