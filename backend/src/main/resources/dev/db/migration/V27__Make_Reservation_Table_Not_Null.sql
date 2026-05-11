UPDATE reservations r
JOIN orders o ON o.reservation_id = r.id
SET r.restaurant_table_id = o.restaurant_table_id
WHERE r.restaurant_table_id IS NULL
  AND o.restaurant_table_id IS NOT NULL;

ALTER TABLE reservations
MODIFY COLUMN restaurant_table_id BIGINT NOT NULL;
