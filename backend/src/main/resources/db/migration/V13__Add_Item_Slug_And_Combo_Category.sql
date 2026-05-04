ALTER TABLE `items`
    ADD COLUMN `slug` VARCHAR(255) NULL;

UPDATE `items`
SET `slug` = LOWER(
        REPLACE(
            REPLACE(
                REPLACE(
                    REPLACE(
                        REPLACE(TRIM(`name`), ' ', '-'),
                    'đ', 'd'),
                'Đ', 'd'),
            '--', '-'),
        '--', '-')
    )
WHERE `slug` IS NULL OR `slug` = '';

ALTER TABLE `combos`
    ADD COLUMN `category_id` BIGINT NULL;

UPDATE `combos` cb
SET cb.`category_id` = (
    SELECT c.`id`
    FROM `categories` c
    WHERE c.`slug` = CASE
        WHEN cb.`slug` LIKE '%lau%' THEN 'mon-lau'
        WHEN cb.`slug` LIKE '%hai-san%' THEN 'mon-hai-san'
        WHEN cb.`slug` LIKE '%trang-mieng%' THEN 'trang-mieng'
        ELSE 'mon-khai-vi'
    END
    LIMIT 1
)
WHERE cb.`category_id` IS NULL;

ALTER TABLE `combos`
    MODIFY COLUMN `category_id` BIGINT NOT NULL,
    ADD CONSTRAINT `fk_combos_category_id_categories`
        FOREIGN KEY (`category_id`) REFERENCES `categories` (`id`),
    ADD KEY `idx_combos_category_id` (`category_id`);
