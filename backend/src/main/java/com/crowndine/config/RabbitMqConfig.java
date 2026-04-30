package com.crowndine.config;

import org.springframework.amqp.core.Binding;
import org.springframework.amqp.core.BindingBuilder;
import org.springframework.amqp.core.Queue;
import org.springframework.amqp.core.TopicExchange;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

@Configuration
public class RabbitMqConfig {

    @Value("${app.rabbitmq.exchange:crowndine.events}")
    private String exchangeName;

    @Value("${app.rabbitmq.queue:crowndine.order.paid}")
    private String queueName;

    @Value("${app.rabbitmq.routing-key:order.paid}")
    private String routingKey;

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
}
