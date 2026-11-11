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
