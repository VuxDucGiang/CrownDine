import http from "k6/http";
import { check, sleep } from "k6";

/**
 * K6 script cho API menu:
 * - Mục tiêu: đo latency (p50/p95/p99), throughput (req/s), error rate.
 * - Endpoint chính: GET /api/menu
 * - Query mô phỏng hành vi thật trên FE: page/size/sort + search/filter.
 */
const BASE_URL = __ENV.BASE_URL || "http://localhost:8080";
const MENU_PATH = __ENV.MENU_PATH || "/api/menu";
const SLEEP_SECONDS = Number(__ENV.SLEEP_SECONDS || 0.1);

// size trang trả về từ API menu
const PAGE_SIZE = Number(__ENV.SIZE || 12);
// MODE:
// - baseline: chỉ paging + sort (không search/filter)
// - search: luôn có search term
// - filter: luôn có categoryId
// - mixed: trộn baseline/search/filter theo random
const SCENARIO_MODE = __ENV.MODE || "mixed";

const SEARCH_TERMS = (__ENV.SEARCH_TERMS || "lau,hai san,combo,ga,bo").split(",");
const CATEGORY_IDS = (__ENV.CATEGORY_IDS || "1,2,3").split(",");
const SORT_OPTIONS = [
  { sortBy: "id", dir: "desc" },
  { sortBy: "price", dir: "asc" },
  { sortBy: "price", dir: "desc" },
  { sortBy: "rating", dir: "desc" },
];

export const options = {
  scenarios: {
    menu_load: {
      // ramping-vus giúp mô phỏng tăng tải dần rồi hạ tải
      executor: "ramping-vus",
      startVUs: Number(__ENV.START_VUS || 5),
      stages: [
        // Warm up: lên 20 users
        { duration: __ENV.STAGE1_DURATION || "30s", target: Number(__ENV.STAGE1_VUS || 20) },
        // Peak: lên 50 users
        { duration: __ENV.STAGE2_DURATION || "60s", target: Number(__ENV.STAGE2_VUS || 50) },
        // Cool down: hạ về 0
        { duration: __ENV.STAGE3_DURATION || "30s", target: 0 },
      ],
      gracefulRampDown: "10s",
    },
  },
  thresholds: {
    http_req_failed: ["rate<0.01"],
    http_req_duration: ["p(50)<150", "p(95)<500", "p(99)<1200"],
  },
};

function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildParams() {
  // Random page để mô phỏng user lật trang
  const page = Math.floor(Math.random() * 5) + 1;
  const sort = pick(SORT_OPTIONS);

  const base = {
    page: String(page),
    size: String(PAGE_SIZE),
    sortBy: sort.sortBy,
    dir: sort.dir,
    type: "ALL",
  };

  if (SCENARIO_MODE === "baseline") return base;
  if (SCENARIO_MODE === "search") return { ...base, search: pick(SEARCH_TERMS).trim() };
  if (SCENARIO_MODE === "filter") return { ...base, categoryId: pick(CATEGORY_IDS).trim() };

  // mixed mode: chia tỷ lệ tương đối 1/3 baseline, 1/3 search, 1/3 filter
  const mixedRoll = Math.random();
  if (mixedRoll < 0.33) return base;
  if (mixedRoll < 0.66) return { ...base, search: pick(SEARCH_TERMS).trim() };
  return { ...base, categoryId: pick(CATEGORY_IDS).trim() };
}

export default function () {
  const queryParams = buildParams();
  const url = `${BASE_URL}${MENU_PATH}`;
  const res = http.get(url, { params: queryParams });

  check(res, {
    "status is 200": (r) => r.status === 200,
    "response time < 1s": (r) => r.timings.duration < 1000,
  });

  sleep(SLEEP_SECONDS);
}
