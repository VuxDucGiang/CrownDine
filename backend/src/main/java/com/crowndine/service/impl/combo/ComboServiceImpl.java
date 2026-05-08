package com.crowndine.service.impl.combo;

import com.crowndine.dto.request.ComboRequest;
import com.crowndine.dto.response.ComboItemResponse;
import com.crowndine.dto.response.ComboResponse;
import com.crowndine.dto.response.TopSellingComboResponse;
import com.crowndine.exception.InvalidDataException;
import com.crowndine.exception.ResourceNotFoundException;
import com.crowndine.model.Combo;
import com.crowndine.model.ComboItem;
import com.crowndine.model.Category;
import com.crowndine.model.Item;
import com.crowndine.repository.CategoryRepository;
import com.crowndine.repository.ComboItemRepository;
import com.crowndine.repository.ComboRepository;
import com.crowndine.repository.ItemRepository;
import com.crowndine.repository.FeedbackRepository;
import com.crowndine.service.combo.ComboService;
import com.github.slugify.Slugify;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.cache.annotation.Caching;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ComboServiceImpl implements ComboService {
    private static final String COMBOS_CACHE = "combos";
    private static final String COMBO_BY_ID_CACHE = "combo-by-id";
    private static final String COMBO_BY_NAME_CACHE = "combo-by-name";
    private static final String COMBO_BY_SLUG_CACHE = "combo-by-slug";
    private static final String TOP_SELLING_COMBOS_CACHE = "top-selling-combos";

    private final ComboRepository comboRepository;
    private final ComboItemRepository comboItemRepository;
    private final ItemRepository itemRepository;
    private final CategoryRepository categoryRepository;
    private final FeedbackRepository feedbackRepository;
    private final Slugify slugify = Slugify.builder().build();

    @Override
    @Cacheable(COMBOS_CACHE)
    public List<ComboResponse> getAllCombos() {
        return comboRepository.findAll()
                .stream().map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = TOP_SELLING_COMBOS_CACHE, key = "#limit")
    public List<TopSellingComboResponse> getTopSellingCombos(int limit) {
        int normalizedLimit = normalizeTopSellingLimit(limit);

        return comboRepository.findAll().stream()
                .filter(combo -> combo.getSoldCount() != null && combo.getSoldCount() > 0)
                .sorted(Comparator.comparing(Combo::getSoldCount).reversed())
                .limit(normalizedLimit)
                .map(this::mapToTopSellingResponse)
                .collect(Collectors.toList());
    }

    @Override
    @Cacheable(value = COMBO_BY_ID_CACHE, key = "#id")
    public ComboResponse getComboById(Long id) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy combo với id: " + id));
        return mapToResponse(combo);
    }

    @Override
    @Cacheable(value = COMBO_BY_NAME_CACHE, key = "#name")
    public ComboResponse getComboByName(String name) {
        Combo combo = comboRepository.findByName(name)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy combo với tên: " + name));
        return mapToResponse(combo);
    }

    @Override
    @Cacheable(value = COMBO_BY_SLUG_CACHE, key = "#slug")
    public ComboResponse getComboBySlug(String slug) {
        Combo combo = comboRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy combo với slug: " + slug));
        return mapToResponse(combo);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = COMBOS_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_ID_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_NAME_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_SLUG_CACHE, allEntries = true),
            @CacheEvict(value = TOP_SELLING_COMBOS_CACHE, allEntries = true)
    })
    public ComboResponse createCombo(ComboRequest req) {
        if (comboRepository.findByName(req.getName()).isPresent()) {
            throw new InvalidDataException("Tên combo đã tồn tại");
        }
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy category với id: " + req.getCategoryId()));

        Combo combo = new Combo();
        combo.setName(req.getName());
        combo.setDescription(req.getDescription());
        combo.setPrice(req.getPrice());
        combo.setPriceAfterDiscount(req.getPriceAfterDiscount());
        combo.setImageUrl(req.getImageUrl());
        combo.setStatus(req.getStatus() != null ? req.getStatus() : com.crowndine.common.enums.EComboStatus.AVAILABLE);
        combo.setSlug(slugify.slugify(req.getName()));
        combo.setCategory(category);
        combo.setSoldCount(0L);

        // Save combo first to get ID
        Combo savedCombo = comboRepository.save(combo);

        List<ComboItem> comboItems = new ArrayList<>();
        if (req.getItems() != null && !req.getItems().isEmpty()) {
            comboItems = req.getItems().stream().map(ciReq -> {
                Item item = itemRepository.findById(ciReq.getItemId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy item với id: " + ciReq.getItemId()));

                ComboItem ci = new ComboItem();
                ci.setCombo(savedCombo);
                ci.setItem(item);
                ci.setQuantity(ciReq.getQuantity());
                return ci;
            }).collect(Collectors.toList());
            comboItemRepository.saveAll(comboItems);
        }

        savedCombo.setComboItems(comboItems);
        return mapToResponse(savedCombo);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = COMBOS_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_ID_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_NAME_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_SLUG_CACHE, allEntries = true),
            @CacheEvict(value = TOP_SELLING_COMBOS_CACHE, allEntries = true)
    })
    public ComboResponse updateCombo(Long id, ComboRequest req) {
        Combo combo = comboRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy combo với id: " + id));
        Category category = categoryRepository.findById(req.getCategoryId())
                .orElseThrow(() -> new ResourceNotFoundException("Không tìm thấy category với id: " + req.getCategoryId()));

        combo.setName(req.getName());
        combo.setDescription(req.getDescription());
        combo.setPrice(req.getPrice());
        combo.setPriceAfterDiscount(req.getPriceAfterDiscount());
        combo.setImageUrl(req.getImageUrl());
        if (req.getStatus() != null) {
            combo.setStatus(req.getStatus());
        }
        combo.setSlug(slugify.slugify(req.getName()));
        combo.setCategory(category);

        // ✅ Không replace list
        if (combo.getComboItems() == null) {
            combo.setComboItems(new ArrayList<>());
        }

        combo.getComboItems().clear(); // orphanRemoval sẽ tự delete row cũ

        if (req.getItems() != null) {
            for (var ciReq : req.getItems()) {
                Item item = itemRepository.findById(ciReq.getItemId())
                        .orElseThrow(() -> new ResourceNotFoundException(
                                "Không tìm thấy item với id: " + ciReq.getItemId()));

                ComboItem ci = new ComboItem();
                ci.setCombo(combo);
                ci.setItem(item);
                ci.setQuantity(ciReq.getQuantity());

                combo.getComboItems().add(ci);
            }
        }

        Combo saved = comboRepository.save(combo);
        return mapToResponse(saved);
    }

    @Override
    @Transactional
    @Caching(evict = {
            @CacheEvict(value = COMBOS_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_ID_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_NAME_CACHE, allEntries = true),
            @CacheEvict(value = COMBO_BY_SLUG_CACHE, allEntries = true),
            @CacheEvict(value = TOP_SELLING_COMBOS_CACHE, allEntries = true)
    })
    public void deleteCombo(Long id) {
        if (!comboRepository.existsById(id)) {
            throw new ResourceNotFoundException("Không tìm thấy combo với id: " + id);
        }
        comboRepository.deleteById(id);
    }

    // ===== mapping =====
    private ComboResponse mapToResponse(Combo combo) {
        List<ComboItemResponse> items = (combo.getComboItems() == null) ? new ArrayList<>()
                : combo.getComboItems().stream()
                        .map(this::mapComboItemToResponse)
                        .collect(Collectors.toList());

        return ComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .slug(combo.getSlug())
                .description(combo.getDescription())
                .price(combo.getPrice())
                .priceAfterDiscount(combo.getPriceAfterDiscount())
                .status(combo.getStatus())
                .imageUrl(combo.getImageUrl())
                .categoryId(combo.getCategory() != null ? combo.getCategory().getId() : null)
                .averageRating(feedbackRepository.getAverageRatingByComboId(combo.getId()))
                .feedbackCount((int) feedbackRepository.countByCombo_Id(combo.getId()))
                .items(items)
                .build();
    }

    private ComboItemResponse mapComboItemToResponse(ComboItem ci) {
        return ComboItemResponse.builder()
                .itemId(ci.getItem().getId())
                .itemName(ci.getItem().getName())
                .quantity(ci.getQuantity())
                .build();
    }

    private TopSellingComboResponse mapToTopSellingResponse(Combo combo) {
        return TopSellingComboResponse.builder()
                .id(combo.getId())
                .name(combo.getName())
                .soldCount(combo.getSoldCount())
                .sellingPrice(combo.getPriceAfterDiscount() != null ? combo.getPriceAfterDiscount() : combo.getPrice())
                .build();
    }

    private int normalizeTopSellingLimit(int limit) {
        if (limit <= 0) {
            return 5;
        }
        return Math.min(limit, 10);
    }

}
