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
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "RESERVATION-SERVICE")
public class ReservationServiceImpl implements ReservationService {
    private static final long EDIT_WINDOW_HOURS = 24;

    private final ReservationRepository reservationRepository;
    private final UserRepository userRepository;
    private final OrderDetailRepository orderDetailRepository;
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
        Long userId = user.getId();
        int pageNumber = (page > 0) ? page - 1 : 0;
        Pageable pageable = PageRequest.of(pageNumber, size);
        Page<Reservation> pageEntity = reservationRepository.findByUser_Id(userId, pageable);

        List<Reservation> reservations = pageEntity.getContent();
        List<Long> orderIds = reservations.stream()
                .map(Reservation::getOrder)
                .filter(Objects::nonNull)
                .map(Order::getId)
                .toList();

        Map<Long, List<OrderDetail>> orderDetailsByOrderId = Collections.emptyMap();
        Map<Long, Feedback> generalFeedbackByOrderId = Collections.emptyMap();
        Map<Long, Feedback> detailFeedbackByOrderDetailId = Collections.emptyMap();

        if (!orderIds.isEmpty()) {
            List<OrderDetail> orderDetails = orderDetailRepository.findByOrder_IdIn(orderIds);
            orderDetailsByOrderId = orderDetails.stream()
                    .collect(Collectors.groupingBy(detail -> detail.getOrder().getId()));

            generalFeedbackByOrderId = feedbackRepository.findByUser_IdAndOrder_IdInAndOrderDetailIsNull(userId, orderIds)
                    .stream()
                    .collect(Collectors.toMap(feedback -> feedback.getOrder().getId(), feedback -> feedback, (left, right) -> left));

            List<Long> orderDetailIds = orderDetails.stream().map(OrderDetail::getId).toList();
            if (!orderDetailIds.isEmpty()) {
                detailFeedbackByOrderDetailId = feedbackRepository.findByUser_IdAndOrderDetail_IdIn(userId, orderDetailIds)
                        .stream()
                        .collect(Collectors.toMap(feedback -> feedback.getOrderDetail().getId(), feedback -> feedback, (left, right) -> left));
            }
        }

        final Map<Long, List<OrderDetail>> finalOrderDetailsByOrderId = orderDetailsByOrderId;
        final Map<Long, Feedback> finalGeneralFeedbackByOrderId = generalFeedbackByOrderId;
        final Map<Long, Feedback> finalDetailFeedbackByOrderDetailId = detailFeedbackByOrderDetailId;

        List<ReservationHistoryResponse> responses = reservations.stream()
                .map(reservation -> toHistoryResponse(
                        reservation,
                        finalOrderDetailsByOrderId,
                        finalGeneralFeedbackByOrderId,
                        finalDetailFeedbackByOrderDetailId
                ))
                .toList();

        return PageResponse.<ReservationHistoryResponse>builder()
                .page(pageNumber + 1)
                .pageSize(size)
                .totalPages(pageEntity.getTotalPages())
                .totalItems(pageEntity.getTotalElements())
                .data(responses)
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
                    .priceAfterDiscount(orderDetail.getItem().getPriceAfterDiscount())
                    .build();
            response.setItem(itemResponse);
        }

        if (orderDetail.getCombo() != null) {
            ComboResponse comboResponse = ComboResponse.builder()
                    .id(orderDetail.getCombo().getId())
                    .name(orderDetail.getCombo().getName())
                    .price(orderDetail.getCombo().getPrice())
                    .priceAfterDiscount(orderDetail.getCombo().getPriceAfterDiscount())
                    .build();
            response.setCombo(comboResponse);
        }

        return response;
    }

    private ReservationHistoryResponse toHistoryResponse(
            Reservation reservation,
            Map<Long, List<OrderDetail>> orderDetailsByOrderId,
            Map<Long, Feedback> generalFeedbackByOrderId,
            Map<Long, Feedback> detailFeedbackByOrderDetailId
    ) {
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
        response.setTableName(reservation.getTable().getName());
        response.setCreatedAt(reservation.getCreatedAt());

        Order order = reservation.getOrder();
        if (order == null) {
            return response;
        }

        OrderHistoryResponse orderHistoryResponse = new OrderHistoryResponse();
        orderHistoryResponse.setOrderId(order.getId());
        orderHistoryResponse.setOrderStatus(order.getStatus());
        orderHistoryResponse.setFinalPrice(order.getFinalPrice());

        List<OrderLineResponse> items = orderDetailsByOrderId.getOrDefault(order.getId(), List.of()).stream()
                .map(orderDetail -> toLineResponse(orderDetail, detailFeedbackByOrderDetailId))
                .toList();
        orderHistoryResponse.setItems(items);
        response.setOrderHistoryResponse(orderHistoryResponse);

        Feedback generalFeedback = generalFeedbackByOrderId.get(order.getId());
        response.setHasGeneralFeedback(generalFeedback != null);
        if (generalFeedback != null) {
            response.setGeneralFeedback(toFeedbackSummary(generalFeedback));
            response.setCanEditGeneralFeedback(canEditFeedback(generalFeedback));
        }

        return response;
    }

    private OrderLineResponse toLineResponse(
            OrderDetail orderDetail,
            Map<Long, Feedback> detailFeedbackByOrderDetailId
    ) {
        OrderLineResponse response = new OrderLineResponse();
        response.setOrderDetailId(orderDetail.getId());
        Long itemId = orderDetail.getItem() != null ? orderDetail.getItem().getId() : null;
        response.setProductId(orderDetail.getCombo() != null ? orderDetail.getCombo().getId() : itemId);
        response.setName(orderDetail.getProductName());
        response.setType(orderDetail.getCombo() != null ? "COMBO" : "ITEM");
        response.setQuantity(orderDetail.getQuantity());
        response.setTotalPrice(orderDetail.getTotalPrice());

        Feedback detailFeedback = detailFeedbackByOrderDetailId.get(orderDetail.getId());
        response.setHasFeedback(detailFeedback != null);
        if (detailFeedback != null) {
            response.setFeedback(toFeedbackSummary(detailFeedback));
            response.setCanEditFeedback(canEditFeedback(detailFeedback));
        }

        response.setUnitPrice(orderDetail.getAppliedUnitPrice());

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
