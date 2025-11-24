import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

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

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");

    if (!departmentId || !fiscalYear) {
      return NextResponse.json(
        { success: false, message: "query ไม่ครบ" },
        { status: 400 }
      );
    }

    const fiscalYearInt = Number(fiscalYear);

    const records = await prisma.qARecord.findMany({
      where: {
        departmentId,
        fiscalYear: fiscalYearInt
      }
    });

    const byMonth: Record<string, any> = {};
    for (const r of records) {
      byMonth[r.month] = r;
    }

    return NextResponse.json({
      success: true,
      months: MONTHS_TH,
      data: byMonth
    });
  } catch (err) {
    console.error("Error loading year QA data", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
