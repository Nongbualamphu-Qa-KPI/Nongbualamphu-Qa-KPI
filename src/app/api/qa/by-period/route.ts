import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const departmentId = searchParams.get("departmentId");
    const fiscalYear = searchParams.get("fiscalYear");
    const month = searchParams.get("month");

    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "query ไม่ครบ" },
        { status: 400 }
      );
    }

    const fiscalYearInt = Number(fiscalYear);

    const record = await prisma.qARecord.findUnique({
      where: {
        qa_unique_index: {
          departmentId,
          fiscalYear: fiscalYearInt,
          month
        }
      }
    });

    if (!record) {
      return NextResponse.json({ success: true, record: null });
    }

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("Error loading QA data", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
