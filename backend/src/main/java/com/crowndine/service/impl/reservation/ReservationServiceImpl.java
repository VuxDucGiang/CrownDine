package com.crowndine.service.impl.reservation;

import com.crowndine.common.enums.EReservationStatus;
import com.crowndine.dto.response.*;
import com.crowndine.exception.ResourceNotFoundException;
import com.crowndine.model.Order;
import com.crowndine.model.OrderDetail;
import com.crowndine.model.Reservation;
import com.crowndine.model.User;
import com.crowndine.model.Feedback;
import com.crowndine.repository.FeedbackRepository;
import com.crowndine.repository.OrderDetailRepository;
import com.crowndine.repository.OrderRepository;
import com.crowndine.repository.ReservationRepository;
import com.crowndine.repository.UserRepository;
import com.crowndine.service.reservation.ReservationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-SERVICE")
public class ReservationServiceImpl implements ReservationService {
    private static final long EDIT_WINDOW_HOURS = 24;

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final OrderDetailRepository orderDetailRepository;
    private final OrderRepository orderRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    public PageResponse<ReservationResponse> getAllReservations(LocalDate fromDate, LocalDate toDate, EReservationStatus status, int page, int size) {
        int pageNumber = (page > 0) ? page - 1 : 0;
        Pageable pageable = PageRequest.of(pageNumber, size, Sort.by(Sort.Order.desc("date"), Sort.Order.desc("startTime")));
        Page<Reservation> reservationPage = reservationRepository.findReservations(fromDate, toDate, status, pageable);

        List<ReservationResponse> data = reservationPage.getContent().stream()
                .map(this::toReservationResponse)
                .toList();

        return PageResponse.<ReservationResponse>builder()
                .page(reservationPage.getNumber() + 1)
                .pageSize(reservationPage.getSize())
                .totalPages(reservationPage.getTotalPages())
                .totalItems(reservationPage.getTotalElements())
                .data(data)
                .build();
    }

    @Override
    public PageResponse<ReservationHistoryResponse> getReservationHistory(String username, int page, int size) {
        User user = getUserByUserName(username);

        List<ReservationHistoryResponse> reservationHistory = reservationRepository.findAllByUser_Id(user.getId()).stream()
                .map(this::toHistoryResponse)
                .toList();

        List<ReservationHistoryResponse> standaloneOrderHistory = orderRepository.findAllByUser_IdAndReservationIsNull(user.getId()).stream()
                .map(this::fromStandaloneOrderToHistoryResponse)
                .toList();

        List<ReservationHistoryResponse> allHistory = new ArrayList<>(reservationHistory);
        allHistory.addAll(standaloneOrderHistory);
        allHistory.sort((left, right) -> {
            java.time.LocalDateTime leftCreated = left.getCreatedAt() != null ? left.getCreatedAt() : java.time.LocalDateTime.MIN;
            java.time.LocalDateTime rightCreated = right.getCreatedAt() != null ? right.getCreatedAt() : java.time.LocalDateTime.MIN;
            return rightCreated.compareTo(leftCreated);
        });

        int totalItems = allHistory.size();
        int totalPages = (int) Math.ceil((double) totalItems / size);
        int fromIndex = page * size;
        int toIndex = Math.min(fromIndex + size, totalItems);

        List<ReservationHistoryResponse> pagedData = fromIndex < totalItems
                ? allHistory.subList(fromIndex, toIndex)
                : Collections.emptyList();

        return PageResponse.<ReservationHistoryResponse>builder()
                .page(page + 1)
                .pageSize(size)
                .totalPages(totalPages)
                .totalItems(totalItems)
                .data(pagedData)
                .build();
    }

