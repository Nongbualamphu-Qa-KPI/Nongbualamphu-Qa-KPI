// ===============================================================
// ตัวอย่างการ Integrate LINE Notification กับ /api/qa/save
// ===============================================================
// 
// ให้เพิ่ม code ด้านล่างนี้ใน /api/qa/save/route.ts หลังจากบันทึกข้อมูลสำเร็จ
//

import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

// ================= Types =================
interface QASaveRequest {
  departmentId: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
}

// ================= Helper Functions =================
const DATA_DIR = path.join(process.cwd(), 'data');

// Get department group name from department ID
function getDepartmentGroupName(departmentId: string): string {
  if (departmentId.startsWith('DEPT')) return 'ผู้ป่วยใน (IPD)';
  if (departmentId.startsWith('OPD')) return 'ผู้ป่วยนอก (OPD)';
  if (departmentId.startsWith('SPECIAL')) return 'หน่วยงานพิเศษ';
  return 'อื่นๆ';
}

// Get department name from department ID
function getDepartmentName(departmentId: string): string {
  const DEPARTMENTS: Record<string, string> = {
    'DEPT001': 'หอผู้ป่วยอายุรกรรมชาย',
    'DEPT002': 'หอผู้ป่วยอายุรกรรมหญิง',
    'OPD001': 'OPD อายุรกรรม',
    'OPD008': 'OPD CAPD',
    'SPECIAL001': 'ห้องผ่าตัด (OR)',
    'SPECIAL002': 'ห้องฉุกเฉิน (ER)',
    // ... เพิ่มตามต้องการ
  };
  return DEPARTMENTS[departmentId] || departmentId;
}

// Check if LINE notification is enabled
function isLineNotificationEnabled(): boolean {
  const settingsFile = path.join(DATA_DIR, 'line-settings.json');
  const notifFile = path.join(DATA_DIR, 'notification-settings.json');
  
  try {
    if (!fs.existsSync(settingsFile) || !fs.existsSync(notifFile)) {
      return false;
    }
    
    const lineSettings = JSON.parse(fs.readFileSync(settingsFile, 'utf-8'));
    const notifSettings = JSON.parse(fs.readFileSync(notifFile, 'utf-8'));
    
    return lineSettings.enabled && notifSettings.onDataEntry?.enabled;
  } catch {
    return false;
  }
}

// Send LINE notification
async function sendLineNotification(
  departmentId: string,
  departmentName: string,
  fiscalYear: string,
  month: string
) {
  try {
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000';
    const departmentGroup = getDepartmentGroupName(departmentId);
    
    const response = await fetch(`${baseUrl}/api/line/send`, {
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
    
    const result = await response.json();
    console.log('LINE notification result:', result);
    
    return result.success;
  } catch (error) {
    console.error('Error sending LINE notification:', error);
    return false;
  }
}

// ================= Main API Handler =================
export async function POST(request: NextRequest) {
  try {
    const body: QASaveRequest = await request.json();
    const { departmentId, fiscalYear, month, data } = body;

    // Validate
    if (!departmentId || !fiscalYear || !month) {
      return NextResponse.json({
        success: false,
        message: 'Missing required fields'
      }, { status: 400 });
    }

    // Get department name
    const departmentName = getDepartmentName(departmentId);

    // ===== บันทึกข้อมูล QA (code เดิมของคุณ) =====
    // ... your existing save logic ...
    
    // ตัวอย่าง: บันทึกลง JSON file
    const qaDir = path.join(DATA_DIR, 'qa');
    if (!fs.existsSync(qaDir)) {
      fs.mkdirSync(qaDir, { recursive: true });
    }
    
    const fileName = `${departmentId}_${fiscalYear}_${month}.json`;
    const filePath = path.join(qaDir, fileName);
    
    const saveData = {
      departmentId,
      departmentName,
      fiscalYear,
      month,
      data,
      updatedAt: new Date().toISOString()
    };
    
    fs.writeFileSync(filePath, JSON.stringify(saveData, null, 2));
    
    // ===== ส่ง LINE Notification (เพิ่มใหม่) =====
    if (isLineNotificationEnabled()) {
      // ส่งแบบ async ไม่ต้องรอผล
      sendLineNotification(departmentId, departmentName, fiscalYear, month)
        .then(success => {
          if (success) {
            console.log(`LINE notification sent for ${departmentName}`);
          }
        })
        .catch(err => {
          console.error('LINE notification error:', err);
        });
    }

    // ===== Return Response =====
    return NextResponse.json({
      success: true,
      message: 'บันทึกข้อมูลเรียบร้อยแล้ว',
      data: saveData
    });

  } catch (error) {
    console.error('QA save error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาดในการบันทึก'
    }, { status: 500 });
  }
}


// ===============================================================
// สรุป: สิ่งที่ต้องเพิ่มใน qa/save API ของคุณ
// ===============================================================
// 
// 1. Import และ Helper Functions:
//    - getDepartmentGroupName()
//    - isLineNotificationEnabled()
//    - sendLineNotification()
//
// 2. เพิ่ม code หลังบันทึกสำเร็จ:
//    if (isLineNotificationEnabled()) {
//      sendLineNotification(departmentId, departmentName, fiscalYear, month);
//    }
//
// 3. ไม่ต้องรอผล notification เพื่อไม่ให้ช้า
//    ใช้ .then().catch() แทน await
//
