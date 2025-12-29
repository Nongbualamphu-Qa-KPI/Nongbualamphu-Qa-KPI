import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { decryptToken } from '@/lib/crypto-utils';

// ================= Types =================
interface Recipient {
  id: string;
  type: 'user' | 'group';
  displayName: string;
  addedAt: string;
}

interface RecipientsData {
  users: Recipient[];
  groups: Recipient[];
  updatedAt: string;
}

interface SendMessageRequest {
  type: 'data_entry' | 'reminder' | 'custom';
  // For data_entry notification
  departmentGroup?: string;
  departmentName?: string;
  fiscalYear?: string;
  month?: string;
  // For reminder notification  
  pendingDepartments?: Array<{
    group: string;
    name: string;
  }>;
  // For custom message
  customMessage?: string;
  // Target
  targetType?: 'all' | 'users' | 'groups';
}

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');
const RECIPIENTS_FILE = path.join(DATA_DIR, 'line-recipients.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'line-settings.json');

function getRecipients(): RecipientsData {
  if (!fs.existsSync(RECIPIENTS_FILE)) {
    return { users: [], groups: [], updatedAt: new Date().toISOString() };
  }
  try {
    return JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf-8'));
  } catch {
    return { users: [], groups: [], updatedAt: new Date().toISOString() };
  }
}

function getSettings() {
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { channelAccessToken: '', enabled: false };
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return { channelAccessToken: '', enabled: false };
  }
}

// Format date to Thai
function formatThaiDate(date: Date): string {
  const thaiMonths = [
    'ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
    'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'
  ];
  const day = date.getDate();
  const month = thaiMonths[date.getMonth()];
  const year = date.getFullYear() + 543 - 2500; // แปลงเป็น พ.ศ. 2 หลัก
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${day} ${month} ${year} ${hours}:${minutes} น.`;
}

// Build message for data entry notification
function buildDataEntryMessage(data: SendMessageRequest): string {
  const now = new Date();
  return `🔔 แจ้งเตือนการบันทึกข้อมูล QA

📊 มีการลงข้อมูลใหม่!
━━━━━━━━━━━━━━━━━━
🏥 กลุ่มแผนก: ${data.departmentGroup || '-'}
🏢 แผนก: ${data.departmentName || '-'}
📅 ปีงบประมาณ: ${data.fiscalYear || '-'}
📆 เดือน: ${data.month || '-'}
⏰ เวลา: ${formatThaiDate(now)}
━━━━━━━━━━━━━━━━━━
✅ บันทึกข้อมูลเรียบร้อยแล้ว`;
}

// Build message for reminder notification
function buildReminderMessage(data: SendMessageRequest): string {
  let deptList = '';
  if (data.pendingDepartments && data.pendingDepartments.length > 0) {
    deptList = data.pendingDepartments
      .slice(0, 10) // แสดงแค่ 10 รายการแรก
      .map((dept, i) => `${i + 1}. ${dept.group} - ${dept.name}`)
      .join('\n');

    if (data.pendingDepartments.length > 10) {
      deptList += `\n... และอีก ${data.pendingDepartments.length - 10} แผนก`;
    }
  } else {
    deptList = '(ไม่พบรายการ)';
  }

  return `⏰ แจ้งเตือนการลงข้อมูล QA

📋 รายการที่ยังไม่ได้ลงข้อมูล
━━━━━━━━━━━━━━━━━━
${deptList}
━━━━━━━━━━━━━━━━━━
📅 ปีงบประมาณ: ${data.fiscalYear || '-'}
📆 เดือน: ${data.month || '-'}

📝 รบกวนลงบันทึกข้อมูลตัวชี้วัด
ประจำเดือน ด้วยครับ 🙏`;
}

// Send push message to LINE
async function sendPushMessage(to: string, message: string, accessToken: string): Promise<boolean> {
  try {
    const res = await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        to,
        messages: [{ type: 'text', text: message }]
      })
    });

    if (!res.ok) {
      const error = await res.json();
      console.error(`Failed to send to ${to}:`, error);
      return false;
    }

    return true;
  } catch (e) {
    console.error(`Error sending to ${to}:`, e);
    return false;
  }
}

// ================= API Handler =================
export async function POST(request: NextRequest) {
  try {
    const data: SendMessageRequest = await request.json();
    const settings = getSettings();
    // Decrypt the access token (supports both encrypted and plaintext)
    const accessToken = decryptToken(settings.channelAccessToken) || process.env.LINE_CHANNEL_ACCESS_TOKEN;

    // Check if LINE is enabled
    if (!settings.enabled) {
      return NextResponse.json({
        success: false,
        message: 'LINE notification is disabled'
      }, { status: 400 });
    }

    // Check access token
    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: 'LINE Channel Access Token not configured'
      }, { status: 400 });
    }

    // Build message based on type
    let message: string;
    switch (data.type) {
      case 'data_entry':
        message = buildDataEntryMessage(data);
        break;
      case 'reminder':
        message = buildReminderMessage(data);
        break;
      case 'custom':
        message = data.customMessage || 'ไม่มีข้อความ';
        break;
      default:
        return NextResponse.json({
          success: false,
          message: 'Invalid message type'
        }, { status: 400 });
    }

    // Get recipients
    const recipients = getRecipients();
    const targetType = data.targetType || 'all';

    const targets: string[] = [];
    if (targetType === 'all' || targetType === 'users') {
      targets.push(...recipients.users.map(u => u.id));
    }
    if (targetType === 'all' || targetType === 'groups') {
      targets.push(...recipients.groups.map(g => g.id));
    }

    if (targets.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No recipients found. Please add LINE Bot as friend or invite to group.'
      }, { status: 400 });
    }

    // Send to all targets
    const results = await Promise.all(
      targets.map(to => sendPushMessage(to, message, accessToken))
    );

    const successCount = results.filter(r => r).length;
    const failCount = results.filter(r => !r).length;

    console.log(`LINE notification sent: ${successCount} success, ${failCount} failed`);

    return NextResponse.json({
      success: true,
      message: `Sent to ${successCount}/${targets.length} recipients`,
      details: {
        total: targets.length,
        success: successCount,
        failed: failCount
      }
    });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to send message'
    }, { status: 500 });
  }
}
