-- =============================================
-- DATABASE: trip_db (Trip & Route Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `trip_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trip_db`;

DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `stations`;

-- 1. Bảng bến xe / điểm đón trả
CREATE TABLE `stations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng tuyến đường
CREATE TABLE `routes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `origin_station_id` INT NOT NULL,
    `destination_station_id` INT NOT NULL,
    `distance_km` DECIMAL(6,2) NOT NULL,
    `estimated_hours` DECIMAL(4,2) NOT NULL,
    `base_price` DECIMAL(10,2) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_route_origin` FOREIGN KEY (`origin_station_id`) REFERENCES `stations` (`id`),
    CONSTRAINT `fk_route_dest` FOREIGN KEY (`destination_station_id`) REFERENCES `stations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng xe
CREATE TABLE `buses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `plate_number` VARCHAR(20) NOT NULL UNIQUE,
    `bus_type` ENUM('SEAT', 'SLEEPER', 'LIMOUSINE') NOT NULL DEFAULT 'SLEEPER',
    `floor_count` INT NOT NULL DEFAULT 1,
    `total_seats` INT NOT NULL,
    `status` ENUM('ACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng danh sách ghế của xe
CREATE TABLE `seats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `floor_number` INT NOT NULL DEFAULT 1,
    `seat_type` ENUM('STANDARD', 'VIP') DEFAULT 'STANDARD',
    CONSTRAINT `fk_seat_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_bus_seat` (`bus_id`, `seat_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 5. Bảng chuyến xe theo lịch trình
CREATE TABLE `trips` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `route_id` INT NOT NULL,
    `bus_id` INT NOT NULL,
    `driver_id` INT NOT NULL, -- ID Tài xế phụ trách (Logic Ref từ user_db)
    `departure_time` DATETIME NOT NULL,
    `arrival_time` DATETIME NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `status` ENUM('SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_trip_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
    CONSTRAINT `fk_trip_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `stations` (`id`, `name`, `city`, `address`) VALUES
(1, 'Bến xe Mỹ Đình', 'Hà Nội', 'Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội'),
(2, 'Bến xe Sa Pa', 'Lào Cai', 'Thị xã Sa Pa, Lào Cai'),
(3, 'Bến xe Miền Đông', 'Hồ Chí Minh', '292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM'),
(4, 'Bến xe Liên Tỉnh Đà Lạt', 'Lâm Đồng', 'Số 01 Tô Hiến Thành, TP Đà Lạt');

INSERT INTO `routes` (`id`, `origin_station_id`, `destination_station_id`, `distance_km`, `estimated_hours`, `base_price`) VALUES
(1, 1, 2, 315.00, 5.50, 280000.00), -- Tuyến Hà Nội -> Sa Pa
(2, 2, 1, 315.00, 5.50, 280000.00), -- Tuyến Sa Pa -> Hà Nội
(3, 3, 4, 305.00, 6.00, 300000.00); -- Tuyến TP.HCM -> Đà Lạt

-- Tạo 1 xe Giường nằm 2 tầng 20 chỗ (Tầng 1: A01-A10, Tầng 2: B01-B10)
INSERT INTO `buses` (`id`, `plate_number`, `bus_type`, `floor_count`, `total_seats`, `status`) VALUES
(1, '29B-998.88', 'SLEEPER', 2, 20, 'ACTIVE'),
(2, '51B-123.45', 'LIMOUSINE', 1, 12, 'ACTIVE');

-- Khởi tạo ghế cho xe 1 (Tầng 1)
INSERT INTO `seats` (`bus_id`, `seat_code`, `floor_number`, `seat_type`) VALUES
(1, 'A01', 1, 'VIP'), (1, 'A02', 1, 'VIP'), (1, 'A03', 1, 'STANDARD'), (1, 'A04', 1, 'STANDARD'),
(1, 'A05', 1, 'STANDARD'), (1, 'A06', 1, 'STANDARD'), (1, 'A07', 1, 'STANDARD'), (1, 'A08', 1, 'STANDARD'),
(1, 'A09', 1, 'STANDARD'), (1, 'A10', 1, 'STANDARD');

-- Khởi tạo ghế cho xe 1 (Tầng 2)
INSERT INTO `seats` (`bus_id`, `seat_code`, `floor_number`, `seat_type`) VALUES
(1, 'B01', 2, 'VIP'), (1, 'B02', 2, 'VIP'), (1, 'B03', 2, 'STANDARD'), (1, 'B04', 2, 'STANDARD'),
(1, 'B05', 2, 'STANDARD'), (1, 'B06', 2, 'STANDARD'), (1, 'B07', 2, 'STANDARD'), (1, 'B08', 2, 'STANDARD'),
(1, 'B09', 2, 'STANDARD'), (1, 'B10', 2, 'STANDARD');

-- Khởi tạo chuyến xe mẫu chạy ngày mai (Tài xế id = 2 phụ trách)
INSERT INTO `trips` (`id`, `route_id`, `bus_id`, `driver_id`, `departure_time`, `arrival_time`, `price`, `status`) VALUES
(1, 1, 1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 6 HOUR), 320000.00, 'SCHEDULED'),
(2, 1, 1, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 6 HOUR), 320000.00, 'SCHEDULED');
