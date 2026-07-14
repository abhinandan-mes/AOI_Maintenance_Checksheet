-- CreateTable
CREATE TABLE "failed_login_attempts" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(100) NOT NULL,
    "public_ip" VARCHAR(100),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "failed_login_attempts_pkey" PRIMARY KEY ("id")
);
