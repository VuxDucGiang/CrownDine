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

    @Value("${app.rabbitmq.queue.reservation-confirmed-app:crowndine.reservation.confirmed.inapp-notification}")
    private String reservationConfirmedAppQueueName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app:reservation.confirmed.inapp-notification}")
    private String reservationConfirmedAppRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-app-retry:crowndine.reservation.confirmed.inapp-notification.retry}")
    private String reservationConfirmedAppRetryQueueName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app-retry:reservation.confirmed.inapp-notification.retry}")
    private String reservationConfirmedAppRetryRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-app-dlq:crowndine.reservation.confirmed.inapp-notification.dlq}")
    private String reservationConfirmedAppDlqName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-app-dlq:reservation.confirmed.inapp-notification.dlq}")
    private String reservationConfirmedAppDlqRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-email:crowndine.reservation.confirmed.email-notification}")
    private String reservationConfirmedEmailQueueName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email:reservation.confirmed.email-notification}")
    private String reservationConfirmedEmailRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-email-retry:crowndine.reservation.confirmed.email-notification.retry}")
    private String reservationConfirmedEmailRetryQueueName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email-retry:reservation.confirmed.email-notification.retry}")
    private String reservationConfirmedEmailRetryRoutingKey;

    @Value("${app.rabbitmq.queue.reservation-confirmed-email-dlq:crowndine.reservation.confirmed.email-notification.dlq}")
    private String reservationConfirmedEmailDlqName;

    @Value("${app.rabbitmq.routing-key.reservation-confirmed-email-dlq:reservation.confirmed.email-notification.dlq}")
    private String reservationConfirmedEmailDlqRoutingKey;

    @Value("${app.rabbitmq.retry.reservation-confirmed-email.ttl-ms:30000}")
    private Long reservationConfirmedEmailRetryTtlMs;

    @Value("${app.rabbitmq.retry.reservation-confirmed-app.ttl-ms:30000}")
    private Long reservationConfirmedAppRetryTtlMs;

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
    public Queue reservationConfirmedAppQueue() {
        return QueueBuilder.durable(reservationConfirmedAppQueueName)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", reservationConfirmedAppRetryRoutingKey)
                .build();
    }

    @Bean
    public Binding reservationConfirmedAppBinding(Queue reservationConfirmedAppQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedAppQueue).to(crowndineExchange).with(reservationConfirmedAppRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedAppRetryQueue() {
        return QueueBuilder.durable(reservationConfirmedAppRetryQueueName)
                .withArgument("x-message-ttl", reservationConfirmedAppRetryTtlMs)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", reservationConfirmedAppRoutingKey)
                .build();
    }

    @Bean
    public Binding reservationConfirmedAppRetryBinding(Queue reservationConfirmedAppRetryQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedAppRetryQueue).to(crowndineExchange).with(reservationConfirmedAppRetryRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedAppDlq() {
        return QueueBuilder.durable(reservationConfirmedAppDlqName).build();
    }

    @Bean
    public Binding reservationConfirmedAppDlqBinding(Queue reservationConfirmedAppDlq, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedAppDlq).to(crowndineExchange).with(reservationConfirmedAppDlqRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedEmailQueue() {
        return QueueBuilder.durable(reservationConfirmedEmailQueueName)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", reservationConfirmedEmailRetryRoutingKey)
                .build();
    }

    @Bean
    public Binding reservationConfirmedEmailBinding(Queue reservationConfirmedEmailQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedEmailQueue).to(crowndineExchange).with(reservationConfirmedEmailRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedEmailRetryQueue() {
        return QueueBuilder.durable(reservationConfirmedEmailRetryQueueName)
                .withArgument("x-message-ttl", reservationConfirmedEmailRetryTtlMs)
                .withArgument("x-dead-letter-exchange", exchangeName)
                .withArgument("x-dead-letter-routing-key", reservationConfirmedEmailRoutingKey)
                .build();
    }

    @Bean
    public Binding reservationConfirmedEmailRetryBinding(Queue reservationConfirmedEmailRetryQueue, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedEmailRetryQueue).to(crowndineExchange).with(reservationConfirmedEmailRetryRoutingKey);
    }

    @Bean
    public Queue reservationConfirmedEmailDlq() {
        return QueueBuilder.durable(reservationConfirmedEmailDlqName).build();
    }

    @Bean
    public Binding reservationConfirmedEmailDlqBinding(Queue reservationConfirmedEmailDlq, TopicExchange crowndineExchange) {
        return BindingBuilder.bind(reservationConfirmedEmailDlq).to(crowndineExchange).with(reservationConfirmedEmailDlqRoutingKey);
    }
}
