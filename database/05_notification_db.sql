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
