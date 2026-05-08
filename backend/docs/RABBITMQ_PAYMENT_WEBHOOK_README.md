# RabbitMQ cho Use Case Webhook Thanh Toán (CrownDine)

## 0) Cách config RabbitMQ vào dự án (setup nền tảng)

### 0.1 Thêm dependency Maven

Trong `pom.xml`, thêm:

```xml
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-amqp</artifactId>
</dependency>
```

### 0.2 Chạy RabbitMQ local bằng Docker

Bạn đã có file compose riêng:

- `docker-compose-rabbitmq.yml`

Nội dung chính:
- Image `rabbitmq:3.13-management`
- Port AMQP: `5672`
- Port UI: `15672`

Chạy:

```bash
cd backend
docker compose -f docker-compose-rabbitmq.yml up -d
```

Truy cập UI:
- URL: `http://localhost:15672`
- User/Pass mặc định: `guest/guest`

### 0.3 Khai báo biến môi trường

Thêm vào `.env` / `dev.env` / `prod.env`:

```env
RABBITMQ_HOST=localhost
RABBITMQ_PORT=5672
RABBITMQ_USERNAME=guest
RABBITMQ_PASSWORD=guest
RABBITMQ_VHOST=/
RABBITMQ_EXCHANGE=crowndine.events
RABBITMQ_QUEUE_ORDER_PAID=crowndine.order.paid
RABBITMQ_ROUTING_KEY_ORDER_PAID=order.paid
```

### 0.4 Cấu hình `application-dev.yml` và `application-prod.yml`

Kết nối broker:

```yml
spring:
  rabbitmq:
    host: ${RABBITMQ_HOST:localhost}
    port: ${RABBITMQ_PORT:5672}
    username: ${RABBITMQ_USERNAME:guest}
    password: ${RABBITMQ_PASSWORD:guest}
    virtual-host: ${RABBITMQ_VHOST:/}
```

Producer safety config (khuyến nghị):

```yml
spring:
  rabbitmq:
    publisher-confirm-type: correlated
    publisher-returns: true
    template:
      mandatory: true
```

App-level naming (tránh hardcode trong code):

```yml
app:
  rabbitmq:
    exchange: ${RABBITMQ_EXCHANGE:crowndine.events}
    queue: ${RABBITMQ_QUEUE_ORDER_PAID:crowndine.order.paid}
    routing-key: ${RABBITMQ_ROUTING_KEY_ORDER_PAID:order.paid}
```

### 0.5 Tạo bean Exchange/Queue/Binding

Tạo class config (ví dụ `RabbitMqConfig`):
- `TopicExchange`
- `Queue`
- `Binding`

Mục đích:
- App khởi động là tự khai báo topology cần thiết cho use case.

### 0.6 Verify sau setup

Checklist nhanh:

1. App boot không lỗi kết nối Rabbit.
2. Trong RabbitMQ UI thấy exchange/queue/binding đã tạo.
3. Publish test message (manual hoặc endpoint dev).
4. Consumer nhận được message và log ra `eventId`.

Nếu đạt 4 bước này, nền tảng RabbitMQ đã sẵn sàng để gắn vào flow webhook payment.

---

## 1) Mục tiêu của việc đưa RabbitMQ vào flow này

Use case hiện tại:

- Khách thanh toán qua cổng (PayOS).
- Webhook trả về backend.
- Backend cập nhật trạng thái chính (payment/reservation/order).
- Sau đó còn nhiều side-effect: gửi mail, tạo notification, cộng điểm, analytics...

Mục tiêu khi tích hợp RabbitMQ:

- Giữ đường xử lý chính (critical path) ngắn và ổn định.
- Tách việc phụ ra xử lý bất đồng bộ.
- Tăng khả năng chịu lỗi cho các tác vụ hậu xử lý.

---

## 2) Lợi ích khi áp dụng RabbitMQ vào webhook payment

### 2.1 API/webhook trả về nhanh hơn

- Webhook chỉ cần:
    1) verify callback
    2) cập nhật trạng thái chính
    3) publish event
       rồi trả response.
- Không phải chờ gửi mail/noti hoàn thành.

### 2.2 Giảm coupling giữa domain thanh toán và các service phụ

- Payment service không cần biết chi tiết mail/notification/reward triển khai ra sao.
- Mỗi consumer xử lý một trách nhiệm riêng.

### 2.3 Chịu lỗi tốt hơn ở đường async

- Consumer lỗi tạm thời -> message còn trong queue, retry tiếp.
- Consumer downtime -> message chờ đến khi service lên lại.
- Có thể thêm DLQ để giữ message fail lâu, không mất dấu.

