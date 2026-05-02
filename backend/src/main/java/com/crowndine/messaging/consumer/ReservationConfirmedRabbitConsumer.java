package com.crowndine.messaging.consumer;

import com.crowndine.messaging.handler.ReservationConfirmedAsyncHandler;
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
@Slf4j(topic = "RESERVATION-CONFIRMED-RABBIT-CONSUMER")
public class ReservationConfirmedRabbitConsumer {

    private final ReservationConfirmedAsyncHandler reservationConfirmedAsyncHandler;

    @RabbitListener(queues = "${app.rabbitmq.queue.reservation-confirmed:crowndine.reservation.confirmed}")
    public void consume(Long reservationId,
                        Message message,
                        Channel channel,
                        @Header(AmqpHeaders.DELIVERY_TAG) long deliveryTag) throws Exception {
        long startNs = System.nanoTime();
        try {
            log.info("Received reservation confirmed message, reservationId={}", reservationId);
            reservationConfirmedAsyncHandler.handleReservationConfirmed(reservationId);
            channel.basicAck(deliveryTag, false);
            long asyncMs = (System.nanoTime() - startNs) / 1_000_000;
            log.info("Processed reservation confirmed message, reservationId={}, async_ms={}", reservationId, asyncMs);
        } catch (Exception ex) {
            channel.basicNack(deliveryTag, false, false);
            log.error("Failed to process reservation confirmed message, reservationId={}, error={}", reservationId, ex.getMessage(), ex);
            throw ex;
        }
    }
}
