package com.crowndine.dto.response;

import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class OrderCheckoutResponse {
    private Long orderId;
    private String orderCode;
    private BigDecimal totalAmount;
    private BigDecimal voucherDiscount;
    private BigDecimal depositedAmount;
    private BigDecimal tableDepositPaidAmount;
    private BigDecimal orderDepositPaidAmount;
    private BigDecimal finalAmount;
}
