package com.crowndine.service.impl.menu;

import com.crowndine.common.enums.EMenuType;
import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;
import com.crowndine.repository.menu.MenuQueryRepository;
import com.crowndine.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "MENU-SERVICE")
public class MenuServiceImpl implements MenuService {

    private final MenuQueryRepository menuQueryRepository;

    @Override
    public PageResponse<MenuResponse> getMenu(Long categoryId, String search, EMenuType type,
                                              String dir, String sortBy, int page, int size) {
        int pageNumber = (page > 0) ? page - 1 : 0;
        int pageSize = (size > 0) ? size : 10;

        EMenuType menuType = type == null ? EMenuType.ALL : type;

        boolean includeItems = menuType == EMenuType.ALL || menuType == EMenuType.ITEM;
        boolean includeCombos = (menuType == EMenuType.ALL || menuType == EMenuType.COMBO) && categoryId == null;

        Pageable pageable = PageRequest.of(pageNumber, pageSize);
        List<MenuResponse> pageData = menuQueryRepository.findMenu(categoryId, search, includeItems, includeCombos, sortBy, dir, pageable);
        long totalItems = menuQueryRepository.countMenu(categoryId, search, includeItems, includeCombos);
        int totalPages = (int) Math.ceil((double) totalItems / pageSize);
        return PageResponse.<MenuResponse>builder()
                .page(pageNumber + 1)
                .pageSize(pageSize)
                .totalItems(totalItems)
                .totalPages(totalPages)
                .data(pageData)
                .build();
    }
}
