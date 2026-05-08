package com.crowndine.messaging.handler;

import com.crowndine.service.notification.NotificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Propagation;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class ReservationConfirmedAppNotificationHandler {

    private final NotificationService notificationService;

    @Value("${app.rabbitmq.test.force-fail-reservation-confirmed-app:false}")
    private boolean forceFailReservationConfirmedApp;

    @Transactional(propagation = Propagation.REQUIRES_NEW)
    public void handle(Long reservationId) {
        if (forceFailReservationConfirmedApp) {
            throw new RuntimeException("DLQ_TEST_FORCE_FAIL_RESERVATION_CONFIRMED_APP");
        }
        notificationService.notifyReservationConfirmed(reservationId);
    }
}
