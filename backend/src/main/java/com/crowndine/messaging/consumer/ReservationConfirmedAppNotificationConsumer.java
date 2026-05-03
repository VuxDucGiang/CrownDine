package com.crowndine.messaging.consumer;

import com.crowndine.messaging.handler.ReservationConfirmedAppNotificationHandler;
import com.rabbitmq.client.Channel;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.core.Message;
import org.springframework.amqp.rabbit.annotation.RabbitListener;
import org.springframework.amqp.support.AmqpHeaders;
import org.springframework.messaging.handler.annotation.Header;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-CONFIRMED-APP-CONSUMER")
public class ReservationConfirmedAppNotificationConsumer {

    private final ReservationConfirmedAppNotificationHandler appNotificationHandler;

    @RabbitListener(queues = "${app.rabbitmq.queue.reservation-confirmed-app:crowndine.reservation.confirmed.app}")
    public void consume(Long reservationId,
                        Message message,
                        Channel channel,
                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        try {
            log.info("Received reservation confirmed app notification message, reservationId={}", reservationId);
            appNotificationHandler.handle(reservationId);
            channel.basicAck(deliveryTag, false);
        } catch (Exception ex) {
            channel.basicNack(deliveryTag, false, false);
            log.error("Failed app notification consumer, reservationId={}, error={}", reservationId, ex.getMessage(), ex);
        }
    }
}
