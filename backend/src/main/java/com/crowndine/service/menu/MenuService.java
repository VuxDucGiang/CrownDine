package com.crowndine.service.menu;

import com.crowndine.common.enums.EMenuType;
import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;

public interface MenuService {
    PageResponse<MenuResponse> getMenu(Long categoryId, String search, EMenuType type,
                                       String dir, String sortBy, int page, int size);
}
