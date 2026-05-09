package com.crowndine.integration.service.reservation;

import com.crowndine.common.enums.EReservationStatus;
import com.crowndine.common.enums.ETableShape;
import com.crowndine.common.enums.ETableStatus;
import com.crowndine.exception.ReservationConflictException;
import com.crowndine.model.Reservation;
import com.crowndine.model.RestaurantTable;
import com.crowndine.repository.ReservationRepository;
import com.crowndine.repository.RestaurantTableRepository;
import com.crowndine.service.reservation.ReservationAvailabilityService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.LocalTime;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class ReservationAvailabilityIntegrationTest {

    @Autowired
    private ReservationAvailabilityService reservationAvailabilityService;

    @Autowired
    private ReservationRepository reservationRepository;

    @Autowired
    private RestaurantTableRepository restaurantTableRepository;

    @BeforeEach
    void cleanUp() {
        reservationRepository.deleteAll();
        restaurantTableRepository.deleteAll();
    }

    @Test
    void ensureTableAvailable_shouldThrow_whenSameTableAndTimeOverlap() {
        RestaurantTable table = createTable("T-01");
        LocalDate date = LocalDate.now().plusDays(1);
        LocalTime time = LocalTime.of(18, 0);
        createReservation(table, EReservationStatus.CONFIRMED, date, time, null);
        Long tableId = table.getId();


        assertThrows(ReservationConflictException.class,
                () -> reservationAvailabilityService.ensureTableAvailable(date, time, tableId));
    }

    @Test
    void ensureTableAvailable_shouldPass_whenPendingReservationExpired() {
        RestaurantTable table = createTable("T-02");
        createReservation(
                table,
                EReservationStatus.PENDING,
                LocalDate.now().plusDays(1),
                LocalTime.of(18, 0),
                LocalDateTime.now().minusMinutes(1)
        );

        assertDoesNotThrow(() -> reservationAvailabilityService.ensureTableAvailable(
                LocalDate.now().plusDays(1),
                LocalTime.of(18, 0),
                table.getId()
        ));
    }

    private RestaurantTable createTable(String name) {
        RestaurantTable table = new RestaurantTable();
        table.setName(name);
        table.setCapacity(4);
        table.setBaseDeposit(new BigDecimal("100000"));
        table.setShape(ETableShape.SQUARE);
        table.setStatus(ETableStatus.AVAILABLE);
        table.setPositionX(0);
        table.setPositionY(0);
        table.setWidth(120);
        table.setHeight(120);
        table.setRotation(0);
        return restaurantTableRepository.save(table);
    }

    private void createReservation(
            RestaurantTable table,
            EReservationStatus status,
            LocalDate date,
            LocalTime startTime,
            LocalDateTime expiratedAt
    ) {
        Reservation reservation = new Reservation();
        reservation.setTable(table);
        reservation.setStatus(status);
        reservation.setDate(date);
        reservation.setStartTime(startTime);
        reservation.setEndTime(startTime.plusHours(4));
        reservation.setGuestNumber(2);
        reservation.setCode("TEST-RES-" + System.nanoTime());
        reservation.setExpiratedAt(expiratedAt);
        reservationRepository.save(reservation);
    }
}
