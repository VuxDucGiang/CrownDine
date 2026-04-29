package com.crowndine.service.order;

import com.crowndine.common.enums.EOrderStatus;
import com.crowndine.common.enums.ETableStatus;
import com.crowndine.dto.response.UpdateStatusOrderResponse;
import com.crowndine.exception.ResourceNotFoundException;
import com.crowndine.model.Order;
import com.crowndine.model.RestaurantTable;
import com.crowndine.repository.OrderRepository;
import com.crowndine.service.impl.order.OrderStatusServiceImpl;
import com.crowndine.service.layout.RestaurantTableStateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.messaging.simp.SimpMessagingTemplate;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class OrderStatusServiceTest {

    @Mock
    private OrderRepository orderRepository;

    @Mock
    private RestaurantTableStateService restaurantTableStateService;

    @Mock
    private SimpMessagingTemplate messagingTemplate;

    @InjectMocks
    private OrderStatusServiceImpl orderStatusService;

    private Order baseOrder;

    @BeforeEach
    void setUp() {
        RestaurantTable table = new RestaurantTable();
        table.setId(10L);

        baseOrder = new Order();
        baseOrder.setId(1L);
        baseOrder.setRestaurantTable(table);
        baseOrder.setStatus(EOrderStatus.PRE_ORDER);
    }

    @Test
    void updateOrderStatus_shouldSetTableOccupied_whenConfirmed() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        UpdateStatusOrderResponse response = orderStatusService.updateOrderStatus(1L, EOrderStatus.CONFIRMED);

        assertEquals(1L, response.getId());
        assertEquals(EOrderStatus.CONFIRMED, response.getStatus());
        verify(restaurantTableStateService).changeStatus(10L, ETableStatus.OCCUPIED);
    }

    @Test
    void updateOrderStatus_shouldSetTableOccupied_whenInProgress() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderStatusService.updateOrderStatus(1L, EOrderStatus.IN_PROGRESS);

        verify(restaurantTableStateService).changeStatus(10L, ETableStatus.OCCUPIED);
    }

    @Test
    void updateOrderStatus_shouldSetTableAvailable_whenCompleted() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderStatusService.updateOrderStatus(1L, EOrderStatus.COMPLETED);

        verify(restaurantTableStateService).changeStatus(10L, ETableStatus.AVAILABLE);
    }

    @Test
    void updateOrderStatus_shouldSetTableAvailable_whenCancelled() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderStatusService.updateOrderStatus(1L, EOrderStatus.CANCELLED, "Customer no-show");

        verify(restaurantTableStateService).changeStatus(10L, ETableStatus.AVAILABLE);
    }

    @Test
    void updateOrderStatus_shouldThrowResourceNotFound_whenOrderIdNotExists() {
        when(orderRepository.findById(999L)).thenReturn(Optional.empty());

        assertThrows(ResourceNotFoundException.class,
                () -> orderStatusService.updateOrderStatus(999L, EOrderStatus.CONFIRMED));

        verify(orderRepository, never()).save(any(Order.class));
        verify(restaurantTableStateService, never()).changeStatus(any(Long.class), any(ETableStatus.class));
        verify(messagingTemplate, never()).convertAndSend(any(String.class), any(Object.class));
    }

    @Test
    void updateOrderStatus_shouldPublishTopicOrders_withCorrectPayload() {
        when(orderRepository.findById(1L)).thenReturn(Optional.of(baseOrder));
        when(orderRepository.save(any(Order.class))).thenAnswer(invocation -> invocation.getArgument(0));

        orderStatusService.updateOrderStatus(1L, EOrderStatus.CONFIRMED);

        ArgumentCaptor<UpdateStatusOrderResponse> payloadCaptor = ArgumentCaptor.forClass(UpdateStatusOrderResponse.class);
        verify(messagingTemplate).convertAndSend(org.mockito.ArgumentMatchers.eq("/topic/orders"), payloadCaptor.capture());

        UpdateStatusOrderResponse payload = payloadCaptor.getValue();
        assertEquals(1L, payload.getId());
        assertEquals(EOrderStatus.CONFIRMED, payload.getStatus());
    }
}
