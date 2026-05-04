package com.crowndine.dto.response;

import com.crowndine.common.enums.EComboStatus;
import lombok.*;

import java.math.BigDecimal;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ComboResponse {
    private Long id;

    private String name;
    private String slug;
    private String description;

    private BigDecimal price;
    private BigDecimal priceAfterDiscount;

    private EComboStatus status;

    private String imageUrl;
    private Long categoryId;
    private Double averageRating;
    private Integer feedbackCount;

    private List<ComboItemResponse> items;
}
