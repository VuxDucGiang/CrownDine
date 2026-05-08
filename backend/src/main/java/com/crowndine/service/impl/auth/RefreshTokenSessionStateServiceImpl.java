package com.crowndine.service.impl.auth;

import com.crowndine.service.auth.RefreshTokenSessionStateService;
import lombok.RequiredArgsConstructor;
import org.springframework.data.redis.core.RedisTemplate;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.time.Duration;
import java.util.Objects;

@Service
@RequiredArgsConstructor
public class RefreshTokenSessionStateServiceImpl implements RefreshTokenSessionStateService {
    private static final String REFRESH_SESSION_PREFIX = "auth:refresh:";
    private static final Duration DEFAULT_REFRESH_TTL = Duration.ofDays(7);

    private final RedisTemplate<String, Object> redisTemplate;

    @Override
    public void storeLatestRefreshTokenId(String username, String deviceId, String tokenId, Duration ttl) {
        Duration safeTtl = (ttl == null || ttl.isNegative() || ttl.isZero()) ? DEFAULT_REFRESH_TTL : ttl;
        redisTemplate.opsForValue().set(buildSessionKey(username, deviceId), tokenId, safeTtl);
    }

    @Override
    public boolean isLatestRefreshToken(String username, String deviceId, String tokenId) {
        if (!StringUtils.hasText(tokenId)) {
            return false;
        }
        Object storedTokenId = redisTemplate.opsForValue().get(buildSessionKey(username, deviceId));
        return Objects.equals(tokenId, storedTokenId);
    }

    @Override
    public void clearSession(String username, String deviceId) {
        redisTemplate.delete(buildSessionKey(username, deviceId));
    }

    private String buildSessionKey(String username, String deviceId) {
        return REFRESH_SESSION_PREFIX + username + ":" + deviceId;
    }
}