### 2.4 Scale mềm dẻo

- Tăng số lượng consumer khi tải tăng.
- Không cần scale đồng bộ cả ứng dụng chỉ vì email/noti bị nghẽn.

### 2.5 Quan sát vận hành rõ hơn

- Nhìn thấy độ sâu queue, tốc độ tiêu thụ, số message fail/retry.
- Dễ biết hệ thống đang nghẽn ở bước nào.

---

## 3) Nhược điểm / trade-off

### 3.1 Tăng độ phức tạp kiến trúc

- Thêm broker, queue, retry, DLQ, monitoring.
- Team phải nắm thêm kiến thức event-driven.

### 3.2 Eventual consistency

- State phụ (mail/noti) có thể trễ vài giây so với state chính.
- Không còn “mọi thứ xong cùng lúc” trong 1 request.

### 3.3 Bắt buộc thiết kế idempotency ở consumer

- Message có thể bị deliver lại.
- Consumer phải an toàn khi xử lý lặp.

### 3.4 Cần chiến lược xử lý poison message

- Message lỗi nghiệp vụ vĩnh viễn cần tách ra DLQ, không retry vô hạn.

---

## 4) Khi nào nên/không nên dùng MQ ở flow này

### Nên dùng khi:

- Webhook đang phải làm nhiều việc phụ.
- Tải tăng, request timeout hoặc giật cục.
- Cần retry có kiểm soát cho email/noti/reward.

### Có thể chưa cần khi:

- Hệ thống nhỏ, low traffic, side-effect rất ít.
- Team chưa sẵn sàng vận hành thêm broker.

---

## 5) Thiết kế chuẩn cho use case hiện tại

## 5.1 Phân tách sync vs async

### Sync (phải commit chắc chắn trước khi trả webhook)

- Verify signature/checksum callback.
- Idempotency guard (business state + key strategy).
- Update payment -> SUCCESS.
- Update reservation/order state chính.

### Async (đẩy qua RabbitMQ)

- Gửi email xác nhận.
- Tạo notification realtime.
- Cộng điểm thưởng.
- Analytics/audit phụ trợ.

Nguyên tắc:

- State chính luôn ưu tiên consistency.
- Side-effect tách ra để tối ưu độ trễ và độ bền.

## 5.2 Event payload khuyến nghị

Nên có các trường tối thiểu:

- `eventId`: UUID hoặc transaction reference (phục vụ idempotency/correlation)
- `eventType`: ví dụ `RESERVATION_CONFIRMED`
- `occurredAt`: ISO timestamp
- `reservationId`
- `orderId` (nếu có)
- `paymentCode` / `providerRef`
- `username` hoặc `customerId`
- `payloadVersion`

Lý do:

- Dễ versioning.
- Dễ correlation log end-to-end.

---

## 6) Mẫu flow chuẩn (Webhook -> MQ)

1. Nhận webhook.
2. Verify dữ liệu cổng thanh toán.
3. Check duplicate theo business state/idempotency key.
4. Cập nhật DB trạng thái chính trong transaction.
5. Publish message `ReservationConfirmedMessage` vào exchange.
6. Trả 2xx cho provider.
7. Consumer nhận message, xử lý mail/noti/reward.
8. Ack khi xử lý xong.
9. Nếu fail -> retry / DLQ theo policy.

---

## 7) Idempotency trong ngữ cảnh MQ

Do RabbitMQ có thể redeliver, consumer phải idempotent:

- Dùng `eventId` làm idempotency key.
- Trước khi xử lý side-effect, kiểm tra đã xử lý event này chưa.
- Nếu đã xử lý -> ack và skip.

Có thể lưu trạng thái xử lý event bằng:

- DB bảng `processed_events` (đảm bảo mạnh)
- hoặc Redis key `evt:processed:{eventId}` TTL phù hợp (nhanh hơn, best effort)

Khuyến nghị lâu dài cho payment-critical:

- ưu tiên DB unique cho processed event.

---

## 8) Retry & DLQ khuyến nghị

### Retry

- Lỗi tạm thời (SMTP timeout, network hiccup): retry vài lần, có backoff.

### DLQ

- Lỗi không thể xử lý ngay (payload sai, dữ liệu thiếu): chuyển DLQ.
- Có dashboard/process để re-drive DLQ thủ công.

Chính sách đơn giản để bắt đầu:

- Max retry: 3
- Backoff: 5s -> 30s -> 2m
- Sau đó vào DLQ

---

## 9) Đo lường hiệu quả trước/sau tích hợp

Nên đo 2 nhóm:

### A. Sync path

- `webhook_ms` (controller/service)
- mục tiêu: p95 giảm

