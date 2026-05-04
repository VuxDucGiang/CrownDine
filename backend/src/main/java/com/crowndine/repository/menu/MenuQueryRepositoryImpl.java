package com.crowndine.repository.menu;

import com.crowndine.dto.response.MenuResponse;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.persistence.Query;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Repository;
import org.springframework.util.StringUtils;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@Repository
public class MenuQueryRepositoryImpl implements MenuQueryRepository {

    @PersistenceContext
    private EntityManager entityManager;

    @Override
    public List<MenuResponse> findMenu(Long categoryId, String search, boolean includeItems, boolean includeCombos, String sortBy, String dir, Pageable pageable) {
        String unionSql = buildUnionSql(includeItems, includeCombos);
        String orderBy = buildOrderBy(sortBy, dir);
        String sql = "SELECT * FROM (" + unionSql + ") m " + orderBy + " LIMIT :limit OFFSET :offset";

        Query query = entityManager.createNativeQuery(sql);
        bindCommonParams(query, categoryId, search, includeItems, includeCombos);
        query.setParameter("limit", pageable.getPageSize());
        query.setParameter("offset", (int) pageable.getOffset());

        @SuppressWarnings("unchecked")
        List<Object[]> rows = query.getResultList();
        List<MenuResponse> results = new ArrayList<>();
        for (Object[] row : rows) {
            results.add(mapRow(row));
        }
        return results;
    }

    @Override
    public long countMenu(Long categoryId, String search, boolean includeItems, boolean includeCombos) {
        String unionSql = buildUnionSql(includeItems, includeCombos);
        String countSql = "SELECT COUNT(*) FROM (" + unionSql + ") m";
        Query query = entityManager.createNativeQuery(countSql);
        bindCommonParams(query, categoryId, search, includeItems, includeCombos);
        Number total = (Number) query.getSingleResult();
        return total.longValue();
    }

    private String buildUnionSql(boolean includeItems, boolean includeCombos) {
        List<String> parts = new ArrayList<>();
        if (includeItems) {
            parts.add("""
                    SELECT
                        i.id,
                        'ITEM' AS type,
                        i.slug AS slug,
                        i.name,
                        i.description,
                        i.image_url,
                        i.price,
                        i.price_after_discount,
                        COALESCE(i.price_after_discount, i.price) AS display_price,
                        i.status,
                        i.category_id,
                        c.name AS category_name,
                        COALESCE(i.sold_count, 0) AS sold_count,
                        COALESCE((SELECT AVG(f.rating) FROM feedbacks f WHERE f.item_id = i.id), 0) AS average_rating,
                        (SELECT COUNT(1) FROM feedbacks f WHERE f.item_id = i.id) AS feedback_count
                    FROM items i
                    LEFT JOIN categories c ON c.id = i.category_id
                    WHERE (:categoryId IS NULL OR i.category_id = :categoryId)
                      AND (:search IS NULL OR LOWER(i.name) LIKE LOWER(CONCAT('%', :search, '%')))
                    """);
        }

        if (includeCombos) {
            parts.add("""
                    SELECT
                        cb.id,
                        'COMBO' AS type,
                        cb.slug AS slug,
                        cb.name,
                        cb.description,
                        cb.image_url,
                        cb.price,
                        cb.price_after_discount,
                        COALESCE(cb.price_after_discount, cb.price) AS display_price,
                        cb.status,
                        cb.category_id,
                        c.name AS category_name,
                        COALESCE(cb.sold_count, 0) AS sold_count,
                        COALESCE((SELECT AVG(f.rating) FROM feedbacks f WHERE f.combo_id = cb.id), 0) AS average_rating,
                        (SELECT COUNT(1) FROM feedbacks f WHERE f.combo_id = cb.id) AS feedback_count
                    FROM combos cb
                    LEFT JOIN categories c ON c.id = cb.category_id
                    WHERE (:search IS NULL OR LOWER(cb.name) LIKE LOWER(CONCAT('%', :search, '%')))
                      AND (:categoryId IS NULL OR cb.category_id = :categoryId)
                    """);
        }

        if (parts.isEmpty()) {
            return """
                    SELECT
                        NULL AS id,
                        'NONE' AS type,
                        NULL AS slug,
                        NULL AS name,
                        NULL AS description,
                        NULL AS image_url,
                        NULL AS price,
                        NULL AS price_after_discount,
                        NULL AS display_price,
                        NULL AS status,
                        NULL AS category_id,
                        NULL AS category_name,
                        NULL AS sold_count,
                        NULL AS average_rating,
                        NULL AS feedback_count
                    WHERE 1 = 0
                    """;
        }

        return String.join(" UNION ALL ", parts);
    }

    private String buildOrderBy(String sortBy, String dir) {
        String field = StringUtils.hasText(sortBy) ? sortBy.trim().toLowerCase(Locale.ROOT) : "id";
        String sortField = switch (field) {
            case "name" -> "name";
            case "price" -> "display_price";
            case "rating" -> "average_rating";
            case "sold", "soldcount" -> "sold_count";
            default -> "id";
        };
        String direction = "asc".equalsIgnoreCase(dir) ? "ASC" : "DESC";
        return "ORDER BY " + sortField + " " + direction;
    }

    private void bindCommonParams(Query query, Long categoryId, String search, boolean includeItems, boolean includeCombos) {
        if (includeItems || includeCombos) {
            query.setParameter("categoryId", categoryId);
        }
        query.setParameter("search", StringUtils.hasText(search) ? search.trim() : null);
    }

    private MenuResponse mapRow(Object[] row) {
        return MenuResponse.builder()
                .id(toLong(row[0]))
                .type(toStringValue(row[1]))
                .slug(toStringValue(row[2]))
                .name(toStringValue(row[3]))
                .description(toStringValue(row[4]))
                .imageUrl(toStringValue(row[5]))
                .price(toBigDecimal(row[6]))
                .priceAfterDiscount(toBigDecimal(row[7]))
                .displayPrice(toBigDecimal(row[8]))
                .status(toStringValue(row[9]))
                .categoryId(toLong(row[10]))
                .categoryName(toStringValue(row[11]))
                .soldCount(toLong(row[12]))
                .averageRating(toDouble(row[13]))
                .feedbackCount(toInteger(row[14]))
                .build();
    }

    private String toStringValue(Object value) {
        return value == null ? null : String.valueOf(value);
    }

    private Long toLong(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.longValue();
        return Long.parseLong(String.valueOf(value));
    }

    private Integer toInteger(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.intValue();
        return Integer.parseInt(String.valueOf(value));
    }

    private Double toDouble(Object value) {
        if (value == null) return null;
        if (value instanceof Number number) return number.doubleValue();
        return Double.parseDouble(String.valueOf(value));
    }

    private BigDecimal toBigDecimal(Object value) {
        return switch (value) {
            case null -> null;
            case BigDecimal decimal -> decimal;
            case Number number -> BigDecimal.valueOf(number.doubleValue());
            default -> new BigDecimal(String.valueOf(value));
        };
    }
}
