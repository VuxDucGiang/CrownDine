package com.crowndine.service.impl.menu;

import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;
import com.crowndine.repository.menu.MenuQueryRepository;
import com.crowndine.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.util.List;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "MENU-SERVICE")
public class MenuServiceImpl implements MenuService {

    private final MenuQueryRepository menuQueryRepository;

    @Override
    public PageResponse<MenuResponse> getMenu(Long categoryId, String search, String type,
                                              String dir, String sortBy, int page, int size) {
        int pageNumber = (page > 0) ? page - 1 : 0;
        int pageSize = (size > 0) ? size : 10;

        boolean includeItems = !StringUtils.hasText(type) || "ITEM".equalsIgnoreCase(type) || "ALL".equalsIgnoreCase(type);
        boolean includeCombos = (!StringUtils.hasText(type) || "COMBO".equalsIgnoreCase(type) || "ALL".equalsIgnoreCase(type))
                && categoryId == null;

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
