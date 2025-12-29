import { NextRequest, NextResponse } from "next/server";
import { getRecordByPeriod } from "@/lib/storage";

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");
    const month = searchParams.get("month");

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const record = await getRecordByPeriod(departmentId, fiscalYear, month);

    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error("Error fetching record by period:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
      { status: 500 }
    );
  }
}