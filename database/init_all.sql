-- ====================================================================
-- FILE KHỞI TẠO TỔNG HỢP: CHẠY TOÀN BỘ 4 CSDL & DỮ LIỆU MẪU BAN ĐẦU
-- ====================================================================

-- 1. KHỞI TẠO user_db
CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `user_db`;

DROP TABLE IF EXISTS `loyalty_history`;
DROP TABLE IF EXISTS `driver_profiles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(20) NOT NULL UNIQUE,
    `description` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `role_id` INT NOT NULL,
    `full_name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(15) NOT NULL UNIQUE,
    `password_hash` VARCHAR(255) NOT NULL,
    `avatar_url` VARCHAR(255) NULL,
    `membership_tier` ENUM('BRONZE', 'SILVER', 'GOLD') DEFAULT 'BRONZE',
    `loyalty_points` INT DEFAULT 0,
    `is_active` BOOLEAN DEFAULT TRUE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    CONSTRAINT `fk_users_role` FOREIGN KEY (`role_id`) REFERENCES `roles` (`id`) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `driver_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `license_number` VARCHAR(30) NOT NULL UNIQUE,
    `experience_years` INT DEFAULT 1,
    `status` ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_driver_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `loyalty_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `points_change` INT NOT NULL COMMENT 'Dương là tích điểm, âm là tiêu điểm',
    `action_type` ENUM('WELCOME_BONUS', 'TRIP_REWARD', 'REDEEM_DISCOUNT', 'TIER_UPGRADE') NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_loyalty_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `roles` (`id`, `name`, `description`) VALUES
(1, 'ADMIN', 'Quản trị viên toàn hệ thống'),
(2, 'CUSTOMER', 'Khách hàng đặt vé'),
(3, 'DRIVER', 'Tài xế / Nhân viên phụ trách chuyến xe');

INSERT INTO `users` (`id`, `role_id`, `full_name`, `email`, `phone`, `password_hash`, `membership_tier`, `loyalty_points`) VALUES
(1, 1, 'Nguyễn Quản Trị', 'admin@vexere.com', '0901000001', '$2b$10$eE..mockedAdminHashForTestingPurposesOnly..', 'GOLD', 2500),
(2, 3, 'Trần Văn Lái (Tài xế 1)', 'driver1@vexere.com', '0902000001', '$2b$10$eE..mockedDriverHashForTestingPurposesOnly..', 'BRONZE', 0),
(3, 3, 'Lê Văn Tài (Tài xế 2)', 'driver2@vexere.com', '0902000002', '$2b$10$eE..mockedDriverHashForTestingPurposesOnly..', 'BRONZE', 0),
(4, 2, 'Hoàng Khách Hàng', 'khachhang@gmail.com', '0903000001', '$2b$10$eE..mockedCustomerHashForTestingPurposes..', 'SILVER', 850);

INSERT INTO `driver_profiles` (`user_id`, `license_number`, `experience_years`, `status`) VALUES
(2, 'GPLX-HN-99881', 5, 'ACTIVE'),
(3, 'GPLX-HN-77223', 8, 'ACTIVE');

INSERT INTO `loyalty_history` (`user_id`, `points_change`, `action_type`, `description`) VALUES
(4, 500, 'WELCOME_BONUS', 'Thưởng chào mừng kích hoạt tài khoản'),
(4, 350, 'TRIP_REWARD', 'Tích lũy 3% sau khi hoàn thành chuyến Hà Nội - Sa Pa');

-- --------------------------------------------------------------------
-- 2. KHỞI TẠO trip_db
CREATE DATABASE IF NOT EXISTS `trip_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trip_db`;

DROP TABLE IF EXISTS `reviews`;
DROP TABLE IF EXISTS `trips`;
DROP TABLE IF EXISTS `seats`;
DROP TABLE IF EXISTS `buses`;
DROP TABLE IF EXISTS `routes`;
DROP TABLE IF EXISTS `stations`;

CREATE TABLE `stations` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `city` VARCHAR(50) NOT NULL,
    `address` VARCHAR(255) NOT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

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

