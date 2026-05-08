package com.crowndine.service.impl.mail;

import com.crowndine.service.mail.MailService;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
@Slf4j(topic = "MAIL-SERVICE")
@ConditionalOnProperty(prefix = "app.mail", name = "enabled", havingValue = "false")
public class NoopMailServiceImpl implements MailService {

    @Override
    public void sendConfirmLink(String emailTo, String template, String endPointConfirmUser, String verifyCode) {
        log.info("Mail disabled (perf): skip sendConfirmLink to {}", emailTo);
    }

    @Override
    public void sendResetPasswordLink(String emailTo, String resetPasswordEndpoint, String resetPasswordToken) {
        log.info("Mail disabled (perf): skip sendResetPasswordLink to {}", emailTo);
    }

    @Override
    public void sendReservationSuccessEmail(String emailTo, Map<String, Object> reservationDetails) {
        log.info("Mail disabled (perf): skip sendReservationSuccessEmail to {}", emailTo);
    }

    @Override
    public void sendOtpEmail(String emailTo, String otp) {
        log.info("Mail disabled (perf): skip sendOtpEmail to {}", emailTo);
    }
}
