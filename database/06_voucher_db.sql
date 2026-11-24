-- =============================================
-- DATABASE: voucher_db (Voucher & Promotion Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `voucher_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `voucher_db`;

DROP TABLE IF EXISTS `voucher_usages`;
DROP TABLE IF EXISTS `vouchers`;

-- 1. Bảng mã giảm giá / khuyến mãi
CREATE TABLE `vouchers` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `code` VARCHAR(30) NOT NULL UNIQUE,
    `title` VARCHAR(150) NOT NULL,
    `description` VARCHAR(255) NULL,
    `discount_type` ENUM('PERCENT', 'FIXED') NOT NULL,
    `discount_value` DECIMAL(10,2) NOT NULL,
    `max_discount_amount` DECIMAL(10,2) NULL, -- Trần giảm tối đa cho mã PERCENT
    `min_order_amount` DECIMAL(10,2) NOT NULL DEFAULT 0,
    `route_filter` VARCHAR(100) NULL, -- NULL = áp dụng mọi tuyến, hoặc tên điểm đến/tuyến (VD: "Sa Pa")
    `usage_limit` INT NOT NULL DEFAULT 100,
    `used_count` INT NOT NULL DEFAULT 0,
    `start_date` DATETIME NOT NULL,
    `end_date` DATETIME NOT NULL,
    `is_active` BOOLEAN NOT NULL DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng lịch sử sử dụng mã giảm giá
CREATE TABLE `voucher_usages` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `voucher_id` INT NOT NULL,
    `user_id` INT NULL, -- Logic Ref sang user_db
    `booking_code` VARCHAR(30) NOT NULL, -- Logic Ref sang booking_db
    `discount_amount` DECIMAL(10,2) NOT NULL,
    `used_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_usage_voucher` FOREIGN KEY (`voucher_id`) REFERENCES `vouchers` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_voucher_booking` (`voucher_id`, `booking_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `vouchers` (`id`, `code`, `title`, `description`, `discount_type`, `discount_value`, `max_discount_amount`, `min_order_amount`, `route_filter`, `usage_limit`, `used_count`, `start_date`, `end_date`, `is_active`) VALUES
(1, 'CHAOBANMOI', 'Chào bạn mới - Giảm 20%', 'Giảm 20% tối đa 100.000đ cho mọi tuyến đường EcoBus', 'PERCENT', 20.00, 100000.00, 150000.00, NULL, 500, 12, '2026-01-01 00:00:00', '2027-12-31 23:59:59', TRUE),
(2, 'VEXETET50', 'Ưu đãi vé xe - Giảm thẳng 50K', 'Giảm trực tiếp 50.000đ cho đơn đặt vé từ 300.000đ trở lên', 'FIXED', 50000.00, NULL, 300000.00, NULL, 200, 5, '2026-01-01 00:00:00', '2027-12-31 23:59:59', TRUE),
(3, 'SAPA2026', 'Khám phá Sa Pa - Giảm 15%', 'Áp dụng riêng cho các chuyến xe đi Sa Pa, giảm tối đa 120.000đ', 'PERCENT', 15.00, 120000.00, 200000.00, 'Sa Pa', 150, 3, '2026-01-01 00:00:00', '2027-12-31 23:59:59', TRUE);
