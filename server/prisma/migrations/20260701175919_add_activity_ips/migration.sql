-- AlterTable
ALTER TABLE "aoi_spi_maintenance_record" ADD COLUMN     "eng_reviewed_ip" VARCHAR(100),
ADD COLUMN     "mgr_approved_ip" VARCHAR(100),
ADD COLUMN     "reassigned_ip" VARCHAR(100),
ADD COLUMN     "submitted_ip" VARCHAR(100);
