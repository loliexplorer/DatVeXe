-- =============================================
-- DATABASE: analytic_db (Analytic & Reporting Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `analytic_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `analytic_db`;

DROP TABLE IF EXISTS `driver_performance_stats`;
DROP TABLE IF EXISTS `route_performance_stats`;
DROP TABLE IF EXISTS `daily_revenue_stats`;

-- 1. Bảng thống kê doanh thu theo ngày
CREATE TABLE `daily_revenue_stats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `stat_date` DATE NOT NULL UNIQUE,
    `total_bookings` INT NOT NULL DEFAULT 0,
    `total_tickets` INT NOT NULL DEFAULT 0,
    `gross_revenue` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `refund_amount` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `net_revenue` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng thống kê hiệu suất & tỷ lệ lấp đầy ghế theo tuyến đường
CREATE TABLE `route_performance_stats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `route_name` VARCHAR(150) NOT NULL UNIQUE,
    `total_trips` INT NOT NULL DEFAULT 0,
    `total_seats_capacity` INT NOT NULL DEFAULT 0,
    `seats_sold` INT NOT NULL DEFAULT 0,
    `occupancy_rate` DECIMAL(5,2) NOT NULL DEFAULT 0, -- Phần trăm lấp đầy (0 - 100)
    `total_revenue` DECIMAL(14,2) NOT NULL DEFAULT 0,
    `avg_rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng thống kê hiệu suất tài xế
CREATE TABLE `driver_performance_stats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `driver_id` INT NOT NULL UNIQUE, -- Logic Ref sang user_db
    `driver_name` VARCHAR(100) NOT NULL,
    `completed_trips` INT NOT NULL DEFAULT 0,
    `delayed_trips` INT NOT NULL DEFAULT 0,
    `avg_rating` DECIMAL(3,2) NOT NULL DEFAULT 5.00,
    `total_passengers_carried` INT NOT NULL DEFAULT 0,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `daily_revenue_stats` (`stat_date`, `total_bookings`, `total_tickets`, `gross_revenue`, `refund_amount`, `net_revenue`) VALUES
('2026-11-18', 24, 38, 12160000.00, 320000.00, 11840000.00),
('2026-11-19', 29, 45, 14400000.00, 0.00, 14400000.00),
('2026-11-20', 31, 52, 16640000.00, 640000.00, 16000000.00),
('2026-11-21', 42, 68, 21760000.00, 320000.00, 21440000.00),
('2026-11-22', 48, 79, 25280000.00, 960000.00, 24320000.00),
('2026-11-23', 35, 56, 17920000.00, 0.00, 17920000.00),
('2026-11-24', 39, 62, 19840000.00, 320000.00, 19520000.00);

INSERT INTO `route_performance_stats` (`route_name`, `total_trips`, `total_seats_capacity`, `seats_sold`, `occupancy_rate`, `total_revenue`, `avg_rating`) VALUES
('Hà Nội (BX Mỹ Đình) → Sa Pa', 45, 900, 810, 90.00, 259200000.00, 4.92),
('TP.HCM (BX Miền Đông) → Đà Lạt', 38, 760, 665, 87.50, 212800000.00, 4.85),
('Hà Nội → Hải Phòng (Limousine)', 60, 720, 612, 85.00, 122400000.00, 4.78),
('TP.HCM → Nha Trang', 28, 560, 448, 80.00, 156800000.00, 4.70);

INSERT INTO `driver_performance_stats` (`driver_id`, `driver_name`, `completed_trips`, `delayed_trips`, `avg_rating`, `total_passengers_carried`) VALUES
(2, 'Trần Văn Lái (Tài xế 1)', 48, 1, 4.95, 890),
(3, 'Lê Văn Tài (Tài xế 2)', 41, 2, 4.82, 745);
