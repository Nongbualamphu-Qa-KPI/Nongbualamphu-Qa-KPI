
export const CREDENTIALS: Record<string, string> = {
    // --- โซนผู้ป่วยใน (IPD) ---
    "DEPT001": "medmen",     // หอผู้ป่วยอายุรกรรมชาย
    "DEPT002": "medfem",     // หอผู้ป่วยอายุรกรรมหญิง
    "DEPT003": "psyche",     // หอผู้ป่วยจิตเวช
    "DEPT004": "vipone",     // หอผู้ป่วยพิเศษรวมน้ำใจ
    "DEPT005": "surgmn",     // หอผู้ป่วยศัลยกรรมชาย
    "DEPT006": "surgfm",     // หอผู้ป่วยศัลยกรรมหญิง

    // --- โซนวิกฤต (ICU) ---
    "DEPT007": "icum01",     // ICU-MED_1
    "DEPT008": "icum02",     // ICU-MED_2

    // --- โซนเฉพาะทาง ---
    "DEPT009": "ortho1",     // กระดูกและข้อ
    "DEPT010": "vipmed",     // พิเศษอายุรกรรมชั้น4
    "DEPT011": "vipsur",     // พิเศษศัลยกรรมชั้น4
    "DEPT012": "peds01",     // กุมารเวช
    "DEPT013": "monk01",     // อภิบาลสงฆ์
    "DEPT014": "ent001",     // โสต ศอ นาสิก
    "DEPT015": "vipob5",     // พิเศษสูติ-นรีเวช ชั้น5
    "DEPT016": "vipob4",     // พิเศษสูติ-นรีเวช ชั้น4
    "DEPT017": "vipped",     // พิเศษกุมารเวช
    "DEPT018": "neuro1",     // ศัลยกรรมระบบประสาทและสมอง

    // --- ICU เด็กและรวม ---
    "DEPT019": "nicu01",     // NICU
    "DEPT020": "pproom",     // สูติ-นรีเวช (PP)
    "DEPT021": "icuall",     // ICU_รวม

    // --- หน่วยงานพิเศษ (Special Units) ---
    "SPECIAL001": "orroom",  // ห้องผ่าตัด (OR)
    "SPECIAL002": "eroom1",  // ห้องอุบัติเหตุ ฉุกเฉิน (ER)
    "SPECIAL003": "anesth",  // วิสัญญีพยาบาล (Anesth)
    "SPECIAL004": "lrroom",  // ห้องคลอด (LR)

    // --- แผนกผู้ป่วยนอก (OPD) ---
    "OPD001": "opdsur",      // OPD ศัลยกรรม
    "OPD002": "opdped",      // OPD กุมารเวช
    "OPD003": "opdmed",      // OPD (Med+GP+Ortho+หัวใจ+พิเศษ)
    "OPD004": "opdanc",      // OPD ANC
    "OPD005": "opduro",      // OPD Uro
    "OPD006": "opdneu",      // OPD Neuro
    "OPD007": "opdeye",      // OPD จักษุ
    "OPD008": "opdent",      // OPD ENT
    "OPD009": "opddm1",      // OPD DM/HT
    "OPD010": "opdcapd",     // OPD CAPD

    // --- Admin (ยังคงความปลอดภัยสูง) ---
    "ADMIN": "Nbl@Admin2025!"
};

