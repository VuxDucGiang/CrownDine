package com.crowndine.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.QueueBuilder;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${app.rabbitmq.exchange:crowndine.events}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue.order-paid:crowndine.order.paid}")
    private String queueName;

    @Value("${app.rabbitmq.routing-key.order-paid:order.paid}")
    private String routingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed:crowndine.reservation.confirmed}")
    private String reservationConfirmedQueueName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed:reservation.confirmed}")
    private String reservationConfirmedRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-dlq:crowndine.reservation.confirmed.dlq}")
    private String reservationConfirmedDlqName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-dlq:reservation.confirmed.dlq}")
    private String reservationConfirmedDlqRoutingKey;

    @Bean
    public TopicExchange crowndineExchange() {
        return new TopicExchange(exchangeName, true, false);
    }

    @Bean
    public Queue orderPaidQueue() {
        return new Queue(queueName, true);
    }

    @Bean
    public Binding orderPaidBinding(Queue orderPaidQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(orderPaidQueue).to(crowndineExchange).with(routingKey);
    }

    @Bean
    public Queue reservationConfirmedQueue() {
        return QueueBuilder.durable(reservationConfirmedQueueName)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", reservationConfirmedDlqRoutingKey)
                .build();
    }

    @Bean
    public Binding reservationConfirmedBinding(Queue reservationConfirmedQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedQueue).to(crowndineExchange).with(reservationConfirmedRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedDlq() {
        return QueueBuilder.durable(reservationConfirmedDlqName).build();
    }

    @Bean
    public Binding reservationConfirmedDlqBinding(Queue reservationConfirmedDlq, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedDlq).to(crowndineExchange).with(reservationConfirmedDlqRoutingKey);
    }
}
