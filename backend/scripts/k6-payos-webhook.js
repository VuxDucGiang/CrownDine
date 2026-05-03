import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  scenarios: {
    webhook_load: {
      executor: "shared-iterations",
      vus: Number(__ENV.VUS || 20),
      iterations: Number(__ENV.ITERATIONS || 1000),
      maxDuration: __ENV.MAX_DURATION || "10m",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.05"],
    http_req_duration: ["p(50)<800", "p(95)<3000", "p(99)<6000"],
  },
};

const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const WEBHOOK_PATH = __ENV.WEBHOOK_PATH || "/api/payments/payos-ipn";

let payload = "{}";
if (__ENV.WEBHOOK_BODY_FILE) {
  payload = open(__ENV.WEBHOOK_BODY_FILE);
} else if (__ENV.WEBHOOK_BODY) {
  payload = __ENV.WEBHOOK_BODY;
}

const params = {
  headers: {
    "Content-Type": "application/json",
  },
};

export default function () {
  const res = http.post(`${BASE_URL}${WEBHOOK_PATH}`, payload, params);

  check(res, {
    "status is 2xx/4xx (server reachable)": (r) => r.status >= 200 && r.status < 500,
  });

  sleep(Number(__ENV.SLEEP_SECONDS || 0));
}

