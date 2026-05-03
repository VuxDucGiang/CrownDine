package com.crowndine.messaging.support;

import org.springframework.amqp.core.Message;
import org.springframework.amqp.core.MessagePostProcessor;
import org.springframework.stereotype.Component;

import java.time.Instant;
import java.util.Map;
import java.util.UUID;

@Component
public class RetryErrorHeaderBuilder {

    public MessagePostProcessor build(Message sourceMessage,
                                      Exception ex,
                                      long currentAttempt,
                                      int maxRetryAttempts,
                                      boolean willRetry) {
        return message -> {
            Map<String, Object> headers = message.getMessageProperties().getHeaders();
            Map<String, Object> sourceHeaders = sourceMessage.getMessageProperties().getHeaders();
            String now = Instant.now().toString();

            String firstFailedAt = readStringHeader(sourceHeaders, "x-first-failed-at");
            if (firstFailedAt == null) {
                firstFailedAt = now;
            }

            headers.put("x-retry-attempt", currentAttempt);
            headers.put("x-first-failed-at", firstFailedAt);
            headers.put("x-last-failed-at", now);
            headers.put("x-last-error-message", truncate(ex.getMessage(), 500));
            headers.put("x-last-error-class", ex.getClass().getName());
            headers.put("x-original-queue", sourceMessage.getMessageProperties().getConsumerQueue());
            headers.put("x-original-routing-key", sourceMessage.getMessageProperties().getReceivedRoutingKey());
            headers.put("x-retry-max-attempts", maxRetryAttempts);
            headers.put("x-retry-status", willRetry ? "RETRYING" : "DEAD_LETTERED");
            headers.put("x-correlation-id", resolveCorrelationId(sourceMessage));
            return message;
        };
    }

    /**
     * Lấy số lần retry từ message
     *
     * @param message
     * @return
     */
    public long readRetryAttempt(Message message) {
        Object retryAttempt = message.getMessageProperties().getHeaders().get("x-retry-attempt");
        if (retryAttempt instanceof Number number) {
            return number.longValue();
        }
        if (retryAttempt instanceof String value) {
            try {
                return Long.parseLong(value);
            } catch (NumberFormatException ignored) {
                return 0L;
            }
        }
        return 0L;
    }

    private Object resolveCorrelationId(Message sourceMessage) {
        Object correlationId = sourceMessage.getMessageProperties().getHeaders().get("x-correlation-id");
        if (correlationId == null) {
            correlationId = sourceMessage.getMessageProperties().getCorrelationId();
        }
        if (correlationId == null) {
            correlationId = UUID.randomUUID().toString();
        }
        return correlationId;
    }

    private String readStringHeader(Map<String, Object> headers, String key) {
        Object value = headers.get(key);
        return value == null ? null : String.valueOf(value);
    }

    private String truncate(String input, int maxLen) {
        if (input == null || input.length() <= maxLen) {
            return input;
        }
        return input.substring(0, maxLen);
    }
}
