import { NextRequest, NextResponse } from "next/server";
import { getRecordByPeriod } from "@/lib/storage";

export const dynamic = 'force-dynamic';
/**
 * Check if a record already exists for the given department, fiscal year, and month.
 * This API helps prevent duplicate data entry by warning users before they save.
 * 
 * GET /api/qa/check-duplicate?departmentId=...&fiscalYear=...&month=...
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");
    const month = searchParams.get("month");

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน (departmentId, fiscalYear, month จำเป็นต้องระบุ)" },
        { status: 400 }
      );
    }

    const existingRecord = await getRecordByPeriod(departmentId, fiscalYear, month);
    const recordId = `${departmentId}-${fiscalYear}-${month}`;

    return NextResponse.json({
      success: true,
      exists: !!existingRecord,
      record: existingRecord || null,
      recordId
    });
  } catch (error) {
    console.error("Error checking for duplicate:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการตรวจสอบข้อมูล" },
      { status: 500 }
    );
  }
}

