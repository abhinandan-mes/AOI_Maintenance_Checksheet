-- AlterTable
ALTER TABLE "aoi_spi_maintenance_record" ADD COLUMN     "engineer_reviewed_by" VARCHAR(150),
ADD COLUMN     "manager_reviewed_by" VARCHAR(150),
ADD COLUMN     "rejection_reason" VARCHAR(500),
ADD COLUMN     "status" VARCHAR(50) NOT NULL DEFAULT 'SUBMITTED';
