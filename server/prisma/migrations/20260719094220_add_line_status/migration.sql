-- CreateTable
CREATE TABLE "line_status" (
    "id" SERIAL NOT NULL,
    "line" VARCHAR(20) NOT NULL,
    "is_installed" BOOLEAN NOT NULL DEFAULT true,
    "updated_by" VARCHAR(100),
    "updated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "line_status_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "line_status_line_key" ON "line_status"("line");
