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
