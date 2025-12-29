import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { decryptToken } from '@/lib/crypto-utils';

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');
const SETTINGS_FILE = path.join(DATA_DIR, 'line-settings.json');
const RECIPIENTS_FILE = path.join(DATA_DIR, 'line-recipients.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    return { channelAccessToken: '', channelSecret: '', enabled: false };
  }
  try {
    return JSON.parse(fs.readFileSync(SETTINGS_FILE, 'utf-8'));
  } catch {
    return { channelAccessToken: '', channelSecret: '', enabled: false };
  }
}

function saveSettings(data: any) {
  ensureDataDir();
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

function getRecipients() {
  if (!fs.existsSync(RECIPIENTS_FILE)) {
    return { users: [], groups: [] };
  }
  try {
    return JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf-8'));
  } catch {
    return { users: [], groups: [] };
  }
}

// ================= API Handler =================
export async function POST(request: NextRequest) {
  try {
    const { testType, targetId } = await request.json();
    const settings = getSettings();
    // Decrypt the access token (supports both encrypted and plaintext)
    const accessToken = decryptToken(settings.channelAccessToken) || process.env.LINE_CHANNEL_ACCESS_TOKEN;

    if (!accessToken) {
      return NextResponse.json({
        success: false,
        message: 'Channel Access Token ไม่ได้ตั้งค่า'
      }, { status: 400 });
    }

    // Test 1: Verify token by getting bot info
    if (testType === 'connection' || !testType) {
      try {
        const res = await fetch('https://api.line.me/v2/bot/info', {
          headers: { Authorization: `Bearer ${accessToken}` }
        });

        if (!res.ok) {
          const error = await res.json();

          // Update settings with test result
          const currentSettings = getSettings();
          currentSettings.lastTestedAt = new Date().toISOString();
          currentSettings.testStatus = 'failed';
          currentSettings.testError = error.message || 'Invalid token';
          saveSettings(currentSettings);

          return NextResponse.json({
            success: false,
            message: 'Token ไม่ถูกต้องหรือหมดอายุ',
            error: error.message
          }, { status: 400 });
        }

        const botInfo = await res.json();

        // Update settings with test result
        const currentSettings = getSettings();
        currentSettings.lastTestedAt = new Date().toISOString();
        currentSettings.testStatus = 'success';
        currentSettings.botInfo = {
          displayName: botInfo.displayName,
          userId: botInfo.userId,
          pictureUrl: botInfo.pictureUrl
        };
        delete currentSettings.testError;
        saveSettings(currentSettings);

        return NextResponse.json({
          success: true,
          message: 'เชื่อมต่อสำเร็จ!',
          botInfo: {
            displayName: botInfo.displayName,
            userId: botInfo.userId,
            pictureUrl: botInfo.pictureUrl
          }
        });
      } catch (e) {
        return NextResponse.json({
          success: false,
          message: 'ไม่สามารถเชื่อมต่อ LINE API ได้'
        }, { status: 500 });
      }
    }

    // Test 2: Send test message to specific user/group
    if (testType === 'send') {
      const recipients = getRecipients();
      let target = targetId;

      // If no target specified, use first available recipient
      if (!target) {
        if (recipients.users.length > 0) {
          target = recipients.users[0].id;
        } else if (recipients.groups.length > 0) {
          target = recipients.groups[0].id;
        } else {
          return NextResponse.json({
            success: false,
            message: 'ไม่มีผู้รับข้อความ กรุณา Add LINE Bot เป็นเพื่อน หรือเชิญเข้ากลุ่มก่อน'
          }, { status: 400 });
        }
      }

      // Send test message
      const testMessage = `🧪 ทดสอบการแจ้งเตือน

━━━━━━━━━━━━━━━━━━
✅ ระบบแจ้งเตือน QA ทำงานปกติ
⏰ เวลา: ${new Date().toLocaleString('th-TH')}
━━━━━━━━━━━━━━━━━━

ข้อความนี้ส่งจากระบบ QA 
โรงพยาบาลหนองบัวลำภู`;

      try {
        const res = await fetch('https://api.line.me/v2/bot/message/push', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`
          },
          body: JSON.stringify({
            to: target,
            messages: [{ type: 'text', text: testMessage }]
          })
        });

        if (!res.ok) {
          const error = await res.json();
          return NextResponse.json({
            success: false,
            message: 'ส่งข้อความทดสอบไม่สำเร็จ',
            error: error.message
          }, { status: 400 });
        }

        return NextResponse.json({
          success: true,
          message: 'ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE ของคุณ'
        });
      } catch (e) {
        return NextResponse.json({
          success: false,
          message: 'เกิดข้อผิดพลาดในการส่งข้อความ'
        }, { status: 500 });
      }
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid test type'
    }, { status: 400 });

  } catch (error) {
    console.error('Test error:', error);
    return NextResponse.json({
      success: false,
      message: 'เกิดข้อผิดพลาด'
    }, { status: 500 });
  }
}

// GET - Get current test status
export async function GET() {
  try {
    const settings = getSettings();
    const recipients = getRecipients();

    return NextResponse.json({
      success: true,
      data: {
        enabled: settings.enabled || false,
        hasToken: !!settings.channelAccessToken,
        lastTestedAt: settings.lastTestedAt || null,
        testStatus: settings.testStatus || null,
        botInfo: settings.botInfo || null,
        recipientsCount: {
          users: recipients.users?.length || 0,
          groups: recipients.groups?.length || 0
        }
      }
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      message: 'Failed to get status'
    }, { status: 500 });
  }
}
