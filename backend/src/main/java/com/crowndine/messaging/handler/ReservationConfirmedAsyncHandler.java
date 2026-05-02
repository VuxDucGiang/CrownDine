package com.crowndine.messaging.handler;

public interface ReservationConfirmedAsyncHandler {
    void handleReservationConfirmed(Long reservationId);
}
