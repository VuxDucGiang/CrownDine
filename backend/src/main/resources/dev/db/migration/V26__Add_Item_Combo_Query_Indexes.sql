-- Item indexes
ALTER TABLE `items`
    ADD INDEX `idx_items_slug` (`slug`),
    ADD INDEX `idx_items_name` (`name`),
    ADD INDEX `idx_items_status` (`status`),
    ADD INDEX `idx_items_category_status` (`category_id`, `status`);

-- Combo indexes
ALTER TABLE `combos`
    ADD INDEX `idx_combos_slug` (`slug`),
    ADD INDEX `idx_combos_name` (`name`),
    ADD INDEX `idx_combos_status` (`status`),
    ADD INDEX `idx_combos_category_status` (`category_id`, `status`);
