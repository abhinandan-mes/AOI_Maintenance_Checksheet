-- AlterTable
ALTER TABLE "aoi_spi_maintenance_record" ADD COLUMN     "eng_reviewed_at" TIMESTAMP(6),
ADD COLUMN     "mgr_approved_at" TIMESTAMP(6),
ADD COLUMN     "reassigned_at" TIMESTAMP(6),
ADD COLUMN     "reassigned_by" VARCHAR(150);
