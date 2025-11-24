import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    const {
      departmentId,
      departmentName,
      fiscalYear,
      month,
      fields
    } = body as {
      departmentId: string;
      departmentName: string;
      fiscalYear: string | number;
      month: string;
      fields: Record<string, string>;
    };

    if (!departmentId || !departmentName || !fiscalYear || !month || !fields) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบ" },
        { status: 400 }
      );
    }

    const fiscalYearInt = Number(fiscalYear);

    const record = await prisma.qARecord.upsert({
      where: {
        qa_unique_index: {
          departmentId,
          fiscalYear: fiscalYearInt,
          month
        }
      },
      update: {
        departmentName,
        data: fields
      },
      create: {
        departmentId,
        departmentName,
        fiscalYear: fiscalYearInt,
        month,
        data: fields
      }
    });

    return NextResponse.json({ success: true, record });
  } catch (err) {
    console.error("Error saving QA data", err);
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    );
  }
}
