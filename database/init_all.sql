-- =============================================
-- MASTER INIT SCRIPT: ALL 8 MICROSERVICES DATABASES
-- Run with: mysql -u root --default-character-set=utf8mb4 < database/init_all.sql
-- =============================================

-- =============================================
-- DATABASE: user_db (User & Auth Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `user_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `user_db`;

DROP TABLE IF EXISTS `loyalty_history`;
DROP TABLE IF EXISTS `driver_profiles`;
DROP TABLE IF EXISTS `users`;
DROP TABLE IF EXISTS `roles`;

-- 1. Bảng vai trò
CREATE TABLE `roles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(20) NOT NULL UNIQUE,
    `description` VARCHAR(100) NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng người dùng (Khách hàng, Tài xế, Admin)
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

-- 3. Bảng hồ sơ riêng cho tài xế
CREATE TABLE `driver_profiles` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL UNIQUE,
    `license_number` VARCHAR(30) NOT NULL UNIQUE,
    `experience_years` INT DEFAULT 1,
    `status` ENUM('ACTIVE', 'ON_LEAVE', 'INACTIVE') DEFAULT 'ACTIVE',
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_driver_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4. Bảng lịch sử tích / tiêu điểm hội viên
CREATE TABLE `loyalty_history` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `points_change` INT NOT NULL COMMENT 'Dương là tích điểm, âm là tiêu điểm',
    `action_type` ENUM('WELCOME_BONUS', 'TRIP_REWARD', 'REDEEM_DISCOUNT', 'TIER_UPGRADE') NOT NULL,
    `description` VARCHAR(255) NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_loyalty_user` FOREIGN KEY (`user_id`) REFERENCES `users` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- Mật khẩu mặc định cho các tài khoản test là: "Password123@"
-- Hash Bcrypt: $2b$10$wN1QeF00mI2V9g1i4h7G8.N70Q3vB76mQJ009j8k7l6m5n4o3p2q1 (mô phỏng)
-- =============================================

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


-- =============================================
-- DATABASE: trip_db (Trip & Route Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `trip_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `trip_db`;

DROP TABLE IF EXISTS `reviews`;
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

-- 6. Bảng đánh giá và nhận xét chuyến xe từ khách hàng
CREATE TABLE `reviews` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT NOT NULL,
    `user_id` INT NOT NULL, -- Logic Ref sang user_db (người đánh giá)
    `customer_name` VARCHAR(100) NOT NULL,
    `rating` TINYINT NOT NULL CHECK (`rating` >= 1 AND `rating` <= 5),
    `comment` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_review_trip` FOREIGN KEY (`trip_id`) REFERENCES `trips` (`id`) ON DELETE CASCADE
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

-- Đánh giá mẫu cho chuyến xe
INSERT INTO `reviews` (`trip_id`, `user_id`, `customer_name`, `rating`, `comment`, `created_at`) VALUES
(1, 4, 'Hoàng Khách Hàng', 5, 'Xe chạy rất êm, bác tài lái cẩn thận, giường nằm sạch sẽ thơm tho!', NOW()),
(1, 5, 'Lê Thị Mai', 5, 'Khởi hành đúng giờ, có nước suối và khăn lạnh miễn phí. Rất hài lòng!', NOW());


-- =============================================
-- DATABASE: booking_db (Booking & Ticket Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `booking_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `booking_db`;

DROP TABLE IF EXISTS `seat_locks`;
DROP TABLE IF EXISTS `tickets`;
DROP TABLE IF EXISTS `bookings`;

-- 1. Bảng đơn đặt vé
CREATE TABLE `bookings` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_code` VARCHAR(30) NOT NULL UNIQUE,
    `user_id` INT NULL, -- Logic Ref sang user_db (NULL nếu là khách vãng lai)
    `customer_name` VARCHAR(100) NOT NULL,
    `customer_phone` VARCHAR(15) NOT NULL,
    `customer_email` VARCHAR(100) NOT NULL,
    `trip_id` INT NOT NULL, -- Logic Ref sang trip_db
    `total_seats` INT NOT NULL DEFAULT 1,
    `total_amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('PENDING', 'CONFIRMED', 'CANCELLED') DEFAULT 'PENDING',
    `refundable_until` DATETIME NULL, -- Thời hạn cuối được phép hủy/hoàn vé (sau hạn này tự cộng điểm hội viên)
    `points_awarded` BOOLEAN NOT NULL DEFAULT FALSE,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng vé chi tiết (mỗi ghế là 1 vé có mã QR riêng)
CREATE TABLE `tickets` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL,
    `trip_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `passenger_name` VARCHAR(100) NOT NULL,
    `ticket_price` DECIMAL(10,2) NOT NULL,
    `qr_code` VARCHAR(255) NOT NULL UNIQUE, -- Chuỗi QR duy nhất
    `check_in_status` ENUM('UNCHECKED', 'CHECKED_IN') DEFAULT 'UNCHECKED',
    `checked_in_at` DATETIME NULL,
    `checked_in_by` INT NULL, -- ID Tài xế đã quét mã (Logic Ref từ user_db)
    CONSTRAINT `fk_ticket_booking` FOREIGN KEY (`booking_id`) REFERENCES `bookings` (`id`) ON DELETE CASCADE,
    UNIQUE KEY `uk_trip_seat` (`trip_id`, `seat_code`) -- 1 ghế trong 1 chuyến chỉ được có 1 vé hợp lệ
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3. Bảng giữ chỗ tạm thời (khóa ghế trong 10 phút để thanh toán)
CREATE TABLE `seat_locks` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT NOT NULL,
    `seat_code` VARCHAR(10) NOT NULL,
    `session_id` VARCHAR(100) NOT NULL,
    `expires_at` DATETIME NOT NULL,
    UNIQUE KEY `uk_lock_trip_seat` (`trip_id`, `seat_code`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- Mẫu 1 đơn đặt vé đã thanh toán cho chuyến trip_id = 1
-- =============================================

INSERT INTO `bookings` (`id`, `booking_code`, `user_id`, `customer_name`, `customer_phone`, `customer_email`, `trip_id`, `total_seats`, `total_amount`, `status`) VALUES
(1, 'BK20261106-0001', 4, 'Hoàng Khách Hàng', '0903000001', 'khachhang@gmail.com', 1, 2, 640000.00, 'CONFIRMED');

INSERT INTO `tickets` (`id`, `booking_id`, `trip_id`, `seat_code`, `passenger_name`, `ticket_price`, `qr_code`, `check_in_status`) VALUES
(1, 1, 1, 'A01', 'Hoàng Khách Hàng', 320000.00, 'QR-TRIP1-SEAT-A01-SEC99182', 'UNCHECKED'),
(2, 1, 1, 'A02', 'Nguyễn Thị Bạn', 320000.00, 'QR-TRIP1-SEAT-A02-SEC99183', 'UNCHECKED');


-- =============================================
-- DATABASE: payment_db (Payment Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `payment_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `payment_db`;

DROP TABLE IF EXISTS `payment_logs`;
DROP TABLE IF EXISTS `payments`;

-- 1. Bảng thanh toán
CREATE TABLE `payments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `booking_id` INT NOT NULL, -- Logic Ref sang booking_db
    `booking_code` VARCHAR(30) NOT NULL,
    `payment_method` ENUM('VNPAY', 'MOMO', 'CASH', 'BANK_TRANSFER') NOT NULL,
    `amount` DECIMAL(10,2) NOT NULL,
    `status` ENUM('PENDING', 'SUCCESS', 'FAILED', 'REFUNDED') DEFAULT 'PENDING',
    `transaction_id` VARCHAR(100) NULL, -- Mã giao dịch đối tác/ngân hàng
    `paid_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng nhật ký phản hồi từ cổng thanh toán (dùng để đối soát/audit)
CREATE TABLE `payment_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `payment_id` INT NOT NULL,
    `gateway_response` TEXT NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_log_payment` FOREIGN KEY (`payment_id`) REFERENCES `payments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `payments` (`id`, `booking_id`, `booking_code`, `payment_method`, `amount`, `status`, `transaction_id`, `paid_at`) VALUES
(1, 1, 'BK20261106-0001', 'VNPAY', 640000.00, 'SUCCESS', 'VNPAY-TRANS-99887766', NOW());

INSERT INTO `payment_logs` (`payment_id`, `gateway_response`) VALUES
(1, '{"vnp_ResponseCode":"00","vnp_TransactionNo":"1429988","vnp_Amount":"64000000","vnp_BankCode":"NCB"}');


-- =============================================
-- DATABASE: notification_db (Notification Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `notification_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `notification_db`;

DROP TABLE IF EXISTS `notifications`;

-- Bảng lịch sử gửi thông báo (Email / SMS / In-App)
CREATE TABLE `notifications` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NULL, -- Logic Ref sang user_db
    `booking_code` VARCHAR(30) NULL, -- Logic Ref sang booking_db
    `recipient_email` VARCHAR(100) NULL,
    `recipient_phone` VARCHAR(15) NULL,
    `type` ENUM('BOOKING_CONFIRM', 'REFUND_NOTICE', 'TRIP_REMINDER', 'DISPATCH_ALERT', 'SYSTEM') NOT NULL,
    `channel` ENUM('EMAIL', 'SMS', 'IN_APP') NOT NULL DEFAULT 'EMAIL',
    `subject` VARCHAR(255) NOT NULL,
    `content` TEXT NOT NULL,
    `status` ENUM('PENDING', 'SENT', 'FAILED') NOT NULL DEFAULT 'PENDING',
    `preview_url` VARCHAR(500) NULL, -- Link xem trước Email (Ethereal Test / Log)
    `error_message` TEXT NULL,
    `sent_at` DATETIME NULL,
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `notifications` (`id`, `user_id`, `booking_code`, `recipient_email`, `recipient_phone`, `type`, `channel`, `subject`, `content`, `status`, `preview_url`, `sent_at`) VALUES
(1, 4, 'BK20261106-0001', 'khachhang@gmail.com', '0903000001', 'BOOKING_CONFIRM', 'EMAIL', '[EcoBus] Xác nhận vé điện tử #BK20261106-0001 (Hà Nội - Sa Pa)', 'Đặt vé thành công 2 ghế A01, A02 chuyến Hà Nội -> Sa Pa. Tổng tiền: 640.000 VNĐ.', 'SENT', NULL, NOW());


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


-- =============================================
-- DATABASE: dispatch_db (Dispatch & Driver Schedule Service)
-- =============================================

CREATE DATABASE IF NOT EXISTS `dispatch_db` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE `dispatch_db`;

DROP TABLE IF EXISTS `journey_logs`;
DROP TABLE IF EXISTS `driver_assignments`;

-- 1. Bảng phân công ca chạy cho Tài xế
CREATE TABLE `driver_assignments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `trip_id` INT NOT NULL, -- Logic Ref sang trip_db
    `driver_id` INT NOT NULL, -- Logic Ref sang user_db
    `driver_name` VARCHAR(100) NOT NULL,
    `bus_plate` VARCHAR(20) NOT NULL,
    `route_name` VARCHAR(150) NOT NULL,
    `shift_date` DATE NOT NULL,
    `departure_time` VARCHAR(20) NOT NULL,
    `status` ENUM('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'DELAYED', 'CANCELLED') NOT NULL DEFAULT 'ASSIGNED',
    `notes` VARCHAR(255) NULL,
    `assigned_by` INT NULL, -- ID Admin phân công
    `created_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    `updated_at` DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 2. Bảng nhật ký hành trình & báo cáo sự cố dọc đường
CREATE TABLE `journey_logs` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `assignment_id` INT NOT NULL,
    `checkpoint_name` VARCHAR(150) NOT NULL,
    `event_type` ENUM('DEPARTED', 'REST_STOP', 'INCIDENT', 'ARRIVED') NOT NULL,
    `description` TEXT NULL,
    `latitude` DECIMAL(10,7) NULL,
    `longitude` DECIMAL(10,7) NULL,
    `logged_at` DATETIME DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT `fk_log_assignment` FOREIGN KEY (`assignment_id`) REFERENCES `driver_assignments` (`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- =============================================
-- DỮ LIỆU MẪU BAN ĐẦU (SEED DATA)
-- =============================================

INSERT INTO `driver_assignments` (`id`, `trip_id`, `driver_id`, `driver_name`, `bus_plate`, `route_name`, `shift_date`, `departure_time`, `status`, `notes`, `assigned_by`) VALUES
(1, 1, 2, 'Trần Văn Lái (Tài xế 1)', '29B-999.88', 'Hà Nội (BX Mỹ Đình) → Sa Pa', '2026-11-25', '22:00', 'IN_PROGRESS', 'Xe Limousine VIP 34 phòng - Chạy cao tốc Nội Bài Lào Cai', 1),
(2, 2, 3, 'Lê Văn Tài (Tài xế 2)', '51B-888.66', 'TP.HCM (BX Miền Đông) → Đà Lạt', '2026-11-26', '23:00', 'ASSIGNED', 'Kiểm tra kỹ phanh và lốp trước khi xuất bến', 1);

INSERT INTO `journey_logs` (`assignment_id`, `checkpoint_name`, `event_type`, `description`, `latitude`, `longitude`) VALUES
(1, 'Bến xe Mỹ Đình, Hà Nội', 'DEPARTED', 'Xe xuất bến đúng giờ, đủ 18/20 hành khách đã check-in QR.', 21.0285110, 105.7782230),
(1, 'Trạm dừng nghỉ Km57 Cao tốc NB-LC', 'REST_STOP', 'Xe dừng nghỉ 15 phút cho hành khách vệ sinh và ăn nhẹ.', 21.4832100, 105.2314500);


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
