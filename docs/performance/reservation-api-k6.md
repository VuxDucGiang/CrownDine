# Reservation API K6 Test

## 1) Mục tiêu

- Tách biệt rõ 2 mục tiêu kiểm thử:
  - **Load/Performance** (happy path)
  - **Race condition/Conflict correctness**

## 2) Scripts

- `backend/scripts/k6-reservation-load.js`
  - Chỉ đo latency/throughput happy path.
- `backend/scripts/k6-reservation-race.js`
  - Chỉ kiểm tra conflict khi nhiều request cùng slot.

## 3) Cách chạy nhanh

### Bước 1: chạy backend bằng profile `perf` (DB riêng)

```bash
cd backend

SPRING_PROFILES_ACTIVE=perf \
DATABASE_HOST=localhost \
DATABASE_PORT=3306 \
DATABASE_NAME=crowndine_perf \
DATABASE_USERNAME=root \
DATABASE_PASSWORD=123456 \
./mvnw spring-boot:run
```

> Khuyến nghị: tạo sẵn schema `crowndine_perf` và chỉ dùng cho load/perf test.

### Bước 2A: chạy load test (happy path)

```bash
cd backend

ACCESS_TOKEN_SUCCESS="<token_customer_1>" \
TABLE_IDS="10,11,12,13,14,15,16,17" \
START_TIMES="11:00,11:30,12:00,12:30,13:00,18:00,18:30,19:00,19:30,20:00" \
k6 run scripts/k6-reservation-load.js
```

### Bước 2B: chạy race-condition test (conflict)

```bash
cd backend

ACCESS_TOKENS_CONFLICT="<token_customer_1>,<token_customer_2>" \
CONFLICT_TABLE_ID=10 \
CONFLICT_START_TIME="19:00" \
k6 run scripts/k6-reservation-race.js
```

## 4) Ý nghĩa biến môi trường

- `BASE_URL`: mặc định `http://localhost:8080`
- `CREATE_PATH`: mặc định `/api/reservations/create`
- Load script:
  - `ACCESS_TOKEN_SUCCESS`, `TABLE_IDS`, `START_TIMES`
- Race script:
  - `ACCESS_TOKENS_CONFLICT`, `CONFLICT_TABLE_ID`, `CONFLICT_START_TIME`

## 5) Kỳ vọng kết quả

- Load script:
  - Request chủ yếu `200`
  - đo p50/p95/p99 và throughput
- Race script:
  - `200/409` là bình thường
  - không có `500`

## 6) KPI khuyến nghị để đưa vào báo cáo/CV

- Load script:
  - `http_reqs` (throughput), `http_req_duration p50/p95/p99`, `http_req_failed`
- Race script:
  - `reservation_success_rate`, `reservation_conflict_rate`, `reservation_server_error_rate`
  - Tỷ lệ `200/409` để chứng minh cơ chế chặn đặt trùng hoạt động đúng.
