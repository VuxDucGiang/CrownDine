package com.crowndine.messaging.consumer;

import com.crowndine.messaging.handler.ReservationConfirmedEmailHandler;
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
@Slf4j(topic = "RESERVATION-CONFIRMED-EMAIL-CONSUMER")
public class ReservationConfirmedEmailConsumer {

    private final ReservationConfirmedEmailHandler emailHandler;
    private final RabbitTemplate rabbitTemplate;
    private final RetryErrorHeaderBuilder retryErrorHeaderBuilder;

    @Value("${app.rabbitmq.exchange:crowndine.events}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email-retry:reservation.confirmed.email-notification.retry}")
    private String reservationConfirmedEmailRetryRoutingKey;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email-dlq:reservation.confirmed.email-notification.dlq}")
    private String reservationConfirmedEmailDlqRoutingKey;

    @Value("${app.rabbitmq.retry.reservation-confirmed-email.max-attempts:3}")
    private int maxRetryAttempts;

    @RabbitListener(queues = "${app.rabbitmq.queue.reservation-confirmed-email:crowndine.reservation.confirmed.email-notification}")
    public void consume(Long reservationId,
                        Message message,
                        Channel channel,
                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            log.info("Received reservation confirmed email message, reservationId={}", reservationId);
            emailHandler.handle(reservationId);
            channel.basicAck(deliveryTag, false);
        } catch (Exception ex) {
            long currentAttempt = retryErrorHeaderBuilder.readRetryAttempt(message) + 1;
            if (currentAttempt > maxRetryAttempts) {
                rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedEmailDlqRoutingKey, reservationId,
                        retryErrorHeaderBuilder.build(message, ex, currentAttempt, maxRetryAttempts, false));
                channel.basicAck(deliveryTag, false);
                log.error("Email consumer exceeded retry attempts, moved to DLQ, reservationId={}, retryAttempt={}, error={}",
                        reservationId, currentAttempt, ex.getMessage(), ex);
                return;
            }

            rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedEmailRetryRoutingKey, reservationId,
                    retryErrorHeaderBuilder.build(message, ex, currentAttempt, maxRetryAttempts, true));
            channel.basicAck(deliveryTag, false);
            log.warn("Email consumer failed, sent to retry queue, reservationId={}, retryAttempt={}, error={}",
                    reservationId, currentAttempt, ex.getMessage(), ex);
        }
    }
}
