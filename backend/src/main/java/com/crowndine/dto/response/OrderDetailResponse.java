package com.crowndine.dto.response;

import com.crowndine.common.enums.EOrderDetailStatus;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Getter
@Setter
public class OrderDetailResponse {
    private Long id;
    private ItemResponse item;
    private ComboResponse combo;
    private Integer quantity;
    private String note;
    private EOrderDetailStatus status;
    private BigDecimal totalPrice;
    private LocalDateTime createdAt;
}