    @Override
    public Reservation getReservationByCode(String code) {
        return reservationRepository.findByCode(code).orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    @Override
    public Reservation getReservationById(Long reservationId) {
        return reservationRepository.findById(reservationId).orElseThrow(() -> new ResourceNotFoundException("Reservation not found"));
    }

    private User getUserByUserName(String username) {
        return userRepository.findByUsername(username).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    }

    private ReservationResponse toReservationResponse(Reservation reservation) {
        ReservationResponse response = new ReservationResponse();
        response.setId(reservation.getId());
        response.setCode(reservation.getCode());
        response.setDate(reservation.getDate());
        response.setStartTime(reservation.getStartTime());
        response.setEndTime(reservation.getEndTime());
        response.setGuestNumber(reservation.getGuestNumber());
        response.setNote(reservation.getNote());
        response.setStatus(reservation.getStatus());
        if (reservation.getTable() != null) {
            response.setTableName(reservation.getTable().getName());
            if (reservation.getTable().getArea() != null) {
                response.setAreaName(reservation.getTable().getArea().getName());
                if (reservation.getTable().getArea().getFloor() != null) {
                    response.setFloorName(reservation.getTable().getArea().getFloor().getName());
                }
            }
        }

        if (reservation.getUser() != null) {
            response.setCustomerName(reservation.getUser().getFullName());
            response.setPhone(reservation.getUser().getPhone());
            response.setEmail(reservation.getUser().getEmail());
        } else {
            response.setCustomerName(reservation.getGuestName());
            response.setPhone(reservation.getGuestPhone());
        }
        response.setGuestName(reservation.getGuestName());
        response.setCreatedByStaffName(reservation.getCreatedByStaff() != null ? reservation.getCreatedByStaff().getFullName() : null);

        if (reservation.getOrder() != null) {
            response.setOrderId(reservation.getOrder().getId());
            List<OrderDetailResponse> orderDetails = orderDetailRepository.findByOrder_Id(reservation.getOrder().getId()).stream()
                    .map(this::toOrderDetailResponse)
                    .toList();
            response.setOrderDetails(orderDetails);
        } else {
            response.setOrderId(null);
            response.setOrderDetails(List.of());
        }

        return response;
    }

    private OrderDetailResponse toOrderDetailResponse(OrderDetail orderDetail) {
        OrderDetailResponse response = new OrderDetailResponse();
        response.setId(orderDetail.getId());
        response.setQuantity(orderDetail.getQuantity());
        response.setNote(orderDetail.getNote());
        response.setStatus(orderDetail.getStatus());
        response.setTotalPrice(orderDetail.getTotalPrice());

        if (orderDetail.getItem() != null) {
            ItemResponse itemResponse = ItemResponse.builder()
                    .id(orderDetail.getItem().getId())
                    .name(orderDetail.getItem().getName())
                    .price(orderDetail.getItem().getPrice())
                    .build();
            response.setItem(itemResponse);
        }

        if (orderDetail.getCombo() != null) {
            ComboResponse comboResponse = ComboResponse.builder()
                    .id(orderDetail.getCombo().getId())
                    .name(orderDetail.getCombo().getName())
                    .price(orderDetail.getCombo().getPrice())
                    .build();
            response.setCombo(comboResponse);
        }

        return response;
    }

    private ReservationHistoryResponse toHistoryResponse(Reservation reservation) {
        ReservationHistoryResponse response = new ReservationHistoryResponse();
        response.setReservationId(reservation.getId());
        response.setReservationCode(reservation.getCode());
        response.setCustomerName(reservation.getUser() != null ? reservation.getUser().getFullName() : reservation.getGuestName());
        response.setGuestName(reservation.getGuestName());
        response.setCreatedByStaffName(reservation.getCreatedByStaff() != null ? reservation.getCreatedByStaff().getFullName() : null);
        response.setDate(reservation.getDate());
        response.setStartTime(reservation.getStartTime());
        response.setEndTime(reservation.getEndTime());
        response.setGuestNumber(reservation.getGuestNumber());
        response.setReservationStatus(reservation.getStatus());
        response.setTableName(reservation.getTable() != null ? reservation.getTable().getName() : null);
        response.setCreatedAt(reservation.getCreatedAt());

        Order order = reservation.getOrder();
        if (order != null) {
            response.setOrderId(order.getId());
            response.setOrderStatus(order.getStatus());
            response.setFinalPrice(order.getFinalPrice());

            Long userId = reservation.getUser() != null ? reservation.getUser().getId() : null;
            List<OrderLineResponse> items = orderDetailRepository.findByOrder_Id(order.getId()).stream()
                    .map(orderDetail -> toLineResponse(orderDetail, userId))
                    .toList();
            response.setItems(items);
            response.setHasGeneralFeedback(
                    userId != null && feedbackRepository.existsByUser_IdAndOrder_IdAndOrderDetailIsNull(userId, order.getId())
            );
            if (userId != null) {
                feedbackRepository.findByUser_IdAndOrder_IdAndOrderDetailIsNull(userId, order.getId()).ifPresent(feedback -> {
                    response.setGeneralFeedback(toFeedbackSummary(feedback));
                    response.setCanEditGeneralFeedback(canEditFeedback(feedback));
                });
            }
        }

        return response;
    }

    private ReservationHistoryResponse fromStandaloneOrderToHistoryResponse(Order order) {
        ReservationHistoryResponse response = new ReservationHistoryResponse();
        response.setReservationId(null);
        response.setReservationCode(null);
        response.setDate(order.getCreatedAt().toLocalDate());
        response.setStartTime(order.getCreatedAt().toLocalTime());
        response.setEndTime(order.getCreatedAt().toLocalTime().plusHours(1));
        response.setGuestNumber(0);
        response.setCreatedAt(order.getCreatedAt());

        if (order.getStatus() == com.crowndine.common.enums.EOrderStatus.COMPLETED) {
            response.setReservationStatus(EReservationStatus.COMPLETED);
        } else if (order.getStatus() == com.crowndine.common.enums.EOrderStatus.CANCELLED) {
            response.setReservationStatus(EReservationStatus.CANCELLED);
        } else {
            response.setReservationStatus(EReservationStatus.CONFIRMED);
        }

        response.setTableName(order.getRestaurantTable() != null ? order.getRestaurantTable().getName() : "N/A");
        response.setOrderId(order.getId());
        response.setOrderStatus(order.getStatus());
        response.setFinalPrice(order.getFinalPrice());

        Long userId = order.getUser() != null ? order.getUser().getId() : null;
        List<OrderLineResponse> items = orderDetailRepository.findByOrder_Id(order.getId()).stream()
                .map(orderDetail -> toLineResponse(orderDetail, userId))
                .toList();
        response.setItems(items);
        response.setHasGeneralFeedback(
                userId != null && feedbackRepository.existsByUser_IdAndOrder_IdAndOrderDetailIsNull(userId, order.getId())
        );
        if (userId != null) {
            feedbackRepository.findByUser_IdAndOrder_IdAndOrderDetailIsNull(userId, order.getId()).ifPresent(feedback -> {
                response.setGeneralFeedback(toFeedbackSummary(feedback));
                response.setCanEditGeneralFeedback(canEditFeedback(feedback));
            });
        }
        return response;
    }

    private OrderLineResponse toLineResponse(OrderDetail orderDetail, Long userId) {
        OrderLineResponse response = new OrderLineResponse();
        response.setOrderDetailId(orderDetail.getId());
        Long itemId = orderDetail.getItem() != null ? orderDetail.getItem().getId() : null;
        response.setProductId(orderDetail.getCombo() != null ? orderDetail.getCombo().getId() : itemId);
        response.setName(orderDetail.getProductName());
        response.setType(orderDetail.getCombo() != null ? "COMBO" : "ITEM");
        response.setQuantity(orderDetail.getQuantity());
        response.setTotalPrice(orderDetail.getTotalPrice());

        if (userId != null) {
            response.setHasFeedback(feedbackRepository.existsByUser_IdAndOrderDetail_Id(userId, orderDetail.getId()));
            feedbackRepository.findByUser_IdAndOrderDetail_Id(userId, orderDetail.getId()).ifPresent(feedback -> {
                response.setFeedback(toFeedbackSummary(feedback));
                response.setCanEditFeedback(canEditFeedback(feedback));
            });
        }

        if (orderDetail.getCombo() != null) {
            response.setUnitPrice(orderDetail.getCombo().getPrice());
        } else if (orderDetail.getItem() != null) {
            response.setUnitPrice(orderDetail.getItem().getPrice());
        }

        return response;
    }

    private FeedbackResponse toFeedbackSummary(Feedback feedback) {
        return FeedbackResponse.builder()
                .id(feedback.getId())
                .rating(feedback.getRating())
                .comment(feedback.getComment())
                .orderId(feedback.getOrder() != null ? feedback.getOrder().getId() : null)
                .orderDetailId(feedback.getOrderDetail() != null ? feedback.getOrderDetail().getId() : null)
                .itemId(feedback.getItem() != null ? feedback.getItem().getId() : null)
                .comboId(feedback.getCombo() != null ? feedback.getCombo().getId() : null)
                .createdAt(feedback.getCreatedAt())
                .updatedAt(feedback.getUpdatedAt())
                .build();
    }

    private boolean canEditFeedback(Feedback feedback) {
        LocalDateTime createdAt = feedback.getCreatedAt();
        if (createdAt == null) {
            return false;
        }
        return LocalDateTime.now().isBefore(createdAt.plusHours(EDIT_WINDOW_HOURS));
    }
}
