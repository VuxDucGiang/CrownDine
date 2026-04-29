package com.crowndine.service.reservation;

import com.crowndine.exception.InvalidDataException;
import com.crowndine.model.Reservation;
import com.crowndine.model.RestaurantTable;
import com.crowndine.repository.ReservationRepository;
import com.crowndine.service.impl.reservation.ReservationAvailabilityServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationAvailabilityServiceTest {

    @Mock
    private ReservationRepository reservationRepository;

    @Mock
    private ReservationTimePolicy reservationTimePolicy;

    @Mock
    private ReservationOverlapService reservationOverlapService;

    @InjectMocks
    private ReservationAvailabilityServiceImpl reservationAvailabilityService;

    private LocalDate date;
    private LocalTime startTime;
    private LocalDateTime requestedStart;

    @BeforeEach
    void setUp() {
        date = LocalDate.of(2026, 5, 1);
        startTime = LocalTime.of(18, 0);
        requestedStart = LocalDateTime.of(2026, 5, 1, 18, 0);
    }

    @Test
    void ensureTableAvailable_shouldThrowWhenBlockingReservationExists() {
        Reservation blocking = reservation(100L, 10L);
        when(reservationTimePolicy.toStartDateTime(date, startTime)).thenReturn(requestedStart);
        when(reservationRepository.findBlockingReservations(eq(date), eq(List.of(10L)), any(), any()))
                .thenReturn(List.of(blocking));
        when(reservationOverlapService.isBlockingReservation(blocking, requestedStart)).thenReturn(true);

        assertThrows(InvalidDataException.class,
                () -> reservationAvailabilityService.ensureTableAvailable(date, startTime, 10L));
    }

    @Test
    void ensureTableAvailable_shouldPassWhenNoBlockingReservation() {
        Reservation candidate = reservation(101L, 10L);
        when(reservationTimePolicy.toStartDateTime(date, startTime)).thenReturn(requestedStart);
        when(reservationRepository.findBlockingReservations(eq(date), eq(List.of(10L)), any(), any()))
                .thenReturn(List.of(candidate));
        when(reservationOverlapService.isBlockingReservation(candidate, requestedStart)).thenReturn(false);

        reservationAvailabilityService.ensureTableAvailable(date, startTime, 10L);

        verify(reservationOverlapService).isBlockingReservation(candidate, requestedStart);
    }

    @Test
    void ensureTableAvailable_shouldIgnoreExcludedReservationId() {
        Reservation self = reservation(200L, 10L);
        when(reservationTimePolicy.toStartDateTime(date, startTime)).thenReturn(requestedStart);
        when(reservationRepository.findBlockingReservations(eq(date), eq(List.of(10L)), any(), any()))
                .thenReturn(List.of(self));

        reservationAvailabilityService.ensureTableAvailable(date, startTime, 10L, 200L);

        verify(reservationOverlapService, never()).isBlockingReservation(any(), any());
    }

    @Test
    void findBlockedTableIds_shouldReturnOnlyOverlappingTables() {
        Reservation r1 = reservation(301L, 10L);
        Reservation r2 = reservation(302L, 11L);
        when(reservationTimePolicy.toStartDateTime(date, startTime)).thenReturn(requestedStart);
        when(reservationRepository.findBlockingReservations(eq(date), eq(List.of(10L, 11L)), any(), any()))
                .thenReturn(List.of(r1, r2));
        when(reservationOverlapService.isBlockingReservation(r1, requestedStart)).thenReturn(true);
        when(reservationOverlapService.isBlockingReservation(r2, requestedStart)).thenReturn(false);

        Set<Long> blocked = reservationAvailabilityService.findBlockedTableIds(date, startTime, List.of(10L, 11L));

        assertEquals(1, blocked.size());
        assertTrue(blocked.contains(10L));
    }

    @Test
    void findBlockedTableIds_shouldReturnEmptyWhenTableIdsEmpty() {
        Set<Long> blocked = reservationAvailabilityService.findBlockedTableIds(date, startTime, List.of());
        assertTrue(blocked.isEmpty());
        verify(reservationRepository, never()).findBlockingReservations(any(), any(), any(), any());
    }

    private Reservation reservation(Long reservationId, Long tableId) {
        RestaurantTable table = new RestaurantTable();
        table.setId(tableId);

        Reservation reservation = new Reservation();
        reservation.setId(reservationId);
        reservation.setTable(table);
        return reservation;
    }
}
