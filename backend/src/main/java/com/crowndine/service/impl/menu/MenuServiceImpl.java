package com.crowndine.service.impl.menu;

import com.crowndine.dto.response.MenuResponse;
import com.crowndine.dto.response.PageResponse;
import com.crowndine.model.Combo;
import com.crowndine.model.Item;
import com.crowndine.repository.ComboRepository;
import com.crowndine.repository.FeedbackRepository;
import com.crowndine.repository.ItemRepository;
import com.crowndine.service.menu.MenuService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Slf4j(topic = "MENU-SERVICE")
public class MenuServiceImpl implements MenuService {

    private final ItemRepository itemRepository;
    private final ComboRepository comboRepository;
    private final FeedbackRepository feedbackRepository;

    @Override
    public PageResponse<MenuResponse> getMenu(Long categoryId, String search, String type,
                                              String dir, String sortBy, int page, int size) {
        int pageNumber = (page > 0) ? page - 1 : 0;
        int pageSize = (size > 0) ? size : 10;

        boolean includeItems = !StringUtils.hasText(type) || "ITEM".equalsIgnoreCase(type) || "ALL".equalsIgnoreCase(type);
        boolean includeCombos = !StringUtils.hasText(type) || "COMBO".equalsIgnoreCase(type) || "ALL".equalsIgnoreCase(type);

        List<MenuResponse> merged = new ArrayList<>();
        if (includeItems) {
            merged.addAll(loadItems(categoryId, search));
        }
        if (includeCombos) {
            merged.addAll(loadCombos(search));
        }

        merged.sort(buildComparator(sortBy, dir));

        int fromIndex = Math.min(pageNumber * pageSize, merged.size());
        int toIndex = Math.min(fromIndex + pageSize, merged.size());
        List<MenuResponse> pageData = merged.subList(fromIndex, toIndex);

        int totalPages = (int) Math.ceil((double) merged.size() / pageSize);
        return PageResponse.<MenuResponse>builder()
                .page(pageNumber + 1)
                .pageSize(pageSize)
                .totalItems(merged.size())
                .totalPages(totalPages)
                .data(pageData)
                .build();
    }

    private List<MenuResponse> loadItems(Long categoryId, String search) {
        String keyword = normalize(search);
        return itemRepository.findAll().stream()
                .filter(item -> categoryId == null || (item.getCategory() != null && categoryId.equals(item.getCategory().getId())))
                .filter(item -> matchesSearch(item.getName(), keyword))
                .map(this::toItemMenuResponse)
                .toList();
    }

    private List<MenuResponse> loadCombos(String search) {
        String keyword = normalize(search);
        return comboRepository.findAll().stream()
                .filter(combo -> matchesSearch(combo.getName(), keyword))
                .map(this::toComboMenuResponse)
                .toList();
    }

    private MenuResponse toItemMenuResponse(Item item) {
        BigDecimal displayPrice = item.getPriceAfterDiscount() != null ? item.getPriceAfterDiscount() : item.getPrice();
        return MenuResponse.builder()
                .id(item.getId())
                .type("ITEM")
                .name(item.getName())
                .description(item.getDescription())
                .imageUrl(item.getImageUrl())
                .price(item.getPrice())
                .priceAfterDiscount(item.getPriceAfterDiscount())
                .displayPrice(displayPrice)
                .status(item.getStatus() != null ? item.getStatus().name() : null)
                .categoryId(item.getCategory() != null ? item.getCategory().getId() : null)
                .categoryName(item.getCategory() != null ? item.getCategory().getName() : null)
                .soldCount(item.getSoldCount())
                .averageRating(feedbackRepository.getAverageRatingByItemId(item.getId()))
                .feedbackCount((int) feedbackRepository.countByItem_Id(item.getId()))
                .build();
    }

    private MenuResponse toComboMenuResponse(Combo combo) {
        BigDecimal displayPrice = combo.getPriceAfterDiscount() != null ? combo.getPriceAfterDiscount() : combo.getPrice();
        return MenuResponse.builder()
                .id(combo.getId())
                .type("COMBO")
                .name(combo.getName())
                .description(combo.getDescription())
                .imageUrl(combo.getImageUrl())
                .price(combo.getPrice())
                .priceAfterDiscount(combo.getPriceAfterDiscount())
                .displayPrice(displayPrice)
                .status(combo.getStatus() != null ? combo.getStatus().name() : null)
                .categoryId(null)
                .categoryName("Combo")
                .soldCount(combo.getSoldCount())
                .averageRating(feedbackRepository.getAverageRatingByComboId(combo.getId()))
                .feedbackCount((int) feedbackRepository.countByCombo_Id(combo.getId()))
                .build();
    }

    private Comparator<MenuResponse> buildComparator(String sortBy, String dir) {
        String field = StringUtils.hasText(sortBy) ? sortBy.trim().toLowerCase(Locale.ROOT) : "id";
        boolean asc = "asc".equalsIgnoreCase(dir);

        Comparator<MenuResponse> comparator = switch (field) {
            case "name" -> Comparator.comparing(m -> nullSafeString(m.getName()));
            case "price" -> Comparator.comparing(m -> nullSafeBigDecimal(m.getDisplayPrice()));
            case "rating" -> Comparator.comparing(m -> nullSafeDouble(m.getAverageRating()));
            case "soldcount", "sold" -> Comparator.comparing(m -> nullSafeLong(m.getSoldCount()));
            default -> Comparator.comparing(m -> nullSafeLong(m.getId()));
        };
        return asc ? comparator : comparator.reversed();
    }

    private String normalize(String value) {
        return StringUtils.hasText(value) ? value.trim().toLowerCase(Locale.ROOT) : "";
    }

    private boolean matchesSearch(String value, String keyword) {
        if (!StringUtils.hasText(keyword)) {
            return true;
        }
        return value != null && value.toLowerCase(Locale.ROOT).contains(keyword);
    }

    private String nullSafeString(String value) {
        return value == null ? "" : value;
    }

    private BigDecimal nullSafeBigDecimal(BigDecimal value) {
        return value == null ? BigDecimal.ZERO : value;
    }

    private Double nullSafeDouble(Double value) {
        return value == null ? 0D : value;
    }

    private Long nullSafeLong(Long value) {
        return value == null ? 0L : value;
    }
}
