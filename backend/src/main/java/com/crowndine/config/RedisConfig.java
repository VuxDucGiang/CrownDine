package com.crowndine.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.cache.Cache;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.CachingConfigurer;
import org.springframework.cache.interceptor.CacheErrorHandler;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;
import org.springframework.data.redis.serializer.StringRedisSerializer;

import java.time.Duration;
import java.util.Map;

@Configuration
@EnableCaching
@Slf4j
public class RedisConfig implements CachingConfigurer {
    private static final Duration DEFAULT_CACHE_TTL = Duration.ofMinutes(10);
    private static final Duration ITEM_CACHE_TTL = Duration.ofHours(1);
    private static final Duration COMBO_CACHE_TTL = Duration.ofHours(1);
    private static final Duration CATEGORY_CACHE_TTL = Duration.ofHours(1);

    private static final String ITEMS_CACHE = "items";
    private static final String ITEM_BY_ID_CACHE = "item-by-id";
    private static final String ITEM_BY_NAME_CACHE = "item-by-name";
    private static final String COMBOS_CACHE = "combos";
    private static final String COMBO_BY_ID_CACHE = "combo-by-id";
    private static final String COMBO_BY_NAME_CACHE = "combo-by-name";
    private static final String TOP_SELLING_COMBOS_CACHE = "top-selling-combos";
    private static final String CATEGORIES_CACHE = "categories";
    private static final String CATEGORY_BY_ID_CACHE = "category-by-id";

    @Bean
    public RedisTemplate<String, Object> redisTemplate(RedisConnectionFactory connectionFactory) {
        RedisTemplate<String, Object> template = new RedisTemplate<>();
        template.setConnectionFactory(connectionFactory);

        StringRedisSerializer keySerializer = new StringRedisSerializer();
        GenericJackson2JsonRedisSerializer valueSerializer = new GenericJackson2JsonRedisSerializer();

        template.setKeySerializer(keySerializer);
        template.setHashKeySerializer(keySerializer);
        template.setValueSerializer(valueSerializer);
        template.setHashValueSerializer(valueSerializer);
        template.afterPropertiesSet();
        return template;
    }

    @Bean
    public CacheManager cacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaultCacheConfiguration = RedisCacheConfiguration.defaultCacheConfig()
                .entryTtl(DEFAULT_CACHE_TTL)
                .disableCachingNullValues()
                .serializeKeysWith(RedisSerializationContext.SerializationPair.fromSerializer(new StringRedisSerializer()))
                .serializeValuesWith(RedisSerializationContext.SerializationPair.fromSerializer(
                        new GenericJackson2JsonRedisSerializer()
                ));

        RedisCacheConfiguration itemCacheConfiguration = defaultCacheConfiguration
                .entryTtl(ITEM_CACHE_TTL);
        RedisCacheConfiguration comboCacheConfiguration = defaultCacheConfiguration
                .entryTtl(COMBO_CACHE_TTL);
        RedisCacheConfiguration categoryCacheConfiguration = defaultCacheConfiguration
                .entryTtl(CATEGORY_CACHE_TTL);

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaultCacheConfiguration)
                .withInitialCacheConfigurations(Map.of(
                        ITEMS_CACHE, itemCacheConfiguration,
                        ITEM_BY_ID_CACHE, itemCacheConfiguration,
                        ITEM_BY_NAME_CACHE, itemCacheConfiguration,
                        COMBOS_CACHE, comboCacheConfiguration,
                        COMBO_BY_ID_CACHE, comboCacheConfiguration,
                        COMBO_BY_NAME_CACHE, comboCacheConfiguration,
                        TOP_SELLING_COMBOS_CACHE, comboCacheConfiguration,
                        CATEGORIES_CACHE, categoryCacheConfiguration,
                        CATEGORY_BY_ID_CACHE, categoryCacheConfiguration
                ))
                .transactionAware()
                .build();
    }

    @Override
    @Bean
    public CacheErrorHandler errorHandler() {
        return new CacheErrorHandler() {
            @Override
            public void handleCacheGetError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis cache GET failed on cache={}, key={}. Fallback to DB. cause={}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCachePutError(RuntimeException exception, Cache cache, Object key, Object value) {
                log.warn("Redis cache PUT failed on cache={}, key={}. Skip cache write. cause={}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCacheEvictError(RuntimeException exception, Cache cache, Object key) {
                log.warn("Redis cache EVICT failed on cache={}, key={}. cause={}",
                        cacheName(cache), key, exception.getMessage());
            }

            @Override
            public void handleCacheClearError(RuntimeException exception, Cache cache) {
                log.warn("Redis cache CLEAR failed on cache={}. cause={}",
                        cacheName(cache), exception.getMessage());
            }

            private String cacheName(Cache cache) {
                return cache != null ? cache.getName() : "unknown";
            }
        };
    }
}
