import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ================= Types =================
interface NotificationSettings {
  onDataEntry: {
    enabled: boolean;
  };
  reminder: {
    enabled: boolean;
    dayOfMonth: number;
    time: string;
  };
}

interface DepartmentData {
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
}

// ================= Constants =================
const MONTHS_TH = [
  "ตุลาคม", "พฤศจิกายน", "ธันวาคม", "มกราคม", "กุมภาพันธ์", "มีนาคม",
  "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน"
];

// Department configurations
const DEPARTMENT_GROUPS = {
  ipd: {
    name: 'ผู้ป่วยใน (IPD)',
    departments: [
      { id: 'DEPT001', name: 'หอผู้ป่วยอายุรกรรมชาย' },
      { id: 'DEPT002', name: 'หอผู้ป่วยอายุรกรรมหญิง' },
      { id: 'DEPT003', name: 'หอผู้ป่วยศัลยกรรมชาย' },
      { id: 'DEPT004', name: 'หอผู้ป่วยศัลยกรรมหญิง' },
      { id: 'DEPT005', name: 'หอผู้ป่วยกุมารเวชกรรม' },
      { id: 'DEPT006', name: 'หอผู้ป่วยสูติ-นรีเวชกรรม' },
      { id: 'DEPT007', name: 'หอผู้ป่วยออร์โธปิดิกส์' },
      { id: 'DEPT008', name: 'หอผู้ป่วย ICU' },
      { id: 'DEPT009', name: 'หอผู้ป่วยพิเศษ 1' },
      { id: 'DEPT010', name: 'หอผู้ป่วยพิเศษ 2' },
    ]
  },
  opd: {
    name: 'ผู้ป่วยนอก (OPD)',
    departments: [
      { id: 'OPD001', name: 'OPD อายุรกรรม' },
      { id: 'OPD002', name: 'OPD ศัลยกรรม' },
      { id: 'OPD003', name: 'OPD กุมารเวชกรรม' },
      { id: 'OPD004', name: 'OPD สูติ-นรีเวชกรรม' },
      { id: 'OPD005', name: 'OPD ออร์โธปิดิกส์' },
      { id: 'OPD006', name: 'OPD จักษุ' },
      { id: 'OPD007', name: 'OPD โสต ศอ นาสิก' },
      { id: 'OPD008', name: 'OPD CAPD' },
      { id: 'OPD009', name: 'คลินิกเบาหวาน' },
      { id: 'OPD010', name: 'คลินิกความดัน' },
    ]
  },
  special: {
    name: 'หน่วยงานพิเศษ',
    departments: [
      { id: 'SPECIAL001', name: 'ห้องผ่าตัด (OR)' },
      { id: 'SPECIAL002', name: 'ห้องฉุกเฉิน (ER)' },
      { id: 'SPECIAL003', name: 'วิสัญญีพยาบาล (Anesth)' },
      { id: 'SPECIAL004', name: 'ห้องคลอด (LR)' },
    ]
  }
};

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');

function getNotificationSettings(): NotificationSettings {
  const filePath = path.join(DATA_DIR, 'notification-settings.json');
  if (!fs.existsSync(filePath)) {
    return {
      onDataEntry: { enabled: true },
      reminder: { enabled: true, dayOfMonth: 25, time: '09:00' }
    };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return {
      onDataEntry: { enabled: true },
      reminder: { enabled: true, dayOfMonth: 25, time: '09:00' }
    };
  }
}

function getLineSettings() {
  const filePath = path.join(DATA_DIR, 'line-settings.json');
  if (!fs.existsSync(filePath)) {
    return { enabled: false, channelAccessToken: '' };
  }
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
  } catch {
    return { enabled: false, channelAccessToken: '' };
  }
}

// Get current fiscal year and month
function getCurrentFiscalPeriod(): { fiscalYear: string; month: string } {
  const now = new Date();
  const currentMonth = now.getMonth(); // 0-11
  const currentYear = now.getFullYear();
  
  // Fiscal year starts in October (month 9)
  // Oct-Dec = fiscal year is next year, Jan-Sep = fiscal year is current year
  let fiscalYear: number;
  let fiscalMonthIndex: number;
  
  if (currentMonth >= 9) { // Oct, Nov, Dec
    fiscalYear = currentYear + 544; // พ.ศ. + 1
    fiscalMonthIndex = currentMonth - 9; // Oct=0, Nov=1, Dec=2
  } else { // Jan - Sep
    fiscalYear = currentYear + 543; // พ.ศ.
    fiscalMonthIndex = currentMonth + 3; // Jan=3, Feb=4, ..., Sep=11
  }
  
  return {
    fiscalYear: fiscalYear.toString(),
    month: MONTHS_TH[fiscalMonthIndex]
  };
}

