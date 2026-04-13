package com.crowndine.service.shift;

import com.crowndine.presentation.dto.request.ShiftRequest;
import com.crowndine.presentation.dto.response.ShiftResponse;

import java.util.List;

public interface ShiftService {
    ShiftResponse getShiftById(Long id);

    List<ShiftResponse> getAllShifts();

    void saveShift(ShiftRequest request);

    void delete(Long id);
}
