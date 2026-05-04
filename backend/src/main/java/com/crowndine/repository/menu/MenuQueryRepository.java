package com.crowndine.repository.menu;

import com.crowndine.dto.response.MenuResponse;
import org.springframework.data.domain.Pageable;

import java.util.List;

public interface MenuQueryRepository {
    List<MenuResponse> findMenu(Long categoryId, String search, boolean includeItems, boolean includeCombos, String sortBy, String dir, Pageable pageable);

    long countMenu(Long categoryId, String search, boolean includeItems, boolean includeCombos);
}
