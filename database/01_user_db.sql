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