CREATE TABLE `buses` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `plate_number` VARCHAR(20) NOT NULL UNIQUE,
    `bus_type` ENUM('SEAT', 'SLEEPER', 'LIMOUSINE') NOT NULL DEFAULT 'SLEEPER',
    `floor_count` INT NOT NULL DEFAULT 1,
    `total_seats` INT NOT NULL,
    `status` ENUM('ACTIVE', 'MAINTENANCE') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seats` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `bus_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `floor_number` INT NOT NULL DEFAULT 1,
    `seat_type` ENUM('STANDARD', 'VIP') DEFAULT 'STANDARD',
    CONSTRAINT `fk_seat_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_bus_seat` (`bus_id`, `seat_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `trips` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `route_id` INT NOT NULL,
    `bus_id` INT NOT NULL,
    `driver_id` INT NOT NULL,
    `departure_time` DATETIME NOT NULL,
    `arrival_time` DATETIME NOT NULL,
    `price` DECIMAL(10,2) NOT NULL,
    `status` ENUM('SCHEDULED', 'DEPARTED', 'COMPLETED', 'CANCELLED') DEFAULT 'SCHEDULED',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_trip_route` FOREIGN KEY (`route_id`) REFERENCES `routes` (`id`),
    CONSTRAINT `fk_trip_bus` FOREIGN KEY (`bus_id`) REFERENCES `buses` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_review_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `stations` (`id`, `name`, `city`, `address`) VALUES
(1, 'Bến xe Mỹ Đình', 'Hà Nội', 'Số 20 Phạm Hùng, Nam Từ Liêm, Hà Nội'),
(2, 'Bến xe Sa Pa', 'Lào Cai', 'Thị xã Sa Pa, Lào Cai'),
(3, 'Bến xe Miền Đông', 'Hồ Chí Minh', '292 Đinh Bộ Lĩnh, Bình Thạnh, TP.HCM'),
(4, 'Bến xe Liên Tỉnh Đà Lạt', 'Lâm Đồng', 'Số 01 Tô Hiến Thành, TP Đà Lạt');

INSERT INTO `routes` (`id`, `origin_station_id`, `destination_station_id`, `distance_km`, `estimated_hours`, `base_price`) VALUES
(1, 1, 2, 315.00, 5.50, 280000.00),
(2, 2, 1, 315.00, 5.50, 280000.00),
(3, 3, 4, 305.00, 6.00, 300000.00);

INSERT INTO `buses` (`id`, `plate_number`, `bus_type`, `floor_count`, `total_seats`, `status`) VALUES
(1, '29B-998.88', 'SLEEPER', 2, 20, 'ACTIVE'),
(2, '51B-123.45', 'LIMOUSINE', 1, 12, 'ACTIVE');

INSERT INTO `seats` (`bus_id`, `seat_code`, `floor_number`, `seat_type`) VALUES
(1, 'A01', 1, 'VIP'), (1, 'A02', 1, 'VIP'), (1, 'A03', 1, 'STANDARD'), (1, 'A04', 1, 'STANDARD'),
(1, 'A05', 1, 'STANDARD'), (1, 'A06', 1, 'STANDARD'), (1, 'A07', 1, 'STANDARD'), (1, 'A08', 1, 'STANDARD'),
(1, 'A09', 1, 'STANDARD'), (1, 'A10', 1, 'STANDARD'),
(1, 'B01', 2, 'VIP'), (1, 'B02', 2, 'VIP'), (1, 'B03', 2, 'STANDARD'), (1, 'B04', 2, 'STANDARD'),
(1, 'B05', 2, 'STANDARD'), (1, 'B06', 2, 'STANDARD'), (1, 'B07', 2, 'STANDARD'), (1, 'B08', 2, 'STANDARD'),
(1, 'B09', 2, 'STANDARD'), (1, 'B10', 2, 'STANDARD');

INSERT INTO `trips` (`id`, `route_id`, `bus_id`, `driver_id`, `departure_time`, `arrival_time`, `price`, `status`) VALUES
(1, 1, 1, 2, DATE_ADD(NOW(), INTERVAL 1 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 1 DAY), INTERVAL 6 HOUR), 320000.00, 'SCHEDULED'),
(2, 1, 1, 3, DATE_ADD(NOW(), INTERVAL 2 DAY), DATE_ADD(DATE_ADD(NOW(), INTERVAL 2 DAY), INTERVAL 6 HOUR), 320000.00, 'SCHEDULED');

