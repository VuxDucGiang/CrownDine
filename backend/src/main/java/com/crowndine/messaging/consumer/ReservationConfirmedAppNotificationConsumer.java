package com.crowndine.messaging.consumer;

import com.crowndine.messaging.handler.ReservationConfirmedAppNotificationHandler;
import com.crowndine.messaging.support.RetryErrorHeaderBuilder;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-CONFIRMED-APP-CONSUMER")
public class ReservationConfirmedAppNotificationConsumer {

    private final ReservationConfirmedAppNotificationHandler appNotificationHandler;
    private final RabbitTemplate rabbitTemplate;
    private final RetryErrorHeaderBuilder retryErrorHeaderBuilder;

    @Value("${app.rabbitmq.exchange:crowndine.events}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app-retry:reservation.confirmed.inapp-notification.retry}")
    private String reservationConfirmedAppRetryRoutingKey;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app-dlq:reservation.confirmed.inapp-notification.dlq}")
    private String reservationConfirmedAppDlqRoutingKey;

    @Value("${app.rabbitmq.retry.reservation-confirmed-app.max-attempts:3}")
    private int maxRetryAttempts;

    @RabbitListener(queues = "${app.rabbitmq.queue.reservation-confirmed-app:crowndine.reservation.confirmed.inapp-notification}")
    public void consume(Long reservationId,
                        Message message,
                        Channel channel,
                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            log.info("Received reservation confirmed app notification message, reservationId={}", reservationId);
            appNotificationHandler.handle(reservationId);
            channel.basicAck(deliveryTag, false);
        } catch (Exception ex) {
            long currentAttempt = retryErrorHeaderBuilder.readRetryAttempt(message) + 1;
            if (currentAttempt > maxRetryAttempts) {
                rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedAppDlqRoutingKey, reservationId,
                        retryErrorHeaderBuilder.build(message, ex, currentAttempt, maxRetryAttempts, false));
                channel.basicAck(deliveryTag, false);
                log.error("App notification consumer exceeded retry attempts, moved to DLQ, reservationId={}, retryAttempt={}, error={}",
                        reservationId, currentAttempt, ex.getMessage(), ex);
                return;
            }

            rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedAppRetryRoutingKey, reservationId,
                    retryErrorHeaderBuilder.build(message, ex, currentAttempt, maxRetryAttempts, true));
            channel.basicAck(deliveryTag, false);
            log.warn("App notification consumer failed, sent to retry queue, reservationId={}, retryAttempt={}, error={}",
                    reservationId, currentAttempt, ex.getMessage(), ex);
        }
    }
}
