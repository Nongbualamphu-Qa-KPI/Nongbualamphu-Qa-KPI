import { NextRequest, NextResponse } from "next/server";
import { getAllRecords } from "@/lib/storage";

export const dynamic = 'force-dynamic';
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const fiscalYear = searchParams.get("fiscalYear");

    const records = await getAllRecords();

    // Filter by fiscal year if provided
    let filteredRecords = records;
    if (fiscalYear) {
      filteredRecords = records.filter(r => r.fiscalYear === fiscalYear);
    }

    // Sort by department and month
    filteredRecords.sort((a, b) => {
      if (a.departmentId !== b.departmentId) {
        return a.departmentId.localeCompare(b.departmentId);
      }
      // Sort months in fiscal year order
      const monthOrder = [
        "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
        "มกราคม", "กุมภาพันธ์", "มีนาคม",
        "เมษายน", "พฤษภาคม", "มิถุนายน",
        "กรกฎาคม", "สิงหาคม", "กันยายน"
      ];
      return monthOrder.indexOf(a.month) - monthOrder.indexOf(b.month);
    });

    return NextResponse.json({
      success: true,
      data: filteredRecords,
      totalRecords: filteredRecords.length
    });
  } catch (error) {
    console.error("Error fetching all departments data:", error);
    return NextResponse.json(
      {
        success: false,
        message: "เกิดข้อผิดพลาดในการโหลดข้อมูล",
        error: error instanceof Error ? error.message : "Unknown error"
      },
      { status: 500 }
    );
  }
}
