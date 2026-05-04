package com.crowndine.service.menu;

import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;

public interface MenuService {
    PageResponse<MenuResponse> getMenu(Long categoryId, String search, String type,
                                       String dir, String sortBy, int page, int size);
}
