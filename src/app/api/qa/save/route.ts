import { NextRequest, NextResponse } from "next/server";
import path from "path";
import fs from "fs";
import { saveRecord } from "@/lib/storage";

function toNum(v: string | undefined): number {
  const n = parseFloat(v ?? "");
  return isNaN(n) ? 0 : n;
}

function getDaysInMonthThai(month: string, fiscalYearStr: string): number {
  const year = Number(fiscalYearStr) - 543;
  const isLeap = year % 4 === 0;
  const map: Record<string, number> = {
    "ตุลาคม": 31,
    "พฤศจิกายน": 30,
    "ธันวาคม": 31,
    "มกราคม": 31,
    "กุมภาพันธ์": isLeap ? 29 : 28,
    "มีนาคม": 31,
    "เมษายน": 30,
    "พฤษภาคม": 31,
    "มิถุนายน": 30,
    "กรกฎาคม": 31,
    "สิงหาคม": 31,
    "กันยายน": 30
  };
  return map[month] ?? 30;
}

function computeFields(
  fields: Record<string, string>,
  fiscalYear: string,
  month: string,
  departmentId: string
): Record<string, string> {
  const next: Record<string, string> = { ...fields };

  // Days in month - ใช้ได้ทุกแผนก
  const dim = getDaysInMonthThai(month, fiscalYear);
  next.daysInMonth = dim.toString();

  // ========== IPD ONLY (DEPT...) ==========
  if (departmentId.startsWith('DEPT')) {
    // Pressure ulcer rate: (1.6.1 / 1.6.4) × 1000
    const s16_1 = toNum(next.s1_6_1);
    const s16_4 = toNum(next.s1_6_4);
    next.pressureUlcerRate = s16_4 > 0 ? ((s16_1 / s16_4) * 1000).toFixed(2) : "0.00";

    // Readmission rate: (2.1 / 2.2) × 100
    const s21 = toNum(next.s2_1);
    const s22 = toNum(next.s2_2);
    next.readmissionRate = s22 > 0 ? ((s21 / s22) * 100).toFixed(2) + "%" : "0.00%";

    // Average LOS: 3.1 / days in month
    const s31 = toNum(next.s3_1);
    next.averageLOS = dim > 0 ? (s31 / dim).toFixed(2) : "0.00";

    // Productivity calculations
    const a = toNum(next.s4_1);
    const b = toNum(next.s4_2);
    const c = toNum(next.s4_3);
    const rnHr = a * 7;
    const auxHr = (a + c) * 7;

    next.rnHr = rnHr.toFixed(2);
    next.auxHr = auxHr.toFixed(2);
    next.ratioRnAux = auxHr > 0 ? (rnHr / auxHr).toFixed(2) : "0.00";

    if (b > 0) {
      const hppd = (a * 7) / b;
      next.actualHPPD = hppd.toFixed(2);
      next.productivityValue = rnHr > 0 ? ((b * hppd * 100) / rnHr).toFixed(2) + "%" : "0.00%";
    } else {
      next.actualHPPD = "0.00";
      next.productivityValue = "0.00%";
    }

    // Pain management calculations (IPD)
    const p1 = toNum(next.s11_1_1);
    const p2 = toNum(next.s11_1_2);
    next.s11_1_total = (p1 + p2).toFixed(2);

    const r1 = toNum(next.s11_3_1);
    const r2 = toNum(next.s11_3_2);
    next.s11_3_rate = r2 > 0 ? ((r1 / r2) * 100).toFixed(2) + "%" : "0.00%";
  }

  // ========== OPD ONLY (OPD...) ==========
  if (departmentId.startsWith('OPD')) {
    // OPD CPR Success Rate: (opd_cpr_3 / opd_cpr_2) * 100
    const opd_cpr_2 = toNum(next.opd_cpr_2);
    const opd_cpr_3 = toNum(next.opd_cpr_3);
    next.opd_cpr_rate = opd_cpr_2 > 0 ? ((opd_cpr_3 / opd_cpr_2) * 100).toFixed(2) + "%" : "0.00%";

    // OPD Pain Management Documentation Completeness
    const opd_pain_3_1 = toNum(next.opd_pain_3_1);
    const opd_pain_3_2 = toNum(next.opd_pain_3_2);
    next.opd_pain_3_result = opd_pain_3_2 > 0 ? (opd_pain_3_1 / opd_pain_3_2).toFixed(2) + "%" : "0.00%";
  }

  // ========== OR ONLY (SPECIAL001) ==========
  if (departmentId === 'SPECIAL001') {
    // OR Satisfaction rate: (2.1 / 2.2) * 100
    const or_2_1 = toNum(next.or_2_1);
    const or_2_2 = toNum(next.or_2_2);
    next.or_2_3 = or_2_2 > 0 ? ((or_2_1 / or_2_2) * 100).toFixed(2) + "%" : "0.00%";

    // OR Elective case prep rate: (1.1 / 1.2) * 100
    const or_h2_1_1 = toNum(next.or_h2_1_1);
    const or_h2_1_2 = toNum(next.or_h2_1_2);
    next.or_h2_1_3 = or_h2_1_2 > 0 ? ((or_h2_1_1 / or_h2_1_2) * 100).toFixed(2) + "%" : "0.00%";

    // OR Post-op assessment rate: (3.1 / 3.2) * 100
    const or_h2_3_1 = toNum(next.or_h2_3_1);
    const or_h2_3_2 = toNum(next.or_h2_3_2);
    next.or_h2_3_3 = or_h2_3_2 > 0 ? ((or_h2_3_1 / or_h2_3_2) * 100).toFixed(2) + "%" : "0.00%";
  }

  // ========== ER ONLY (SPECIAL002) ==========
  if (departmentId === 'SPECIAL002') {
    // ER Satisfaction rate: (2.1 / 2.2) * 100
    const er_2_1 = toNum(next.er_2_1);
    const er_2_2 = toNum(next.er_2_2);
    next.er_2_3 = er_2_2 > 0 ? ((er_2_1 / er_2_2) * 100).toFixed(2) + "%" : "0.00%";

    // ER Pain management documentation: (pm_3_1 / pm_3_2) * 100
    const er_pm_3_1 = toNum(next.er_pm_3_1);
    const er_pm_3_2 = toNum(next.er_pm_3_2);
    next.er_pm_3_3 = er_pm_3_2 > 0 ? ((er_pm_3_1 / er_pm_3_2) * 100).toFixed(2) + "%" : "0.00%";

    // ER Triage correct: (h3_1_1 / h3_1_2) * 100
    const er_h3_1_1 = toNum(next.er_h3_1_1);
    const er_h3_1_2 = toNum(next.er_h3_1_2);
    next.er_h3_1_3 = er_h3_1_2 > 0 ? ((er_h3_1_1 / er_h3_1_2) * 100).toFixed(2) + "%" : "0.00%";

    // ER Critical care <4min: (h3_2_1_1 / h3_2_1_2) * 100
    const er_h3_2_1_1 = toNum(next.er_h3_2_1_1);
    const er_h3_2_1_2 = toNum(next.er_h3_2_1_2);
    next.er_h3_2_1_3 = er_h3_2_1_2 > 0 ? ((er_h3_2_1_1 / er_h3_2_1_2) * 100).toFixed(2) + "%" : "0.00%";

    // ER Patient transfer: (h3_3_1 / h3_3_2) * 100
    const er_h3_3_1 = toNum(next.er_h3_3_1);
    const er_h3_3_2 = toNum(next.er_h3_3_2);
    next.er_h3_3_3 = er_h3_3_2 > 0 ? ((er_h3_3_1 / er_h3_3_2) * 100).toFixed(2) + "%" : "0.00%";
  }

  // ========== Anesth ONLY (SPECIAL003) ==========
  if (departmentId === 'SPECIAL003') {
    // Anesth Satisfaction rate: (2.1 / 2.2) * 100
    const an_2_1 = toNum(next.an_2_1);
    const an_2_2 = toNum(next.an_2_2);
    next.an_2_3 = an_2_2 > 0 ? ((an_2_1 / an_2_2) * 100).toFixed(2) + "%" : "0.00%";

    // Anesth Pain management documentation rate
    const an_h2_3_1 = toNum(next.an_h2_3_1);
    const an_h2_3_2 = toNum(next.an_h2_3_2);
    next.an_h2_3_3 = an_h2_3_2 > 0 ? ((an_h2_3_1 / an_h2_3_2) * 100).toFixed(2) + "%" : "0.00%";

    // Anesth Pre-op preparation
    const an_h3_1_1 = toNum(next.an_h3_1_1);
    const an_h3_1_2 = toNum(next.an_h3_1_2);
    next.an_h3_1_3 = an_h3_1_2 > 0 ? ((an_h3_1_1 / an_h3_1_2) * 100).toFixed(2) + "%" : "0.00%";

    // Anesth Post-op monitoring
    const an_h3_3_1 = toNum(next.an_h3_3_1);
    const an_h3_3_2 = toNum(next.an_h3_3_2);
    next.an_h3_3_3 = an_h3_3_2 > 0 ? ((an_h3_3_1 / an_h3_3_2) * 100).toFixed(2) + "%" : "0.00%";

    // Anesth Recovery room discharge
    const an_h3_4_1 = toNum(next.an_h3_4_1);
    const an_h3_4_2 = toNum(next.an_h3_4_2);
    next.an_h3_4_3 = an_h3_4_2 > 0 ? ((an_h3_4_1 / an_h3_4_2) * 100).toFixed(2) + "%" : "0.00%";

    // Anesth Anesthesia explanation
    const an_h3_5_1 = toNum(next.an_h3_5_1);
    const an_h3_5_2 = toNum(next.an_h3_5_2);
    next.an_h3_5_3 = an_h3_5_2 > 0 ? ((an_h3_5_1 / an_h3_5_2) * 100).toFixed(2) + "%" : "0.00%";
  }

  // ========== LR ONLY (SPECIAL004) ==========
  if (departmentId === 'SPECIAL004') {
    // LR Pressure ulcer rate
    const lr_1_6_1 = toNum(next.lr_1_6_1);
    const lr_1_6_4 = toNum(next.lr_1_6_4);
    next.lr_1_6_5 = lr_1_6_4 > 0 ? ((lr_1_6_1 / lr_1_6_4) * 100).toFixed(2) + "%" : "0.00%";

    // LR Production calculations
    const lr_2_1 = toNum(next.lr_2_1);
    const lr_2_2 = toNum(next.lr_2_2);
    const lr_2_4 = toNum(next.lr_2_4);
    const lr_2_5 = toNum(next.lr_2_5);

    next.lr_2_3 = lr_2_2 > 0 ? (lr_2_1 / lr_2_2).toFixed(2) : "0.00";
    next.lr_2_6 = lr_2_5 > 0 ? ((lr_2_4 * 7) / lr_2_5).toFixed(2) : "0.00";
    next.lr_2_productivity = "0.00%";

    // LR Pain management documentation
    const lr_pm_3_1 = toNum(next.lr_pm_3_1);
    const lr_pm_3_2 = toNum(next.lr_pm_3_2);
    next.lr_pm_3_3 = lr_pm_3_2 > 0 ? (lr_pm_3_1 / lr_pm_3_2).toFixed(2) + "%" : "0.00%";

    // LR หัวตี้ 2 calculations
    const lr_h2_1_6_1 = toNum(next.lr_h2_1_6_1);
    const lr_h2_1_6_2 = toNum(next.lr_h2_1_6_2);
    next.lr_h2_1_6_3 = lr_h2_1_6_2 > 0 ? ((lr_h2_1_6_1 / lr_h2_1_6_2) * 100).toFixed(2) + "%" : "0.00%";

    // Birth Asphyxia rate
    const lr_h2_3_1 = toNum(next.lr_h2_3_1);
    const lr_h2_3_2 = toNum(next.lr_h2_3_2);
    next.lr_h2_3_3 = lr_h2_3_2 > 0 ? ((lr_h2_3_1 * 1000) / lr_h2_3_2).toFixed(2) : "0.00";
  }

  return next;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { departmentId, departmentName, fiscalYear, month, fields } = body;

    if (!departmentId || !departmentName || !fiscalYear || !month) {
      return NextResponse.json(
        { success: false, message: "ข้อมูลไม่ครบถ้วน" },
        { status: 400 }
      );
    }

    // Compute all fields before saving
    const computedFields = computeFields(fields || {}, fiscalYear, month, departmentId);

    // Save to database
    const record = await saveRecord(
      departmentId,
      departmentName,
      fiscalYear,
      month,
      computedFields
    );

    // ================= Send LINE Notification =================
    try {
      // Check if LINE notification is enabled
      // Note: We still use local file for settings for now, or we should move settings to DB too.
      // For minimum impact refactor, we can keep using fs for settings if they are config files.
      // But settings are likely static. Let's keep it as is if it runs on valid env.
      // However, Vercel file system is read-only after build. 
      // ideally settings should be in DB or ENV.
      // For now, let's wrap fs.existsSync with try-catch or assume it might fail on production if not present.

      const settingsPath = path.join(process.cwd(), "data", "line-settings.json");
      const notifSettingsPath = path.join(process.cwd(), "data", "notification-settings.json");

      let lineEnabled = false;
      let dataEntryEnabled = false;

      if (fs.existsSync(settingsPath)) {
        const lineSettings = JSON.parse(fs.readFileSync(settingsPath, "utf-8"));
        lineEnabled = lineSettings.enabled === true;
      }

      if (fs.existsSync(notifSettingsPath)) {
        const notifSettings = JSON.parse(fs.readFileSync(notifSettingsPath, "utf-8"));
        dataEntryEnabled = notifSettings.onDataEntry?.enabled === true;
      }

      // Send notification logic...
      if (lineEnabled && dataEntryEnabled) {
        // ... (rest of logic same as before) 
        // Determine department group
        let departmentGroup = "ไม่ระบุกลุ่ม";
        if (departmentId.startsWith("DEPT")) {
          departmentGroup = "ผู้ป่วยใน (IPD)";
        } else if (departmentId.startsWith("OPD")) {
          departmentGroup = "ผู้ป่วยนอก (OPD)";
        } else if (departmentId.startsWith("SPECIAL")) {
          departmentGroup = "หน่วยงานพิเศษ";
        }

        // Call LINE send API
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
        await fetch(`${baseUrl}/api/line/send`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            type: 'data_entry',
            departmentGroup,
            departmentName,
            fiscalYear,
            month
          })
        });

        console.log('LINE notification sent for:', departmentName);
      }

    } catch (lineError) {
      console.error('LINE notification error (non-fatal):', lineError);
    }
    // ================= End LINE Notification =================

    return NextResponse.json({
      success: true,
      record
    });
  } catch (error) {
    console.error("Error saving record:", error);
    return NextResponse.json(
      { success: false, message: "เกิดข้อผิดพลาดในการบันทึกข้อมูล" },
      { status: 500 }
    );
  }
}