package com.crowndine.service.auth;

import com.crowndine.presentation.dto.request.*;
import com.crowndine.presentation.dto.response.TokenResponse;
import jakarta.servlet.http.HttpServletRequest;

public interface AuthenticationService {
    TokenResponse accessToken(LoginRequest request, HttpServletRequest httpServletRequest);

    TokenResponse refreshToken(HttpServletRequest request);

    void logout(HttpServletRequest request);

    Long register(RegisterRequest request);

    void forgotPassword(ForgotPasswordRequest request);

    boolean confirmRegister(String verifyCode);

    void verifyResetPasswordToken(String token);

    TokenResponse googleLogin(GoogleLoginRequest request, HttpServletRequest httpServletRequest);

    void resetPassword(String token, ResetPasswordRequest request);

}
