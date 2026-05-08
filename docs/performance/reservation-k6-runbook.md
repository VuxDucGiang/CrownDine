# Reservation K6 Runbook

## 1) Mục tiêu kiểm thử

Mục tiêu được tách thành 2 bài test độc lập để tránh nhiễu số liệu:

1. **Load/Performance test**

- Đo tốc độ API tạo reservation (`POST /api/reservations/create`) ở happy path.
- Chỉ tập trung vào: `latency (p50/p95/p99)`, `throughput`, `error rate`.

2. **Race-condition test**

- Kiểm tra tính đúng nghiệp vụ khi nhiều request cùng đặt **1 bàn + 1 khung giờ**.
- Kỳ vọng đúng: chỉ **1 request thành công (200)**, còn lại **409 conflict**, không có 500.

---

## 2) File script

- Helper dùng chung login/auth: `backend/scripts/lib/k6-auth.js`
- Load test: `backend/scripts/k6-reservation-load.js`
- Race test: `backend/scripts/k6-reservation-race.js`

---

## 3) Điều kiện trước khi chạy

1. Chạy backend bằng profile `perf` (DB riêng, tắt AI/mail để giảm nhiễu):

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

2. Chuẩn bị user login cho `setup()` (script tự login, không cần paste token):

- Load test dùng biến:
  - `LOAD_USERNAMES` (mặc định: `minhanh`)
  - `LOAD_PASSWORD` (mặc định: `123456`)

- Race test dùng biến:
  - `CONFLICT_USERNAMES` (mặc định: `johndoe,alice,johncena,minhanh`)
  - `CONFLICT_PASSWORD` (mặc định: `123456`)
  - `CONFLICT_DATE_OFFSET_DAYS` để điều khiển ngày test (ví dụ `10` = hôm nay + 10 ngày)

3. Đảm bảo DB perf đã có dữ liệu nền cần thiết:

- Bàn (`restaurant_tables`) phải có các `tableId` bạn sắp dùng.
- User tồn tại và mật khẩu đúng.

---

## 4) Cách chạy

### 4.1 Load/Performance test (happy path)

```bash
cd backend

LOAD_USERNAMES="minhanh" \
LOAD_PASSWORD="123456" \
TABLE_IDS="10,11,12,13,14,15,16,17" \
START_TIMES="11:00,11:30,12:00,12:30,13:00,18:00,18:30,19:00,19:30,20:00" \
k6 run scripts/k6-reservation-load.js
```

Gợi ý:

- `TABLE_IDS` và `START_TIMES` càng rộng thì càng ít va chạm slot, số đo latency càng "sạch".

### 4.2 Race-condition test (same slot burst)

```bash
cd backend

CONFLICT_USERNAMES="johndoe,alice,johncena,minhanh" \
CONFLICT_PASSWORD="123456" \
CONFLICT_TABLE_ID=9 \
CONFLICT_START_TIME="19:00" \
CONFLICT_DATE_OFFSET_DAYS=10 \
VUS=30 \
ITERATIONS=1 \
k6 run scripts/k6-reservation-race.js
```

Lưu ý:

- Script race đang ở mode burst: tất cả VU bắn gần đồng thời, nên chạy rất nhanh (vài trăm ms).

---

## 5) Kỳ vọng kết quả

### 5.1 Load test

- `http_req_failed` thấp (mục tiêu < 1%).
- `p95`, `p99` nằm trong ngưỡng team đề ra.
- Không có spike bất thường ở `max` do lỗi server.

### 5.2 Race test

- Báo cáo cuối có dạng:
  - `Success(200): 1`
  - `Conflict(409): VUS-1`
  - `Exactly one success: YES`
- Không có `500`.

Ví dụ kết quả đúng:

- VUS=30 -> `1 success`, `29 conflict`, `0 server error`.

---

## 6) Cách đọc nhanh và kết luận

1. Nếu load test đẹp nhưng race test sai:

- Hệ thống nhanh nhưng logic chống trùng chưa chắc đúng.

2. Nếu race test đúng (1/29) nhưng load test chậm:

- Logic đúng, cần tối ưu query/index/connection pool.

3. Nếu xuất hiện 500 ở race test:

- Có khả năng lỗi transaction boundary, lock, hoặc xử lý exception.

---

## 7) Lỗi thường gặp

1. **Toàn 409, không có 200 ở race test**

- Slot đã bị chiếm từ trước.
- Cách xử lý: đổi `CONFLICT_TABLE_ID`, `CONFLICT_START_TIME` hoặc tăng `CONFLICT_DATE_OFFSET_DAYS`.

2. **Login fail trong setup()**

- Sai user/password hoặc user chưa tồn tại trong DB perf.

3. **Command shell lỗi do xuống dòng**

- Không để khoảng trắng sau dấu `\` trong command multiline.

4. **App boot lỗi AI/mail khi chạy perf**

- Kiểm tra đang dùng đúng profile `perf`.

---

## 8) KPI đề xuất đưa vào báo cáo/CV

- Load test:
  - `p50/p95/p99`, `throughput`, `error rate`
- Race test:
  - `N concurrent requests same slot -> 1 success, N-1 conflicts, 0 server errors`

Ví dụ diễn đạt:

- "Validated reservation concurrency with k6 under 30 concurrent same-slot requests: **1 success, 29 conflicts (409), 0 server errors**."