INSERT INTO `reviews` (`trip_id`, `user_id`, `customer_name`, `rating`, `comment`, `created_at`) VALUES
(1, 4, 'Hoàng Khách Hàng', 5, 'Xe chạy rất êm, bác tài lái cẩn thận, giường nằm sạch sẽ thơm tho!', NOW()),
(1, 5, 'Lê Thị Mai', 5, 'Khởi hành đúng giờ, có nước suối và khăn lạnh miễn phí. Rất hài lòng!', NOW());

-- --------------------------------------------------------------------
-- 3. KHỞI TẠO booking_db
CREATE DATABASE IF NOT EXISTS `booking_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `booking_db`;

DROP TABLE IF EXISTS `seat_locks`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `bookings`;

CREATE TABLE `bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_code` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` INT NULL,
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone` VARCHAR(15) NOT NULL,
    `customer_email` VARCHAR(100) NOT NULL,
    `trip_id` INT NOT NULL,
    `total_seats` INT NOT NULL DEFAULT 1,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `trip_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `passenger_name` VARCHAR(100) NOT NULL,
    `ticket_price` DECIMAL(10,2) NOT NULL,
    `qr_code` VARCHAR(255) NOT NULL UNIQUE,
    `check_in_status` ENUM('UNCHECKED', 'CHECKED_IN') DEFAULT 'UNCHECKED',
    `checked_in_at` DATETIME NULL,
    `checked_in_by` INT NULL,
    CONSTRAINT `fk_ticket_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_trip_seat` (`trip_id`, `seat_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `seat_locks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    UNIQUE KEY `uk_lock_trip_seat` (`trip_id`, `seat_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `bookings` (`id`, `booking_code`, `user_id`, `customer_name`, `customer_phone`, `customer_email`, `trip_id`, `total_seats`, `total_amount`, `status`) VALUES
(1, 'BK20261106-0001', 4, 'Hoàng Khách Hàng', '0903000001', 'khachhang@gmail.com', 1, 2, 640000.00, 'CONFIRMED');

INSERT INTO `tickets` (`id`, `booking_id`, `trip_id`, `seat_code`, `passenger_name`, `ticket_price`, `qr_code`, `check_in_status`) VALUES
(1, 1, 1, 'A01', 'Hoàng Khách Hàng', 320000.00, 'QR-TRIP1-SEAT-A01-SEC99182', 'UNCHECKED'),
(2, 1, 1, 'A02', 'Nguyễn Thị Bạn', 320000.00, 'QR-TRIP1-SEAT-A02-SEC99183', 'UNCHECKED');

-- --------------------------------------------------------------------
-- 4. KHỞI TẠO payment_db
CREATE DATABASE IF NOT EXISTS `payment_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `payment_db`;

DROP TABLE IF EXISTS `payment_logs`;
DROP TABLE IF EXISTS `payments`;

CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `booking_code` VARCHAR(30) NOT NULL,
    `payment_method` ENUM('VNPAY', 'MOMO', 'CASH', 'BANK_TRANSFER') NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    `transaction_id` VARCHAR(100) NULL,
    `paid_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE `payment_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_id` INT NOT NULL,
    `gateway_response` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_log_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO `payments` (`id`, `booking_id`, `booking_code`, `payment_method`, `amount`, `status`, `transaction_id`, `paid_at`) VALUES
(1, 1, 'BK20261106-0001', 'VNPAY', 640000.00, 'SUCCESS', 'VNPAY-TRANS-99887766', NOW());

INSERT INTO `payment_logs` (`payment_id`, `gateway_response`) VALUES
(1, '{"vnp_ResponseCode":"00","vnp_TransactionNo":"1429988","vnp_Amount":"64000000","vnp_BankCode":"NCB"}');
