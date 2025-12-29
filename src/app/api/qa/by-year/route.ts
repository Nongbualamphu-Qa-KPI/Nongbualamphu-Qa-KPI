import { NextRequest, NextResponse } from "next/server";
import { getRecordsByYear } from "@/lib/storage";

export const dynamic = 'force-dynamic';
const MONTHS_TH = [
  "ตุลาคม",
  "พฤศจิกายน",
  "ธันวาคม",
  "มกราคม",
  "กุมภาพันธ์",
  "มีนาคม",
  "เมษายน",
  "พฤษภาคม",
  "มิถุนายน",
  "กรกฎาคม",
  "สิงหาคม",
  "กันยายน"
];

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");

    if (!departmentId || !fiscalYear) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const records = await getRecordsByYear(departmentId, fiscalYear);

    // Create month map
    const data: Record<string, any> = {};
    for (const month of MONTHS_TH) {
      const record = records.find(r => r.month === month);
      if (record) {
        data[month] = {
          id: record.id,
          updatedAt: record.updatedAt,
          data: record.data
        };
      }
    }

    return NextResponse.json({
      success: true,
      data,
      records
    });
  } catch (error) {
    console.error("Error fetching records by year:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการโหลดข้อมูล" },
      { status: 500 }
    );
  }
}