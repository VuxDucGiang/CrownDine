package com.crowndine.service.layout;

import com.crowndine.common.enums.ETableStatus;
import com.crowndine.dto.response.RestaurantTableResponse;

public interface RestaurantTableStateService {

    RestaurantTableResponse changeStatus(Long tableId, ETableStatus targetStatus);
}