### B. Async path

- `async_ms` (consumer)
- `end_to_end_ms` (từ webhook received đến side-effect done)

Metrics vận hành Rabbit:

- queue depth
- publish rate / consume rate
- retry count
- DLQ count

---

## 10) Rủi ro thực tế và cách giảm thiểu

### Rủi ro 1: publish thất bại sau khi DB commit

- Có thể mất event side-effect.
- Hướng nâng cao: Outbox Pattern.

### Rủi ro 2: duplicate message

- Bắt buộc idempotent consumer.

### Rủi ro 3: queue backlog tăng

- Tăng consumer concurrency/prefetch hợp lý.
- Tối ưu thao tác trong consumer.

### Rủi ro 4: quan sát kém

- Chuẩn hóa log theo `eventId`.
- Dashboard queue + alert DLQ.

---

## 11) Lộ trình triển khai khuyến nghị cho CrownDine

### Giai đoạn 1 (MVP)

- Publish một event duy nhất: `ReservationConfirmedMessage`.
- Một consumer gửi mail + notification.
- Có log timing + eventId correlation.

### Giai đoạn 2

- Tách consumer theo concern:
    - mail consumer
    - notification consumer
    - reward consumer
- Thêm retry + DLQ.

### Giai đoạn 3 (production-hardening)

- Outbox pattern cho publish an toàn.
- Idempotency store chuẩn hóa.
- Alerting + dashboard đầy đủ.

---

## 12) Kết luận cho use case

- Tích hợp RabbitMQ ở điểm webhook success là hợp lý nhất.
- Không thay đổi nghiệp vụ chính, chỉ tách side-effect khỏi critical path.
- Lợi ích lớn nhất: response nhanh hơn + async bền hơn + vận hành rõ hơn.
- Trade-off: tăng độ phức tạp kiến trúc, cần idempotency + retry/DLQ chuẩn.

Nếu làm đúng theo lộ trình trên, đây là nền rất tốt để tiến lên kiến trúc microservice/event-driven sau này.

---

## 13) Benchmark p50/p95/p99 bằng k6 (trước/sau tích hợp MQ)

### 13.1 Script đã chuẩn bị sẵn

File:
- `backend/scripts/k6-payos-webhook.js`

### 13.2 Chuẩn bị payload webhook

Khuyến nghị:
- Lấy 1 payload PayOS thực tế (đã mask thông tin nhạy cảm) lưu vào file JSON, ví dụ:
  - `backend/scripts/payos-webhook-body.json`

### 13.3 Chạy benchmark

Ví dụ chạy local:

```bash
cd backend

k6 run scripts/k6-payos-webhook.js \
  -e BASE_URL=http://localhost:8080 \
  -e WEBHOOK_PATH=/api/payments/payos-ipn \
  -e WEBHOOK_BODY_FILE=scripts/payos-webhook-body.json \
  -e VUS=20 \
  -e ITERATIONS=1000
```

Giải thích:
- `VUS=20`: tối đa 20 virtual users chạy song song.
- `ITERATIONS=1000`: tổng 1000 request cho cả bài test.

### 13.4 Quy trình đo chuẩn để so sánh trước/sau

1. Tắt MQ / dùng flow cũ (sync side-effect), chạy 3 lần.
2. Bật MQ / dùng flow async side-effect, chạy 3 lần.
3. Ghi lại các chỉ số:
   - `http_req_duration p(50), p(95), p(99)`
   - `http_reqs` (throughput)
   - `http_req_failed`
4. Lấy median của 3 lần cho mỗi chỉ số.

### 13.5 Mẫu bảng kết quả

| Mode | p50 (ms) | p95 (ms) | p99 (ms) | req/s | fail rate |
|------|----------|----------|----------|-------|-----------|
| Sync (before MQ) | ... | ... | ... | ... | ... |
| Async (after MQ) | ... | ... | ... | ... | ... |

### 13.6 Mẫu câu đưa vào CV

- “Reduced payment webhook p95 latency from `X ms` to `Y ms` (`Z%`) under `20` concurrent users.”
- “Increased webhook throughput from `A req/s` to `B req/s` after moving side-effects to RabbitMQ consumers.”
- “Maintained error rate below `N%` during 1,000-request load tests with asynchronous event handling.”

### 13.7 Lưu ý quan trọng khi đo

- Dùng cùng môi trường máy, cùng DB data, cùng payload test.
- Warm-up ngắn trước khi đo chính thức.
- Không chạy tác vụ nặng khác trên máy trong lúc benchmark.
- Với webhook có verify chữ ký, nên dùng payload hợp lệ để phản ánh đúng thực tế.
