CREATE INDEX idx_reservations_status_date_start_checked_out
    ON reservations (status, date, start_time, checked_out_at);

CREATE INDEX idx_reservations_table_date_status_checked_out_exp
    ON reservations (restaurant_table_id, date, status, checked_out_at, expirated_at);
