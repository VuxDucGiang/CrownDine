package com.crowndine.service.impl.auth;

import com.crowndine.service.auth.RefreshTokenSessionStateService;
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
public class RefreshTokenSessionStateServiceImpl implements RefreshTokenSessionStateService {
    private static final String REFRESH_SESSION_PREFIX = "auth:refresh:";
    private static final Duration DEFAULT_REFRESH_TTL = Duration.ofDays(7);

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void storeLatestRefreshTokenId(String username, String deviceId, String tokenId, Duration ttl) {
        Duration safeTtl = (ttl == null || ttl.isNegative() || ttl.isZero()) ? DEFAULT_REFRESH_TTL : ttl;
        try {
            redisTemplate.opsForValue().set(buildSessionKey(username, deviceId), tokenId, safeTtl);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when storing refresh token session for user={}, deviceId={}. cause={}",
                    username, deviceId, ex.getMessage());
        }
    }

    @Override
    public boolean isLatestRefreshToken(String username, String deviceId, String tokenId) {
        if (!StringUtils.hasText(tokenId)) {
            return false;
        }
        try {
            Object storedTokenId = redisTemplate.opsForValue().get(buildSessionKey(username, deviceId));
            return Objects.equals(tokenId, storedTokenId);
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when validating refresh token session for user={}, deviceId={}. "
                            + "Fallback to DB token checks. cause={}",
                    username, deviceId, ex.getMessage());
            return true;
        }
    }

    @Override
    public void clearSession(String username, String deviceId) {
        try {
            redisTemplate.delete(buildSessionKey(username, deviceId));
        } catch (RuntimeException ex) {
            log.warn("Redis unavailable when clearing refresh token session for user={}, deviceId={}. cause={}",
                    username, deviceId, ex.getMessage());
        }
    }

    private String buildSessionKey(String username, String deviceId) {
        return REFRESH_SESSION_PREFIX + username + ":" + deviceId;
    }
}
