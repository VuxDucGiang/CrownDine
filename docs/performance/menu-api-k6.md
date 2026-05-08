# Menu API Load Test (k6)

## Mục tiêu

Đo hiệu năng endpoint `GET /api/menu` dưới tải đồng thời để trả lời:

- API có đủ nhanh ở thực tế không?
- p50/p95/p99 có ổn định không?
- Throughput (req/s) đạt mức nào?
- Có lỗi khi tăng VU không?

## Kịch bản test

Script: `backend/scripts/k6-menu-api.js`

Mặc định script chạy:

- Executor: `ramping-vus`
- Stage 1: 30s -> 20 VUs
- Stage 2: 60s -> 50 VUs
- Stage 3: 30s -> 0 VUs
- Mode: `mixed` (trộn baseline/search/filter)
- Sleep mỗi iteration: `0.1s`

## Lệnh chạy

```bash
cd backend
k6 run scripts/k6-menu-api.js
```

## Kết quả benchmark (2026-05-05)

Nguồn: output bạn đã chạy local.

### Trước khi thêm index

- `http_req_duration`:
  - p50: **5.91ms**
  - p95: **19.23ms**
  - p99: **47.09ms**
  - avg: 8.39ms
  - max: 365.92ms
- `http_req_failed`: **0.00%** (0/29235)
- `http_reqs`: **29235** requests trong 2 phút
- Throughput: **243.61 req/s**

### Index đã thêm (chưa dùng Redis)

Migration:

- `backend/src/main/resources/db/migration/V14__Add_Item_Combo_Query_Indexes.sql`
- `backend/src/main/resources/dev/db/migration/V26__Add_Item_Combo_Query_Indexes.sql`

Indexes:

- `items`
  - `idx_items_slug (slug)`
  - `idx_items_name (name)`
  - `idx_items_status (status)`
  - `idx_items_category_status (category_id, status)`
- `combos`
  - `idx_combos_slug (slug)`
  - `idx_combos_name (name)`
  - `idx_combos_status (status)`
  - `idx_combos_category_status (category_id, status)`

### Sau khi thêm index

- `http_req_duration`:
  - p50: **5.22ms**
  - p95: **13.4ms**
  - p99: **35.22ms**
  - avg: 6.73ms
  - max: 174.9ms
- `http_req_failed`: **0.00%** (0/29804)
- `http_reqs`: **29804** requests trong 2 phút
- Throughput: **248.18 req/s**

### So sánh trước vs sau index

- p50: `5.91ms -> 5.22ms` (**-11.7%**)
- p95: `19.23ms -> 13.4ms` (**-30.3%**)
- p99: `47.09ms -> 35.22ms` (**-25.2%**)
- avg: `8.39ms -> 6.73ms` (**-19.8%**)
- max: `365.92ms -> 174.9ms` (**-52.2%**)
- throughput: `243.61 -> 248.18 req/s` (**+1.9%**)
- error rate: giữ nguyên **0%**

## Đánh giá nhanh

- Kết quả rất tốt cho API danh sách menu.
- Việc thêm index giúp giảm rõ rệt tail latency (p95/p99/max), đặc biệt hữu ích khi tải tăng.
- Ở tải tối đa ~50 VUs, p95 chỉ còn ~13ms và không có lỗi.
- `GET /api/menu` hiện chưa phải bottleneck ưu tiên refactor.

## Cách chạy các mode khác

### 1) Baseline (không search/filter)

```bash
MODE=baseline k6 run scripts/k6-menu-api.js
```

### 2) Search-heavy

```bash
MODE=search SEARCH_TERMS="lau,combo,hai san,bo" k6 run scripts/k6-menu-api.js
```

### 3) Filter-heavy theo category

```bash
MODE=filter CATEGORY_IDS="1,2,3,4" k6 run scripts/k6-menu-api.js
```

### 4) Chạy với server deploy

```bash
BASE_URL="https://crowndine.onrender.com" k6 run scripts/k6-menu-api.js
```

## Gợi ý số liệu đưa vào CV

- "Load-tested `GET /api/menu` with k6 (up to 50 VUs): achieved ~243 req/s, p95 19.23ms, p99 47.09ms, 0% error rate."
