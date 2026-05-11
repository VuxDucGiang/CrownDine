package com.crowndine.dto.response;

import com.crowndine.common.enums.EOrderStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

@Getter
@Setter
public class OrderHistoryResponse {
    private Long orderId;
    private EOrderStatus orderStatus;
    private BigDecimal finalPrice;
    private List<OrderLineResponse> items = new ArrayList<>();
}
