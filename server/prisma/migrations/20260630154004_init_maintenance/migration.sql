-- CreateTable
CREATE TABLE "aoi_spi_maintenance_record" (
    "id" SERIAL NOT NULL,
    "equipment_type" VARCHAR(50) NOT NULL,
    "machine_name" VARCHAR(100),
    "machine_type" VARCHAR(100),
    "line" VARCHAR(50),
    "date" DATE NOT NULL,
    "period" VARCHAR(50) NOT NULL,
    "submitted_by" VARCHAR(150),
    "reviewed_by" VARCHAR(150),
    "remarks" VARCHAR(1000),
    "m1_clean_test_area" BOOLEAN,
    "m2_clean_inside_wipe_sensor" BOOLEAN,
    "m3_check_equipment_box" BOOLEAN,
    "m4_clean_filter_cotton" BOOLEAN,
    "m5_check_belt_dirty_damaged" BOOLEAN,
    "m6_check_rails_smooth" BOOLEAN,
    "m7_check_tank_chain" BOOLEAN,
    "m8_check_no_jitter" BOOLEAN,
    "q1_clean_cabinet_dust" BOOLEAN,
    "q2_inspect_belt" BOOLEAN,
    "q3_screws_rails_lubricant" BOOLEAN,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "aoi_spi_maintenance_record_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "full_name" VARCHAR(150) NOT NULL,
    "role" VARCHAR(50) NOT NULL DEFAULT 'operator',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "app_users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "app_sessions" (
    "session_id" UUID NOT NULL,
    "user_id" INTEGER NOT NULL,
    "public_ip" VARCHAR(100),
    "login_time" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "logout_time" TIMESTAMP(6),
    "status" VARCHAR(50) NOT NULL DEFAULT 'active',

    CONSTRAINT "app_sessions_pkey" PRIMARY KEY ("session_id")
);

-- CreateIndex
CREATE INDEX "aoi_spi_maintenance_record_date_idx" ON "aoi_spi_maintenance_record"("date");

-- CreateIndex
CREATE INDEX "aoi_spi_maintenance_record_equipment_type_idx" ON "aoi_spi_maintenance_record"("equipment_type");

-- CreateIndex
CREATE INDEX "aoi_spi_maintenance_record_line_idx" ON "aoi_spi_maintenance_record"("line");

-- CreateIndex
CREATE UNIQUE INDEX "app_users_username_key" ON "app_users"("username");

-- AddForeignKey
ALTER TABLE "app_sessions" ADD CONSTRAINT "app_sessions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "app_users"("id") ON DELETE CASCADE ON UPDATE CASCADE;
