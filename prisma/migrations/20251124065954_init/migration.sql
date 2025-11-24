-- CreateTable
CREATE TABLE "QARecord" (
    "id" TEXT NOT NULL,
    "departmentId" TEXT NOT NULL,
    "departmentName" TEXT NOT NULL,
    "fiscalYear" INTEGER NOT NULL,
    "month" TEXT NOT NULL,
    "data" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QARecord_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "qa_dept_year_idx" ON "QARecord"("departmentId", "fiscalYear");

-- CreateIndex
CREATE UNIQUE INDEX "QARecord_departmentId_fiscalYear_month_key" ON "QARecord"("departmentId", "fiscalYear", "month");
