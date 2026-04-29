package com.crowndine.service.order;

import com.crowndine.common.enums.EPaymentStatus;
import com.crowndine.common.enums.EPaymentTarget;
import com.crowndine.dto.response.OrderCheckoutResponse;
import com.crowndine.model.Order;
import com.crowndine.model.Reservation;
import com.crowndine.model.RestaurantTable;
import com.crowndine.repository.OrderRepository;
import com.crowndine.repository.PaymentRepository;
import com.crowndine.service.impl.order.OrderServiceImpl;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderCheckoutServiceTest {

    @Mock
    private OrderRepository orderRepository;
    @Mock
    private PaymentRepository paymentRepository;

    @InjectMocks
    private OrderServiceImpl orderService;

    private Order order;

    @BeforeEach
    void setUp() {
        RestaurantTable table = new RestaurantTable();
        table.setId(10L);
        table.setBaseDeposit(new BigDecimal("100000"));

        Reservation reservation = new Reservation();
        reservation.setId(20L);
        reservation.setTable(table);

        order = new Order();
        order.setId(1L);
        order.setCode("ORD-001");
        order.setTotalPrice(new BigDecimal("1000000"));
        order.setFinalPrice(new BigDecimal("900000"));
        order.setReservation(reservation);
        order.setVoucher(null);
        order.setRestaurantTable(table);
    }

    @Test
    void getOrderCheckout_shouldCalculateReservationDepositSplitAndFinalAmount() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.sumAmountByTargetAndReservationIdAndStatus(
                EPaymentTarget.RESERVATION, 20L, EPaymentStatus.SUCCESS))
                .thenReturn(new BigDecimal("250000"));

        OrderCheckoutResponse response = orderService.getOrderCheckout(1L);

        assertEquals(new BigDecimal("1000000"), response.getTotalAmount());
        assertEquals(BigDecimal.ZERO, response.getVoucherDiscount());
        assertEquals(new BigDecimal("250000"), response.getDepositedAmount());
        assertEquals(new BigDecimal("100000.00"), response.getTableDepositPaidAmount());
        assertEquals(new BigDecimal("150000.00"), response.getOrderDepositPaidAmount());
        assertEquals(new BigDecimal("750000.00"), response.getFinalAmount());
    }

    @Test
    void getOrderCheckout_shouldClampFinalAmountToZero_whenOrderDepositExceedsOrderFinal() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.sumAmountByTargetAndReservationIdAndStatus(
                EPaymentTarget.RESERVATION, 20L, EPaymentStatus.SUCCESS))
                .thenReturn(new BigDecimal("1200000"));

        OrderCheckoutResponse response = orderService.getOrderCheckout(1L);

        assertEquals(new BigDecimal("100000.00"), response.getTableDepositPaidAmount());
        assertEquals(new BigDecimal("1100000.00"), response.getOrderDepositPaidAmount());
        assertEquals(BigDecimal.ZERO, response.getFinalAmount());
    }

    @Test
    void getOrderCheckout_shouldUseOnlyDepositedAmountAsTableDeposit_whenDepositedLessThanBaseDeposit() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));
        when(paymentRepository.sumAmountByTargetAndReservationIdAndStatus(
                EPaymentTarget.RESERVATION, 20L, EPaymentStatus.SUCCESS))
                .thenReturn(new BigDecimal("50000"));

        OrderCheckoutResponse response = orderService.getOrderCheckout(1L);

        assertEquals(new BigDecimal("50000"), response.getDepositedAmount());
        assertEquals(new BigDecimal("50000"), response.getTableDepositPaidAmount());
        assertEquals(BigDecimal.ZERO, response.getOrderDepositPaidAmount());
        assertEquals(new BigDecimal("900000"), response.getFinalAmount());
    }

    @Test
    void getOrderCheckout_shouldSkipPaymentQuery_whenOrderHasNoReservation() {
        order.setReservation(null);
        when(orderRepository.findById(1L)).thenReturn(Optional.of(order));

        OrderCheckoutResponse response = orderService.getOrderCheckout(1L);

        verify(paymentRepository, org.mockito.Mockito.never())
                .sumAmountByTargetAndReservationIdAndStatus(any(), any(), any());
        assertEquals(BigDecimal.ZERO, response.getDepositedAmount());
        assertEquals(BigDecimal.ZERO, response.getTableDepositPaidAmount());
        assertEquals(BigDecimal.ZERO, response.getOrderDepositPaidAmount());
        assertEquals(new BigDecimal("900000"), response.getFinalAmount());
    }
}
