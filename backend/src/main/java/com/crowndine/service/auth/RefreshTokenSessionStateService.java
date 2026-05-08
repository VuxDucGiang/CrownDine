package com.crowndine.service.auth;

import java.time.Duration;

public interface RefreshTokenSessionStateService {
    void storeLatestRefreshTokenId(String username, String deviceId, String tokenId, Duration ttl);

    boolean isLatestRefreshToken(String username, String deviceId, String tokenId);

    void clearSession(String username, String deviceId);
}
