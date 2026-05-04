package com.crowndine.dto.response;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@Builder
public class MenuResponse {
    private Long id;
    private String type; // ITEM | COMBO
    private String name;
    private String description;
    private String imageUrl;
    private BigDecimal price;
    private BigDecimal priceAfterDiscount;
    private BigDecimal displayPrice;
    private String status;
    private Long categoryId;
    private String categoryName;
    private Long soldCount;
    private Double averageRating;
    private Integer feedbackCount;
}
