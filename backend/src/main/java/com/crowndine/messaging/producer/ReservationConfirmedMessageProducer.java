package com.crowndine.messaging.producer;

import com.crowndine.messaging.event.ReservationConfirmedEvent;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.amqp.rabbit.core.RabbitTemplate;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.event.TransactionPhase;
import org.springframework.transaction.event.TransactionalEventListener;

@Component
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-CONFIRMED-MESSAGE-PRODUCER")
public class ReservationConfirmedMessageProducer {

    private final RabbitTemplate rabbitTemplate;

    @Value("${app.rabbitmq.exchange:crowndine.events}")
    private String exchangeName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app:reservation.confirmed.inapp-notification}")
    private String reservationConfirmedAppRoutingKey;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email:reservation.confirmed.email-notification}")
    private String reservationConfirmedEmailRoutingKey;

    @TransactionalEventListener(phase = TransactionPhase.AFTER_COMMIT)
    public void handle(ReservationConfirmedEvent event) {
        rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedAppRoutingKey, event.reservationId());
        rabbitTemplate.convertAndSend(exchangeName, reservationConfirmedEmailRoutingKey, event.reservationId());
        log.info("Published reservation confirmed app/email messages to RabbitMQ for reservation id {}", event.reservationId());
    }
}
