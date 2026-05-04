package com.crowndine.controller;

import com.crowndine.common.enums.EMenuType;
import com.crowndine.dto.response.ApiResponse;
import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;
import com.crowndine.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/menu")
@RequiredArgsConstructor
@Validated
@Slf4j(topic = "API-MENU-CONTROLLER")
public class ApiMenuController {

    private final MenuService menuService;

    @GetMapping
    public ApiResponse getMenu(@RequestParam(required = false) Long categoryId,
                               @RequestParam(required = false) String search,
                               @RequestParam(required = false, defaultValue = "ALL") EMenuType type,
                               @RequestParam(required = false) String dir,
                               @RequestParam(required = false) String sortBy,
                               @RequestParam(required = false, defaultValue = "1") int page,
                               @RequestParam(required = false, defaultValue = "12") int size) {
        PageResponse<MenuResponse> response = menuService.getMenu(categoryId, search, type, dir, sortBy, page, size);
        return ApiResponse.builder()
                .status(HttpStatus.OK.value())
                .message("Get menu successfully")
                .data(response)
                .build();
    }
}
