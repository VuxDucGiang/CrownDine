package com.crowndine.dto.request;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class OrderManualDiscountRequest {
    private BigDecimal discountValue;
    private Boolean isPercentage;
}
