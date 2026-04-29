package com.crowndine.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import lombok.Getter;

import java.util.List;

@Getter
public class OrderRequest {

    @NotNull(message = "Bàn không được để trống")
    private Long tableId;

    @Valid
    @NotEmpty
    private List<OrderItemRequest> items;
}
