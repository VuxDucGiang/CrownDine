UPDATE orders o
JOIN reservations r ON r.id = o.reservation_id
SET o.restaurant_table_id = r.restaurant_table_id
WHERE o.restaurant_table_id IS NULL
  AND r.restaurant_table_id IS NOT NULL;

UPDATE orders o
JOIN (
    SELECT id
    FROM restaurant_tables
    ORDER BY id
    LIMIT 1
) rt
SET o.restaurant_table_id = rt.id
WHERE o.restaurant_table_id IS NULL;

ALTER TABLE orders
MODIFY COLUMN restaurant_table_id BIGINT NOT NULL;
