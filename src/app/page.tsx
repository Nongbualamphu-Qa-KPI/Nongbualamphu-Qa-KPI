'use client';

import type React from "react";
import { useEffect, useMemo, useState } from "react";

/* ----------------------------- CONFIG พื้นฐาน ----------------------------- */

type Role = "user" | "admin";

type Department = {
  id: string;
  name: string;
  password: string;
  isIcu?: boolean;
};

const DEPARTMENTS: Department[] = [
  { id: "DEPT001", name: "หอผู้ป่วยอายุรกรรมชาย", password: "MED_M2568" },
  { id: "DEPT002", name: "หอผู้ป่วยอายุรกรรมหญิง", password: "MED_F2568" },
  { id: "DEPT003", name: "หอผู้ป่วยจิตเวช", password: "PSY2568" },
  { id: "DEPT004", name: "หอผู้ป่วยพิเศษรวมน้ำใจ", password: "SPEC_NJ2568" },
  { id: "DEPT005", name: "หอผู้ป่วยศัลยกรรมชาย", password: "SURG_M2568" },
  { id: "DEPT006", name: "หอผู้ป่วยศัลยกรรมหญิง", password: "SURG_F2568" },
  { id: "DEPT007", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 1(ICU-MED_1)", password: "ICUMED12568", isIcu: true },
  { id: "DEPT008", name: "หอผู้ป่วยหนักอายุรกรรมชั้น 2(ICU-MED_2)", password: "ICUMED22568", isIcu: true },
  { id: "DEPT009", name: "หอผู้ป่วยกระดูกและข้อ", password: "ORTHO2568" },
  { id: "DEPT010", name: "หอผู้ป่วยพิเศษอายุรกรรมชั้น4", password: "SPECMED42568" },
  { id: "DEPT011", name: "หอผู้ป่วยพิเศษศัลยกรรมชั้น4", password: "SPECSURG42568" },
  { id: "DEPT012", name: "หอผู้ป่วยกุมารเวช", password: "PEDS2568" },
  { id: "DEPT013", name: "หอผู้ป่วยอภิบาลสงฆ์", password: "MONK2568" },
  { id: "DEPT014", name: "หอผู้ป่วยโสต ศอ นาสิก", password: "ENT2568" },
  { id: "DEPT015", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น5", password: "SPECOBGYN52568" },
  { id: "DEPT016", name: "หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น4", password: "SPECOBGYN42568" },
  { id: "DEPT017", name: "หอผู้ป่วยพิเศษกุมารเวช", password: "SPECPEDS2568" },
  { id: "DEPT018", name: "หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง", password: "NEURO2568" },
  { id: "DEPT019", name: "หอผู้ป่วยหนักกุมารเวช(NICU)", password: "NICU2568", isIcu: true },
  { id: "DEPT020", name: "หอผู้ป่วยสูติ-นรีเวช (PP)", password: "PP2568" },
  { id: "DEPT021", name: "หอผู้ป่วยหนักรวม(ICU_รวม)", password: "ICU2568", isIcu: true }
];

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

const FISCAL_YEARS = ["2568", "2569", "2570", "2571", "2572"];

type QAFields = Record<string, string>;

const COMPUTED_FIELDS = new Set([
  "pressureUlcerRate",
  "readmissionRate",
  "daysInMonth",
  "averageLOS",
  "rnHr",
  "auxHr",
  "ratioRnAux",
  "actualHPPD",
  "productivityValue",
  "painTotal",
  "recordCompleteness"
]);

const FIELD_LABELS: Record<string, string> = {
  s1_1: "S11.1 จำนวนอุบัติการณ์การระบุตัว ผป.ผิดคน",
  s1_2: "S11.2 จำนวนอุบัติการณ์ให้การรักษาพยาบาลผิดคน",
  s1_3: "S11.3 ความผิดพลาดในการบริหารยา (ระดับ C ขึ้นไป)",
  s1_4: "S11.4 ความผิดพลาดในการให้เลือด/ส่วนประกอบเลือด",
  s1_5: "S11.5 การตายอย่างไม่คาดคิด",
  s1_6_1: "S11.6.1 ผู้ป่วยเกิดแผลกดทับรายใหม่ stage 2",
  s1_6_2: "S11.6.2 ผู้ป่วยเสี่ยงในเวรบ่าย",
  s1_6_3: "S11.6.3 ผู้ป่วยเกิดแผลกดทับรายใหม่",
  s1_6_4: "S11.6.4 วันนอนรวมของผู้ป่วยกลุ่มเสี่ยง",
  pressureUlcerRate: "S11.6 อัตราแผลกดทับ (ต่อ 1,000 วันนอนกลุ่มเสี่ยง)",
  s1_7: "S11.7 การพลัดตกหกล้ม",
  s1_8: "S11.8 การบาดเจ็บจากการจัดท่า/ใช้อุปกรณ์",
  s1_9: "S11.9 อุบัติเหตุจากการปฏิบัติงานของบุคลากร",
  s1_10: "S11.10 ยา/เวชภัณฑ์หมดอายุค้าง",
  s2_1: "S22.1 ผป.กลับมารักษาซ้ำ (28 วัน)",
  s2_2: "S22.2 ผป.ทั้งหมดเดือนก่อนหน้า",
  readmissionRate: "S22. อัตราการกลับเข้ารับการรักษาซ้ำ (%)",
  s3_1: "S33. วันนอนรวมของผู้ป่วย",
  daysInMonth: "จำนวนวันในเดือน",
  averageLOS: "ระยะวันนอนเฉลี่ย (วัน)",
  s4_a: "Staff/Day (A)",
  s4_b: "Patient Days (B)",
  s4_c: "TN+PN+AID รวม (C)",
  rnHr: "RN hr (A×7)",
  auxHr: "Auxiliary hr ((A+C)×7)",
  ratioRnAux: "อัตราส่วน RN/Aux",
  actualHPPD: "Actual HPPD",
  productivityValue: "Productivity (%)",
  s7_1: "จำนวนผู้ป่วย CPR (ราย)",
  s7_2: "จำนวนครั้ง CPR ทั้งหมด",
  s7_3: "จำนวนครั้ง CPR สำเร็จ",
  s8_1: "ผู้ป่วยที่ได้รับการเฝ้าระวังทั้งหมด",
  s8_2: "ผู้ป่วยที่ได้รับการประเมินล่าช้า (ราย)",
  s8_3: "จำนวนครั้งประเมินล่าช้า",
  s8_4: "เฝ้าระวังไม่สอดคล้องความรุนแรง (ราย)",
  s8_5: "เฝ้าระวังไม่สอดคล้องความรุนแรง (ครั้ง)",
  s9_1_1: "จัดการความปวด (ใช้ยา)",
  s9_1_2: "จัดการความปวด (ไม่ใช้ยา)",
  painTotal: "รวมครั้งการจัดการความปวดทั้งหมด",
  s9_2_1: "Acute Pain",
  s9_2_2: "Chronic Pain",
  s9_2_3: "Palliative Pain",
  s9_3_1: "บันทึกการจัดการความปวดครบถ้วน",
  s9_3_2: "ครั้งที่จัดการความปวดทั้งหมด",
  recordCompleteness: "ร้อยละความครบถ้วนของการบันทึก",
  note: "หมายเหตุ"
};

const FIELD_PREFIX: Record<string, string> = {
  s1_1: "1.1",
  s1_2: "1.2",
  s1_3: "1.3",
  s1_4: "1.4",
  s1_5: "1.5",
  s1_6_1: "1.6.1",
  s1_6_2: "1.6.2",
  s1_6_3: "1.6.3",
  s1_6_4: "1.6.4",
  pressureUlcerRate: "1.6",
  s1_7: "1.7",
  s1_8: "1.8",
  s1_9: "1.9",
  s1_10: "1.10",
  s2_1: "2.1",
  s2_2: "2.2",
  readmissionRate: "2",
  s3_1: "3.1",
  daysInMonth: "3",
  averageLOS: "3",
  s4_a: "4.A",
  s4_b: "4.B",
  s4_c: "4.C",
  rnHr: "4",
  auxHr: "4",
  ratioRnAux: "4",
  actualHPPD: "4",
  productivityValue: "4",
  s7_1: "7.1",
  s7_2: "7.2",
  s7_3: "7.3",
  s8_1: "8.1",
  s8_2: "8.2",
  s8_3: "8.3",
  s8_4: "8.4",
  s8_5: "8.5",
  s9_1_1: "9.1",
  s9_1_2: "9.2",
  painTotal: "9",
  s9_2_1: "9.3",
  s9_2_2: "9.4",
  s9_2_3: "9.5",
  s9_3_1: "10.1",
  s9_3_2: "10.2",
  recordCompleteness: "10",
  note: "หมายเหตุ"
};

const FORMULA_HINTS: Record<string, string> = {
  pressureUlcerRate: "สูตร: (1.6.1 / 1.6.4) × 1000",
  readmissionRate: "สูตร: (2.1 / 2.2) × 100",
  averageLOS: "สูตร: 3.1 / จำนวนวันในเดือน",
  productivityValue: "สูตร: (B × HPPD × 100) / RN hrs",
  actualHPPD: "สูตร: (A × 7) / B",
  rnHr: "สูตร: A × 7",
  auxHr: "สูตร: (A + C) × 7",
  ratioRnAux: "สูตร: RN hr / Auxiliary hr",
  painTotal: "สูตร: รวม 9.1 + 9.2",
  recordCompleteness: "สูตร: (10.1 / 10.2) × 100"
};

const SECTION_CONFIG = [
  {
    key: "s1",
    title: "1. ความปลอดภัยของผู้ใช้บริการ",
    icon: "🛡️",
    fields: ["s1_1", "s1_2", "s1_3", "s1_4", "s1_5"]
  },
  {
    key: "s1_6",
    title: "1.6 ตัวชี้วัดแผลกดทับ",
    icon: "📑",
    fields: ["s1_6_1", "s1_6_2", "s1_6_3", "s1_6_4", "pressureUlcerRate"]
  },
  {
    key: "s1_other",
    title: "1.7 – 1.10 อุบัติการณ์อื่น ๆ",
    icon: "⚠️",
    fields: ["s1_7", "s1_8", "s1_9", "s1_10"]
  },
  {
    key: "s2",
    title: "2. อัตราการกลับเข้ารับการรักษาซ้ำ",
    icon: "🔄",
    fields: ["s2_1", "s2_2", "readmissionRate"]
  },
  {
    key: "s3",
    title: "3. ระยะวันนอนเฉลี่ย",
    icon: "🛏️",
    fields: ["s3_1", "daysInMonth", "averageLOS"]
  },
  {
    key: "s4",
    title: "4. ผลิตภาพและอัตรากำลัง (Productivity & Staffing)",
    icon: "📈",
    fields: ["s4_a", "s4_b", "s4_c", "rnHr", "auxHr", "ratioRnAux", "actualHPPD", "productivityValue"],
    highlight: true
  },
  {
    key: "s7",
    title: "7. CPR",
    icon: "❤️",
    fields: ["s7_1", "s7_2", "s7_3"]
  },
  {
    key: "s8",
    title: "8. SOS Scores",
    icon: "⚠️",
    fields: ["s8_1", "s8_2", "s8_3", "s8_4", "s8_5"]
  },
  {
    key: "s11",
    title: "9–10. ข้อมูลเฉพาะหอผู้ป่วยหนัก",
    icon: "🛏️",
    fields: [
      "s9_1_1",
      "s9_1_2",
      "painTotal",
      "s9_2_1",
      "s9_2_2",
      "s9_2_3",
      "s9_3_1",
      "s9_3_2",
      "recordCompleteness"
    ],
    icuOnly: true
  }
];

/* ----------------------------- ฟังก์ชันคำนวณ ----------------------------- */

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

function toNum(v: string | undefined): number {
  const n = parseFloat(v ?? "");
  return isNaN(n) ? 0 : n;
}

function computeFields(fields: QAFields, fiscalYear: string, month: string): QAFields {
  const next: QAFields = { ...fields };

  const dim = getDaysInMonthThai(month, fiscalYear);
  next.daysInMonth = dim.toString();

  const s16_1 = toNum(next.s1_6_1);
  const s16_4 = toNum(next.s1_6_4);
  next.pressureUlcerRate = s16_4 > 0 ? ((s16_1 / s16_4) * 1000).toFixed(2) : "0.00";

  const s21 = toNum(next.s2_1);
  const s22 = toNum(next.s2_2);
  next.readmissionRate = s22 > 0 ? ((s21 / s22) * 100).toFixed(2) + "%" : "0.00%";

  const s31 = toNum(next.s3_1);
  next.averageLOS = dim > 0 ? (s31 / dim).toFixed(2) : "0.00";

  const a = toNum(next.s4_a);
  const b = toNum(next.s4_b);
  const c = toNum(next.s4_c);
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

  const p1 = toNum(next.s9_1_1);
  const p2 = toNum(next.s9_1_2);
  next.painTotal = (p1 + p2).toFixed(2);

  const r1 = toNum(next.s9_3_1);
  const r2 = toNum(next.s9_3_2);
  next.recordCompleteness = r2 > 0 ? ((r1 / r2) * 100).toFixed(2) + "%" : "0.00%";

  return next;
}

/* ------------------------------- หน้า Home -------------------------------- */

export default function HomePage() {
  const [role, setRole] = useState<Role>("user");
  const [selectedDeptId, setSelectedDeptId] = useState("");
  const [password, setPassword] = useState("");
  const [currentDept, setCurrentDept] = useState<Department | null>(null);

  const [fiscalYear, setFiscalYear] = useState("2568");
  const [month, setMonth] = useState<string>("ตุลาคม");

  const [fields, setFields] = useState<QAFields>({});
  const [loading, setLoading] = useState(false);
  const [alert, setAlert] = useState<{ type: "success" | "error" | "warning"; message: string } | null>(null);

  const [yearData, setYearData] = useState<{
    [month: string]: { id: string; updatedAt: string } | undefined;
  }>({});

  const [activeTab, setActiveTab] = useState<"form" | "table">("form");

  const isLoggedIn = !!currentDept && role === "user";

  useEffect(() => {
    if (isLoggedIn) {
      handleLoadPeriod();
      handleLoadYear();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  useEffect(() => {
    setFields(prev => computeFields(prev, fiscalYear, month));
  }, [fiscalYear, month]);

  const selectedDept = useMemo(
    () => DEPARTMENTS.find(d => d.id === selectedDeptId) || null,
    [selectedDeptId]
  );

  function showAlert(type: "success" | "error" | "warning", message: string) {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  }

  /* ----------------------------- ฟังก์ชัน Login ---------------------------- */

  function handleLogin(e: React.FormEvent) {
    e.preventDefault();

    if (role === "user") {
      if (!selectedDept || !password) {
        showAlert("error", "กรุณาเลือกแผนกและกรอกรหัสผ่าน");
        return;
      }
      if (password !== selectedDept.password) {
        showAlert("error", "รหัสผ่านไม่ถูกต้อง");
        return;
      }
      setCurrentDept(selectedDept);
      setPassword("");
      showAlert("success", `เข้าสู่ระบบแผนก: ${selectedDept.name}`);
    } else {
      if (password !== "admin@nbl2568") {
        showAlert("error", "รหัสผ่าน Admin ไม่ถูกต้อง");
        return;
      }
      showAlert("success", "เข้าสู่ระบบ Admin (ยังไม่ทำ UI แสดงผลในเวอร์ชันนี้)");
    }
  }

  function handleLogout() {
    setCurrentDept(null);
    setSelectedDeptId("");
    setFields({});
    setYearData({});
  }

  /* ---------------------- เรียก API โหลด/บันทึกข้อมูล --------------------- */

  async function handleLoadPeriod() {
    if (!currentDept) return;
    setLoading(true);
    try {
      const params = new URLSearchParams({
        departmentId: currentDept.id,
        fiscalYear,
        month
      }).toString();

      const res = await fetch(`/api/qa/by-period?${params}`);
      const json = await res.json();

      if (!json.success) {
        showAlert("error", json.message || "โหลดข้อมูลไม่สำเร็จ");
        return;
      }

      if (!json.record) {
        setFields(prev => computeFields(prev, fiscalYear, month));
        showAlert("warning", "ยังไม่มีข้อมูลเดือนนี้");
      } else {
        const data = (json.record.data || {}) as QAFields;
        setFields(computeFields(data, fiscalYear, json.record.month));
        showAlert("success", "โหลดข้อมูลสำเร็จ");
      }
    } catch (err) {
      console.error(err);
      showAlert("error", "เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadYear() {
    if (!currentDept) return;
    try {
      const params = new URLSearchParams({
        departmentId: currentDept.id,
        fiscalYear
      }).toString();

      const res = await fetch(`/api/qa/by-year?${params}`);
      const json = await res.json();

      if (!json.success) {
        showAlert("error", json.message || "โหลดข้อมูลรายปีไม่สำเร็จ");
        return;
      }

      const data = json.data as Record<string, any>;
      const map: { [m: string]: { id: string; updatedAt: string } | undefined } = {};
      for (const m of MONTHS_TH) {
        const rec = data[m];
        if (rec) {
          map[m] = { id: rec.id, updatedAt: rec.updatedAt };
        }
      }
      setYearData(map);
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!currentDept) {
      showAlert("error", "ยังไม่เข้าสู่ระบบแผนก");
      return;
    }

    const computed = computeFields(fields, fiscalYear, month);
    setFields(computed);

    setLoading(true);
    try {
      const res = await fetch("/api/qa/save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          departmentId: currentDept.id,
          departmentName: currentDept.name,
          fiscalYear,
          month,
          fields: computed
        })
      });

      const json = await res.json();

      if (!json.success) {
        showAlert("error", json.message || "บันทึกข้อมูลไม่สำเร็จ");
        return;
      }

      showAlert("success", "บันทึกข้อมูลสำเร็จ");
      handleLoadYear();
    } catch (err) {
      console.error(err);
      showAlert("error", "เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      setLoading(false);
    }
  }

  function handleFieldChange(id: string, value: string) {
    setFields(prev => computeFields({ ...prev, [id]: value }, fiscalYear, month));
  }

  function renderComputedHint(id: string) {
    const hint = FORMULA_HINTS[id];
    return (
      <p className="mt-2 text-[11px] text-amber-800 bg-amber-50 border border-dashed border-amber-200 rounded-lg px-3 py-2">
        {hint || "คำนวณอัตโนมัติจากข้อมูลในหัวข้อเดียวกัน"}
      </p>
    );
  }

  function renderFieldInput(fieldId: string) {
    const label = FIELD_LABELS[fieldId] || fieldId;
    const prefix = FIELD_PREFIX[fieldId];
    const isComputed = COMPUTED_FIELDS.has(fieldId);
    const value = fields[fieldId] ?? "";

    return (
      <div key={fieldId} className="flex flex-col gap-1">
        <label className="text-xs font-semibold text-slate-700">
          {prefix ? `${prefix} ` : ""}{label}
          {isComputed && <span className="ml-1 text-[10px] text-indigo-500">(คำนวณอัตโนมัติ)</span>}
        </label>
        <input
          type="text"
          value={value}
          readOnly={isComputed}
          onChange={e => !isComputed && handleFieldChange(fieldId, e.target.value)}
          className={`w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-2 transition ${
            isComputed
              ? "bg-blue-50 border-blue-200 text-blue-900 focus:ring-blue-300"
              : "border-slate-200 bg-white focus:ring-indigo-500"
          }`}
        />
        {isComputed && renderComputedHint(fieldId)}
      </div>
    );
  }

  /* ------------------------------- UI: Login ------------------------------- */

  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-800 via-purple-600 to-indigo-400 flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-lg">
          <div className="relative bg-white/90 backdrop-blur rounded-3xl shadow-2xl overflow-hidden">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white text-3xl shadow-lg">
              🏥
            </div>
            <div className="pt-14 px-8 pb-8 space-y-6">
              <div className="text-center space-y-1">
                <h1 className="text-2xl font-bold text-slate-800">ระบบบันทึกข้อมูล QA</h1>
                <p className="text-sm text-slate-500">โรงพยาบาลหนองบัวลำภู</p>
              </div>

              <div className="grid grid-cols-2 bg-slate-100 rounded-xl p-1 text-sm font-medium">
                <button
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                    role === "user"
                      ? "bg-purple-600 text-white shadow"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setRole("user");
                    setPassword("");
                  }}
                >
                  <span>👤</span>
                  ผู้ใช้งาน
                </button>
                <button
                  className={`flex items-center justify-center gap-2 py-2 rounded-lg transition ${
                    role === "admin"
                      ? "bg-purple-600 text-white shadow"
                      : "bg-white text-slate-700 hover:bg-slate-50"
                  }`}
                  onClick={() => {
                    setRole("admin");
                    setSelectedDeptId("");
                    setPassword("");
                  }}
                >
                  <span>🛡️</span>
                  ผู้ดูแลระบบ
                </button>
              </div>

              {alert && (
                <div
                  className={`border-l-4 p-3 rounded text-xs ${
                    alert.type === "success"
                      ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                      : alert.type === "warning"
                      ? "bg-amber-50 border-amber-500 text-amber-800"
                      : "bg-rose-50 border-rose-500 text-rose-800"
                  }`}
                >
                  {alert.message}
                </div>
              )}

              <form className="space-y-4" onSubmit={handleLogin}>
                {role === "user" && (
                  <div className="space-y-1">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                      <span>🏥</span>
                      เลือกแผนก
                    </label>
                    <select
                      className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                      value={selectedDeptId}
                      onChange={e => setSelectedDeptId(e.target.value)}
                    >
                      <option value="">-- เลือกแผนก --</option>
                      {DEPARTMENTS.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-700">
                    <span>🔒</span>
                    รหัสผ่าน {role === "admin" ? "(Admin)" : ""}
                  </label>
                  <input
                    type="password"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder={role === "admin" ? "admin@nbl2568" : "รหัสผ่านแผนก"}
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition flex items-center justify-center gap-2"
                >
                  <span>➜</span>
                  เข้าสู่ระบบ
                </button>
              </form>

              <p className="text-[11px] text-slate-400 text-center">
                * เวอร์ชันนี้เน้นฟอร์มบันทึกข้อมูลระดับแผนกก่อน ส่วนหน้า Dashboard รวมสามารถต่อยอดเพิ่มภายหลังได้
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  /* ------------------------------ UI: Main Page ----------------------------- */

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col">
      <header className="bg-gradient-to-r from-purple-700 via-indigo-600 to-blue-500 text-white shadow-md">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center text-xl shadow-inner">
              📊
            </div>
            <div>
              <h1 className="text-base md:text-lg font-semibold leading-tight">ระบบบันทึกข้อมูล QA</h1>
              <p className="text-[11px] md:text-xs text-indigo-100">โรงพยาบาลหนองบัวลำภู • แบบบันทึกรายเดือนตามตัวชี้วัดคุณภาพ</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right text-xs">
              <div className="opacity-80">แผนก</div>
              <div className="font-semibold truncate max-w-[200px]">{currentDept?.name}</div>
            </div>
            <button
              onClick={handleLogout}
              className="px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-[11px] font-medium"
            >
              ออกจากระบบ
            </button>
          </div>
        </div>
        <nav className="bg-white text-slate-700 border-b border-slate-200">
          <div className="max-w-6xl mx-auto px-4 flex gap-6 text-sm font-semibold">
            <button
              className={`relative py-3 transition ${
                activeTab === "form"
                  ? "text-purple-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setActiveTab("form")}
            >
              บันทึกข้อมูล
              {activeTab === "form" && <span className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-full" />}
            </button>
            <button
              className={`relative py-3 transition ${
                activeTab === "table"
                  ? "text-purple-600"
                  : "text-slate-500 hover:text-slate-800"
              }`}
              onClick={() => setActiveTab("table")}
            >
              ตารางแสดงข้อมูล
              {activeTab === "table" && <span className="absolute inset-x-0 -bottom-px h-1 bg-purple-500 rounded-full" />}
            </button>
          </div>
        </nav>
      </header>

      <main className="flex-1 max-w-6xl mx-auto px-4 py-6 space-y-5 w-full">
        {activeTab === "table" ? (
          <section className="bg-white rounded-xl shadow-sm p-6 text-center text-sm text-slate-500 border border-dashed border-slate-200">
            ตารางแสดงข้อมูล (coming soon)
          </section>
        ) : (
          <>
            <section className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-lg bg-indigo-100 text-indigo-600 flex items-center justify-center">📅</div>
                <div>
                  <h2 className="text-base font-semibold text-slate-800">เลือกปีงบประมาณและเดือน</h2>
                  <p className="text-xs text-slate-500">ปรับช่วงเวลาที่ต้องการบันทึกข้อมูลแล้วกด "โหลดข้อมูล"</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">ปีงบประมาณ (พ.ศ.)</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={fiscalYear}
                    onChange={e => setFiscalYear(e.target.value)}
                  >
                    {FISCAL_YEARS.map(y => (
                      <option key={y} value={y}>
                        {y}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="block text-[11px] font-semibold text-slate-600">เดือน</label>
                  <select
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    value={month}
                    onChange={e => setMonth(e.target.value)}
                  >
                    {MONTHS_TH.map(m => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col md:flex-row items-stretch md:items-end gap-2">
                  <button
                    type="button"
                    onClick={handleLoadPeriod}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-500 text-white text-sm font-semibold shadow hover:shadow-md"
                  >
                    <span>🔍</span> โหลดข้อมูล
                  </button>
                  <button
                    type="button"
                    onClick={handleLoadYear}
                    className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-slate-100 text-slate-700 text-sm font-medium hover:bg-slate-200"
                  >
                    🔄 อัปเดตสถานะรายปี
                  </button>
                </div>
              </div>
              {loading && <p className="text-[11px] text-slate-500 mt-2">กำลังดำเนินการ...</p>}
            </section>

            {alert && (
              <div
                className={`border-l-4 p-3 rounded text-xs md:text-sm ${
                  alert.type === "success"
                    ? "bg-emerald-50 border-emerald-500 text-emerald-800"
                    : alert.type === "warning"
                    ? "bg-amber-50 border-amber-500 text-amber-800"
                    : "bg-rose-50 border-rose-500 text-rose-800"
                }`}
              >
                {alert.message}
              </div>
            )}

            <section className="grid grid-cols-1 lg:grid-cols-4 gap-4">
              <form
                onSubmit={handleSave}
                className="lg:col-span-3 space-y-4"
              >
                {SECTION_CONFIG.map(section => (
                  <div
                    key={section.key}
                    className="bg-white rounded-2xl shadow-sm border border-slate-100 p-5 space-y-4"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span className="w-9 h-9 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center text-lg">
                          {section.icon}
                        </span>
                        <h3 className="text-sm md:text-base font-semibold text-slate-800">{section.title}</h3>
                      </div>
                      {section.icuOnly && (
                        <span className="text-[11px] px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                          แสดงเฉพาะ ICU
                        </span>
                      )}
                    </div>

                    {section.highlight && (
                      <div className="bg-gradient-to-r from-emerald-500 via-teal-500 to-green-500 text-white rounded-xl p-4 shadow-inner">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                          <div>
                            <p className="text-xs uppercase tracking-wide opacity-90">Productivity</p>
                            <div className="text-2xl font-bold">{fields.productivityValue || "0.00%"}</div>
                            <p className="text-sm text-emerald-50">เกณฑ์คือ ≥80%</p>
                          </div>
                          <div className="text-sm bg-white/15 rounded-lg px-3 py-2">
                            สูตร: (B × HPPD × 100) / RN hrs
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {section.fields.map(renderFieldInput)}
                    </div>
                  </div>
                ))}

                <div className="bg-white rounded-2xl shadow-sm border border-dashed border-emerald-300 p-5">
                  <label className="block text-xs font-semibold text-emerald-800 mb-1">{FIELD_LABELS.note}</label>
                  <textarea
                    rows={3}
                    className="w-full rounded-lg border-2 border-emerald-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    value={fields.note ?? ""}
                    onChange={e => handleFieldChange("note", e.target.value)}
                    placeholder="กรอกหมายเหตุเพิ่มเติม เช่น ข้อมูลยังไม่ครบ / อยู่ระหว่างทบทวน ฯลฯ"
                  />
                </div>

                <div className="flex flex-col md:flex-row gap-3 pt-2">
                  <button
                    type="submit"
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-emerald-500 via-teal-500 to-sky-500 text-white font-semibold shadow-md hover:shadow-lg hover:-translate-y-0.5 transition text-sm"
                  >
                    💾 บันทึกข้อมูลเดือนนี้
                  </button>
                  <button
                    type="button"
                    onClick={() => setFields(computeFields({}, fiscalYear, month))}
                    className="flex-1 py-3 rounded-xl bg-slate-100 text-slate-700 font-semibold shadow-sm hover:bg-slate-200 transition text-sm"
                  >
                    🧹 ล้างฟอร์ม
                  </button>
                </div>
              </form>

              <aside className="bg-white rounded-2xl shadow-sm p-5 border border-slate-100 flex flex-col gap-3 lg:sticky lg:top-4 h-fit">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-sm font-semibold text-slate-800 flex items-center gap-2">
                    <span className="text-purple-500">📌</span>
                    สถานะข้อมูลรายเดือน
                  </h2>
                  <span className="text-[10px] text-slate-500">ปีงบประมาณ {fiscalYear}</span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-[11px]">
                  {MONTHS_TH.map(m => {
                    const rec = yearData[m];
                    const hasData = !!rec;
                    return (
                      <div
                        key={m}
                        className={`rounded-lg border px-2.5 py-2 ${
                          hasData ? "border-emerald-400 bg-emerald-50" : "border-amber-300 bg-amber-50"
                        }`}
                      >
                        <div className="font-semibold text-slate-800 truncate">{m}</div>
                        <div className="mt-0.5">
                          {hasData ? (
                            <span className="text-emerald-700">มีข้อมูลแล้ว</span>
                          ) : (
                            <span className="text-amber-700">ยังไม่มีข้อมูล</span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
                <p className="text-[10px] text-slate-500 mt-1">
                  * หลังบันทึกข้อมูล ระบบจะอัปเดตสถานะเดือนนั้นเป็น “มีข้อมูลแล้ว” ใช้เป็น checklist ให้แผนกเห็นภาพรวมทั้งปี
                </p>
              </aside>
            </section>
          </>
        )}
      </main>
    </div>
  );
}