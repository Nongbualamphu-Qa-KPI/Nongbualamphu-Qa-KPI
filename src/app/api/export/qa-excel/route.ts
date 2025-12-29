import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import * as XLSX from "xlsx";

export const dynamic = 'force-dynamic';
// Department definitions
const DEPARTMENTS = {
    ipd: [
        { id: "DEPT001", name: "หอผู้ป่วยอายุรกรรมชาย" },
        { id: "DEPT002", name: "หอผู้ป่วยอายุรกรรมหญิง" },
        { id: "DEPT003", name: "หอผู้ป่วยจิตเวช" },
        { id: "DEPT004", name: "หอผู้ป่วยพิเศษรวมน้ำใจ" },
        { id: "DEPT005", name: "หอผู้ป่วยศัลยกรรมชาย" },
        { id: "DEPT006", name: "หอผู้ป่วยศัลยกรรมหญิง" },
        { id: "DEPT007", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 1(ICU-MED_1)" },
        { id: "DEPT008", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 2(ICU-MED_2)" },
        { id: "DEPT009", name: "หอผู้ป่วยกระดูกและข้อ" },
        { id: "DEPT010", name: "หอผู้ป่วยพิเศษอายุรกรรมชั้น4" },
        { id: "DEPT011", name: "หอผู้ป่วยพิเศษศัลยกรรมชั้น4" },
        { id: "DEPT012", name: "หอผู้ป่วยกุมารเวช" },
        { id: "DEPT013", name: "หอผู้ป่วยอภิบาลสงฆ์" },
        { id: "DEPT014", name: "หอผู้ป่วยโสต ศอ นาสิก" },
        { id: "DEPT015", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น5" },
        { id: "DEPT016", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น4" },
        { id: "DEPT017", name: "หอผู้ป่วยพิเศษกุมารเวช" },
        { id: "DEPT018", name: "หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง" },
        { id: "DEPT019", name: "หอผู้ป่วยหนักกุมารเวช(NICU)" },
        { id: "DEPT020", name: "หอผู้ป่วยสูติ-นรีเวช (PP)" },
        { id: "DEPT021", name: "หอผู้ป่วยหนักรวม(ICU_รวม)" },
    ],
    special_unit: [
        { id: "SPECIAL001", name: "ห้องผ่าตัด (OR)" },
        { id: "SPECIAL002", name: "ห้องอุบัติเหตุ ฉุกเฉิน (ER)" },
        { id: "SPECIAL003", name: "วิสัญญีพยาบาล (Anesth)" },
        { id: "SPECIAL004", name: "ห้องคลอด (LR)" },
    ],
    opd: [
        { id: "OPD001", name: "OPD ศัลยกรรม" },
        { id: "OPD002", name: "OPD กุมารเวช" },
        { id: "OPD003", name: "OPD (Med+GP+Ortho+หัวใจ+พิเศษ)" },
        { id: "OPD004", name: "OPD ANC" },
        { id: "OPD005", name: "OPD Uro" },
        { id: "OPD006", name: "OPD Neuro" },
        { id: "OPD007", name: "OPD จักษุ" },
        { id: "OPD008", name: "OPD ENT" },
        { id: "OPD009", name: "OPD DM/HT" },
        { id: "OPD010", name: "OPD CAPD" },
    ],
};

const MONTHS_TH = [
    "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
    "มกราคม", "กุมภาพันธ์", "มีนาคม",
    "เมษายน", "พฤษภาคม", "มิถุนายน",
    "กรกฎาคม", "สิงหาคม", "กันยายน"
];

// Field labels for Excel headers (IPD fields)
const IPD_FIELD_LABELS: Record<string, string> = {
    s1_1: "จำนวนผู้ป่วย Admit",
    s1_2: "จำนวนผู้ป่วย D/C",
    s1_3: "จำนวนวันนอนรวม",
    s1_4: "จำนวนเตียงจริง",
    s2_1: "แรกรับ ล้มเหลว",
    s2_2: "แรกรับ สำเร็จ",
    s3_1: "Pressure Ulcer นอกรพ.",
    s3_2: "Pressure Ulcer ในรพ.",
    s4_1: "Admit ภายใน28วัน จากนอกรพ.",
    s4_2: "Admit ภายใน28วัน จากแผนกเดิม",
    s5_1: "Pain Score ≤3 Moderate",
    s5_2: "Pain Score ≤3 Severe",
    s6_1: "ผู้ป่วยError ได้รับความเสียหายระดับE-I",
    s6_2: "ผู้ป่วยError ไม่ได้รับความเสียหาย",
    s7_1: "ลื่น/หกล้ม ได้รับบาดเจ็บ",
    s7_2: "ลื่น/หกล้ม ไม่ได้รับบาดเจ็บ",
    s8_1: "ภาวะแทรกซ้อนจากการให้เลือด",
    s9_1: "phlebitis",
    s10_1: "สำลัก/อุดตันหลอดลม",
    s11_1_rn: "RN FTE",
    s11_1_aux: "AUX FTE",
    s11_2: "HPPD มาตรฐาน",
    productivityValue: "Productivity (%)",
    averageLOS: "ALOS (วัน)",
    pressureUlcerRate: "อัตรา Pressure Ulcer (%)",
    readmissionRate: "อัตรา Readmission (%)",
};

// OPD field labels
const OPD_FIELD_LABELS: Record<string, string> = {
    opd_1_1: "จำนวนผู้รับบริการทั้งหมด",
    opd_1_2: "จำนวนผู้รับบริการใหม่",
    opd_2_1: "ความพึงพอใจ ≥80%",
    opd_2_2: "จำนวนผู้ตอบแบบสอบถาม",
    opd_3_1: "CPR สำเร็จ",
    opd_3_2: "CPR ไม่สำเร็จ",
    opd_4_1: "รอพบแพทย์ ≤60นาที",
    opd_4_2: "รอพบแพทย์ ทั้งหมด",
    opd_5_1: "ผิดพลาดทางยา(ไม่เกิดอันตราย)",
    opd_5_2: "ผิดพลาดทางยา(เกิดอันตราย)",
    opd_6_1: "หกล้ม",
    opd_7_1: "ส่งต่อER/Admit",
};

// Special Unit field labels (Example for OR)
const SPECIAL_UNIT_FIELD_LABELS: Record<string, string> = {
    or_1_1: "จำนวนผ่าตัด Elective",
    or_1_2: "จำนวนผ่าตัด Emergency",
    or_2_1: "ความพึงพอใจ ≥80%",
    or_2_2: "จำนวนผู้ตอบแบบสอบถาม",
    or_3_1: "CPR สำเร็จ",
    or_3_2: "CPR ไม่สำเร็จ",
    or_4_1: "ภาวะแทรกซ้อน",
    or_5_1: "OR SSI",
    or_6_1: "ผิดพลาดทางยา",
    or_7_1: "Cancel case",
};

type QARecord = {
    id: string;
    departmentId: string;
    departmentName: string;
    fiscalYear: string;
    month: string;
    data: Record<string, string>;
    updatedAt: string;
};

function readData(): { records: QARecord[] } {
    const dataPath = path.join(process.cwd(), "data", "qa-data.json");

    if (!fs.existsSync(dataPath)) {
        return { records: [] };
    }

    try {
        const content = fs.readFileSync(dataPath, "utf-8");
        return JSON.parse(content);
    } catch (error) {
        console.error("Error reading data:", error);
        return { records: [] };
    }
}

function getFieldLabels(departmentType: string): Record<string, string> {
    switch (departmentType) {
        case "opd":
            return OPD_FIELD_LABELS;
        case "special_unit":
            return SPECIAL_UNIT_FIELD_LABELS;
        default:
            return IPD_FIELD_LABELS;
    }
}

function calculateSummary(values: (number | null)[], type: "sum" | "avg"): string {
    const validValues = values.filter((v): v is number => v !== null && !isNaN(v));
    if (validValues.length === 0) return "-";

    if (type === "sum") {
        return validValues.reduce((a, b) => a + b, 0).toFixed(0);
    } else {
        return (validValues.reduce((a, b) => a + b, 0) / validValues.length).toFixed(2);
    }
}

export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const departmentType = searchParams.get("departmentType") as "ipd" | "opd" | "special_unit";
        const fiscalYear = searchParams.get("fiscalYear");
        const selectedMonth = searchParams.get("month"); // null = ทั้งปี

        if (!departmentType || !fiscalYear) {
            return NextResponse.json(
                { success: false, message: "กรุณาระบุประเภทแผนกและปีงบประมาณ" },
                { status: 400 }
            );
        }

        const departments = DEPARTMENTS[departmentType];
        if (!departments) {
            return NextResponse.json(
                { success: false, message: "ประเภทแผนกไม่ถูกต้อง" },
                { status: 400 }
            );
        }

        const storage = readData();
        const fieldLabels = getFieldLabels(departmentType);
        const fieldKeys = Object.keys(fieldLabels);
        const months = selectedMonth ? [selectedMonth] : MONTHS_TH;

        // Create workbook
        const workbook = XLSX.utils.book_new();

        for (const dept of departments) {
            // Filter records for this department
            const deptRecords = storage.records.filter(
                r => r.departmentId === dept.id && r.fiscalYear === fiscalYear
            );

            // Prepare sheet data
            const sheetData: any[][] = [];

            // Header row: Field Name | Month1 | Month2 | ... | Summary
            const headerRow = ["ข้อมูล", ...months];
            if (months.length > 1) {
                headerRow.push("สรุป");
            }
            sheetData.push(headerRow);

            // Data rows
            for (const fieldKey of fieldKeys) {
                const row: any[] = [fieldLabels[fieldKey]];
                const values: (number | null)[] = [];

                for (const month of months) {
                    const record = deptRecords.find(r => r.month === month);
                    const value = record?.data?.[fieldKey];

                    if (value !== undefined && value !== "") {
                        row.push(value);
                        values.push(parseFloat(value) || null);
                    } else {
                        row.push("-");
                        values.push(null);
                    }
                }

                // Add summary column for yearly export
                if (months.length > 1) {
                    // Use average for rate fields, sum for count fields
                    const isRateField = fieldKey.includes("Rate") ||
                        fieldKey.includes("productivity") ||
                        fieldKey.includes("LOS");
                    row.push(calculateSummary(values, isRateField ? "avg" : "sum"));
                }

                sheetData.push(row);
            }

            // Create worksheet
            const worksheet = XLSX.utils.aoa_to_sheet(sheetData);

            // Set column widths
            worksheet["!cols"] = [
                { wch: 40 }, // Field name column
                ...months.map(() => ({ wch: 12 })), // Month columns
                ...(months.length > 1 ? [{ wch: 12 }] : []), // Summary column
            ];

            // Add worksheet to workbook (sheet name = department name, max 31 chars)
            const sheetName = dept.name.substring(0, 31);
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
        }

        // Generate Excel buffer using array type for proper binary handling
        const excelArray = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
        const excelBuffer = new Uint8Array(excelArray);

        // Prepare filename - use ASCII-safe name with UTF-8 encoded version
        const typeLabel = departmentType === "ipd" ? "IPD" :
            departmentType === "opd" ? "OPD" : "SpecialUnit";
        const periodLabel = selectedMonth ? "Monthly" : "FullYear";
        const asciiFilename = `QA_${typeLabel}_${fiscalYear}_${periodLabel}.xlsx`;

        // Return Excel file with proper headers
        const response = new NextResponse(excelBuffer, {
            status: 200,
            headers: {
                "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                "Content-Disposition": `attachment; filename="${asciiFilename}"`,
                "Content-Length": excelBuffer.length.toString(),
            },
        });

        return response;

    } catch (error) {
        console.error("Error generating Excel:", error);
        return NextResponse.json(
            { success: false, message: "เกิดข้อผิดพลาดในการสร้างไฟล์ Excel" },
            { status: 500 }
        );
    }
}
