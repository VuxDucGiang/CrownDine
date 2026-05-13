package com.crowndine.service.impl.auth;

import com.crowndine.service.auth.ResetPasswordTokenStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class ResetPasswordTokenStateServiceImpl implements ResetPasswordTokenStateService {
    private static final String RESET_PASSWORD_LATEST_PREFIX = "auth:reset-password:latest:";

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void storeLatestTokenId(String username, String tokenId, Duration ttl) {
        Duration safeTtl = (ttl == null || ttl.isNegative() || ttl.isZero()) ? Duration.ofMinutes(10) : ttl;
        try {
            redisTemplate.opsForValue().set(buildLatestTokenKey(username), tokenId, safeTtl);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when storing reset-password token for user={}. cause={}",
                    username, ex.getMessage());
        }
    }

    @Override
    public boolean isLatestToken(String username, String tokenId) {
        try {
            Object storedTokenId = redisTemplate.opsForValue().get(buildLatestTokenKey(username));
            return StringUtils.hasText(tokenId) && Objects.equals(tokenId, storedTokenId);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when validating reset-password token for user={}. "
                            + "Fallback to JWT validity only. cause={}",
                    username, ex.getMessage());
            return true;
        }
    }

    @Override
    public void clearLatestToken(String username) {
        try {
            redisTemplate.delete(buildLatestTokenKey(username));
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when clearing reset-password token for user={}. cause={}",
                    username, ex.getMessage());
        }
    }

    private String buildLatestTokenKey(String username) {
        return RESET_PASSWORD_LATEST_PREFIX + username;
    }
}
