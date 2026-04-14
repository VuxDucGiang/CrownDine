-- Add manual discount fields to orders table
ALTER TABLE `orders`
    ADD COLUMN `manual_discount_value` decimal(38,2) DEFAULT 0.00,
ADD COLUMN `is_manual_discount_percentage` bit(1) DEFAULT 0;
