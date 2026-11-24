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
