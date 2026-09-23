-- CreateTable
CREATE TABLE `contacts` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(120) NOT NULL,
    `phone` VARCHAR(30) NULL,
    `email` VARCHAR(160) NULL,
    `contact_date` DATE NULL,
    `messaged` BOOLEAN NOT NULL DEFAULT false,
    `outcome` ENUM('AGUARDANDO', 'DEU_CERTO', 'NAO_DEU_CERTO') NOT NULL DEFAULT 'AGUARDANDO',
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `contacts_outcome_idx`(`outcome`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
