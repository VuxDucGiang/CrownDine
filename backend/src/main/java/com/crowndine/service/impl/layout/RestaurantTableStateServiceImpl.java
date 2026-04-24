package com.crowndine.service.impl.layout;

import com.crowndine.common.enums.ETableStatus;
import com.crowndine.dto.response.RestaurantTableResponse;
import com.crowndine.exception.ResourceNotFoundException;
import com.crowndine.model.RestaurantTable;
import com.crowndine.repository.RestaurantTableRepository;
import com.crowndine.service.layout.RestaurantTableStateService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.BeanUtils;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "RESTAURANT-TABLE-STATE-SERVICE")
public class RestaurantTableStateServiceImpl implements RestaurantTableStateService {

    private final RestaurantTableRepository tableRepository;
    private final SimpMessagingTemplate messagingTemplate;

    @Override
    @Transactional(rollbackFor = Exception.class)
    public RestaurantTableResponse changeStatus(Long tableId, ETableStatus targetStatus) {
        RestaurantTable table = tableRepository.findById(tableId).orElseThrow(() -> new ResourceNotFoundException("Table not found"));

        RestaurantTableResponse response = new RestaurantTableResponse();
        BeanUtils.copyProperties(table, response);
        response.setId(table.getId());

        if (table.getStatus() == targetStatus) {
            return response;
        }

        table.setStatus(targetStatus);
        tableRepository.save(table);

        BeanUtils.copyProperties(table, response);
        messagingTemplate.convertAndSend("/topic/tables", response);

        log.info("Updated table {} to {}", tableId, targetStatus);
        return response;
    }
}
