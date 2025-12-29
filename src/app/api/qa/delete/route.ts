import { NextRequest, NextResponse } from "next/server";
import { deleteRecord } from "@/lib/storage";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId, fiscalYear, month } = body;

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    const deleted = await deleteRecord(departmentId, fiscalYear, month);

    if (deleted) {
      return NextResponse.json({
        success: true,
        message: "ลบข้อมูลสำเร็จ"
      });
    }

    return NextResponse.json(
      { success: false, message: "ไม่พบข้อมูลที่ต้องการลบ" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error deleting record:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการลบข้อมูล" },
      { status: 500 }
    );
  }
}