// Get all QA data for a fiscal year
function getQAData(fiscalYear: string): DepartmentData[] {
  const qaDir = path.join(DATA_DIR, 'qa');
  const results: DepartmentData[] = [];
  
  if (!fs.existsSync(qaDir)) {
    return results;
  }
  
  // Read all department files
  const files = fs.readdirSync(qaDir);
  for (const file of files) {
    if (file.endsWith('.json')) {
      try {
        const filePath = path.join(qaDir, file);
        const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        
        // Filter by fiscal year
        if (data.fiscalYear === fiscalYear) {
          results.push({
            departmentId: data.departmentId,
            departmentName: data.departmentName,
            fiscalYear: data.fiscalYear,
            month: data.month
          });
        }
      } catch (e) {
        console.error(`Error reading ${file}:`, e);
      }
    }
  }
  
  return results;
}

// Find departments that haven't submitted data
function findPendingDepartments(fiscalYear: string, month: string): Array<{ group: string; name: string; id: string }> {
  const submittedData = getQAData(fiscalYear);
  const submittedIds = new Set(
    submittedData
      .filter(d => d.month === month)
      .map(d => d.departmentId)
  );
  
  const pending: Array<{ group: string; name: string; id: string }> = [];
  
  for (const [groupKey, groupData] of Object.entries(DEPARTMENT_GROUPS)) {
    for (const dept of groupData.departments) {
      if (!submittedIds.has(dept.id)) {
        pending.push({
          group: groupData.name,
          name: dept.name,
          id: dept.id
        });
      }
    }
  }
  
  return pending;
}

// Send LINE notification
async function sendLineNotification(pendingDepts: Array<{ group: string; name: string }>, fiscalYear: string, month: string) {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
  
  try {
    const response = await fetch(`${baseUrl}/api/line/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'reminder',
        pendingDepartments: pendingDepts,
        fiscalYear,
        month
      })
    });
    
    return response.ok;
  } catch (e) {
    console.error('Error sending LINE notification:', e);
    return false;
  }
}

// ================= API Handler =================
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const force = searchParams.get('force') === 'true';
    const checkOnly = searchParams.get('check') === 'true';
    
    // Get settings
    const notificationSettings = getNotificationSettings();
    const lineSettings = getLineSettings();
    
    // Check if reminder is enabled
    if (!notificationSettings.reminder.enabled) {
      return NextResponse.json({
        success: false,
        message: 'Reminder notification is disabled',
        skipped: true
      });
    }
    
    // Check if LINE is enabled
    if (!lineSettings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'LINE notification is disabled',
        skipped: true
      });
    }
    
    // Get current date
    const now = new Date();
    const currentDay = now.getDate();
    const currentHour = now.getHours();
    const [reminderHour] = notificationSettings.reminder.time.split(':').map(Number);
    
    // Check if it's the right day and time (unless forced)
    if (!force) {
      if (currentDay !== notificationSettings.reminder.dayOfMonth) {
        return NextResponse.json({
          success: false,
          message: `Today is not reminder day (${currentDay} vs ${notificationSettings.reminder.dayOfMonth})`,
          skipped: true
        });
      }
      
      if (currentHour !== reminderHour) {
        return NextResponse.json({
          success: false,
          message: `Not reminder time yet (${currentHour}:00 vs ${reminderHour}:00)`,
          skipped: true
        });
      }
    }
    
    // Get current fiscal period
    const { fiscalYear, month } = getCurrentFiscalPeriod();
    
    // Find pending departments
    const pendingDepts = findPendingDepartments(fiscalYear, month);
    
    if (pendingDepts.length === 0) {
      return NextResponse.json({
        success: true,
        message: 'All departments have submitted data!',
        data: {
          fiscalYear,
          month,
          pendingCount: 0
        }
      });
    }
    
    // If check only, return without sending
    if (checkOnly) {
      return NextResponse.json({
        success: true,
        message: `Found ${pendingDepts.length} pending departments`,
        data: {
          fiscalYear,
          month,
          pendingCount: pendingDepts.length,
          pendingDepartments: pendingDepts
        }
      });
    }
    
    // Send notification
    const sent = await sendLineNotification(pendingDepts, fiscalYear, month);
    
    return NextResponse.json({
      success: sent,
      message: sent 
        ? `Reminder sent for ${pendingDepts.length} pending departments`
        : 'Failed to send reminder',
      data: {
        fiscalYear,
        month,
        pendingCount: pendingDepts.length,
        pendingDepartments: pendingDepts,
        notificationSent: sent
      }
    });
    
  } catch (error) {
    console.error('Cron reminder error:', error);
    return NextResponse.json({
      success: false,
      message: 'Error running reminder check'
    }, { status: 500 });
  }
}

// POST - Manual trigger
export async function POST(request: NextRequest) {
  // Redirect to GET with force=true
  const url = new URL(request.url);
  url.searchParams.set('force', 'true');
  
  return GET(new NextRequest(url));
}
