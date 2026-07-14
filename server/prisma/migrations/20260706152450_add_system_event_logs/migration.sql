-- CreateTable
CREATE TABLE "system_event_logs" (
    "id" SERIAL NOT NULL,
    "event_type" VARCHAR(100) NOT NULL,
    "username" VARCHAR(150) NOT NULL,
    "public_ip" VARCHAR(100),
    "details" VARCHAR(1000),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_event_logs_pkey" PRIMARY KEY ("id")
);
