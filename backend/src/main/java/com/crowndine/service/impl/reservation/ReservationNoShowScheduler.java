package com.crowndine.service.impl.reservation;

import com.crowndine.service.reservation.ReservationLifecycleService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-NO-SHOW-SCHEDULER")
public class ReservationNoShowScheduler {

    private final ReservationLifecycleService reservationLifecycleService;

    /**
     * Quét reservation CONFIRMED quá 15 phút sau giờ hẹn để tự động đánh dấu NO_SHOW.
     */
    @Scheduled(fixedDelay = 60000)
    public void markNoShowReservations() {
        reservationLifecycleService.markNoShowDueReservations();
    }
}
