package com.crowndine.service.reservation;

import com.crowndine.common.enums.EReservationStatus;
import com.crowndine.exception.InvalidDataException;
import com.crowndine.model.Reservation;
import com.crowndine.model.User;
import com.crowndine.repository.ReservationRepository;
import com.crowndine.repository.RestaurantTableRepository;
import com.crowndine.repository.UserRepository;
import com.crowndine.service.impl.reservation.ReservationLifecycleServiceImpl;
import com.crowndine.service.order.OrderService;
import com.crowndine.service.reservation.event.ReservationCancelledEvent;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.context.ApplicationEventPublisher;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ReservationLifecycleServiceTest {

    @Mock
    private ReservationRepository reservationRepository;
    @Mock
    private UserRepository userRepository;
    @Mock
    private RestaurantTableRepository tableRepository;
    @Mock
    private OrderService orderService;
    @Mock
    private ReservationTimePolicy reservationTimePolicy;
    @Mock
    private ReservationAvailabilityService reservationAvailabilityService;
    @Mock
    private ReservationOrderService reservationOrderService;
    @Mock
    private ApplicationEventPublisher eventPublisher;

    @InjectMocks
    private ReservationLifecycleServiceImpl reservationLifecycleService;

    private Reservation reservation;

    @BeforeEach
    void setUp() {
        reservation = new Reservation();
        reservation.setId(1L);
        reservation.setDate(LocalDate.now());
        reservation.setStartTime(LocalTime.of(18, 0));
        reservation.setStatus(EReservationStatus.CONFIRMED);
    }

    @Test
    void checkInReservation_shouldSetCheckedIn_whenConfirmedWithinWindow() {
        User user = new User();
        user.setUsername("staff");

        LocalDateTime now = LocalDateTime.now();
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(user));
        when(reservationTimePolicy.toStartDateTime(reservation.getDate(), reservation.getStartTime())).thenReturn(now);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationLifecycleService.checkInReservation(1L, "staff");

        assertEquals(EReservationStatus.CHECKED_IN, reservation.getStatus());
        verify(reservationRepository).save(reservation);
    }

    @Test
    void checkInReservation_shouldThrow_whenOutsideWindow() {
        User user = new User();
        user.setUsername("staff");

        LocalDateTime tooOld = LocalDateTime.now().minusMinutes(20);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(userRepository.findByUsername("staff")).thenReturn(Optional.of(user));
        when(reservationTimePolicy.toStartDateTime(reservation.getDate(), reservation.getStartTime())).thenReturn(tooOld);

        assertThrows(InvalidDataException.class, () -> reservationLifecycleService.checkInReservation(1L, "staff"));
        verify(reservationRepository, never()).save(any(Reservation.class));
    }

    @Test
    void markReservationNoShow_shouldSetNoShowAndPublishEvent_whenGraceElapsed() {
        LocalDateTime started16MinutesAgo = LocalDateTime.now().minusMinutes(16);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationTimePolicy.toStartDateTime(reservation.getDate(), reservation.getStartTime()))
                .thenReturn(started16MinutesAgo);
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationLifecycleService.markReservationNoShow(1L);

        assertEquals(EReservationStatus.NO_SHOW, reservation.getStatus());
        verify(reservationRepository).save(reservation);

        ArgumentCaptor<ReservationCancelledEvent> eventCaptor = ArgumentCaptor.forClass(ReservationCancelledEvent.class);
        verify(eventPublisher).publishEvent(eventCaptor.capture());
        assertEquals(1L, eventCaptor.getValue().reservationId());
    }

    @Test
    void markReservationNoShow_shouldDoNothing_whenGraceNotElapsed() {
        LocalDateTime started10MinutesAgo = LocalDateTime.now().minusMinutes(10);
        when(reservationRepository.findById(1L)).thenReturn(Optional.of(reservation));
        when(reservationTimePolicy.toStartDateTime(reservation.getDate(), reservation.getStartTime()))
                .thenReturn(started10MinutesAgo);

        reservationLifecycleService.markReservationNoShow(1L);

        assertEquals(EReservationStatus.CONFIRMED, reservation.getStatus());
        verify(reservationRepository, never()).save(any(Reservation.class));
        verify(eventPublisher, never()).publishEvent(any());
    }

    @Test
    void markNoShowDueReservations_shouldProcessCandidates() {
        Reservation r1 = new Reservation();
        r1.setId(11L);
        r1.setStatus(EReservationStatus.CONFIRMED);
        r1.setDate(LocalDate.now());
        r1.setStartTime(LocalTime.now());

        Reservation r2 = new Reservation();
        r2.setId(12L);
        r2.setStatus(EReservationStatus.CONFIRMED);
        r2.setDate(LocalDate.now());
        r2.setStartTime(LocalTime.now());

        when(reservationRepository.findNoShowCandidates(any(), any(), any())).thenReturn(List.of(r1, r2));
        when(reservationRepository.findById(11L)).thenReturn(Optional.of(r1));
        when(reservationRepository.findById(12L)).thenReturn(Optional.of(r2));
        when(reservationTimePolicy.toStartDateTime(any(), any())).thenReturn(LocalDateTime.now().minusMinutes(20));
        when(reservationRepository.save(any(Reservation.class))).thenAnswer(invocation -> invocation.getArgument(0));

        reservationLifecycleService.markNoShowDueReservations();

        verify(reservationRepository).save(r1);
        verify(reservationRepository).save(r2);
        verify(eventPublisher, times(2)).publishEvent(any(ReservationCancelledEvent.class));
    }
}
