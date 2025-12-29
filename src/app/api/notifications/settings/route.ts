import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { encryptToken, decryptToken, isEncrypted, maskToken, migrateTokenIfNeeded } from '@/lib/crypto-utils';

// ================= Types =================
interface LineSettings {
  channelAccessToken: string;
  channelSecret: string;
  webhookUrl: string;
  enabled: boolean;
  lastTestedAt?: string;
  testStatus?: 'success' | 'failed';
  botInfo?: {
    displayName: string;
    userId: string;
    pictureUrl?: string;
  };
  updatedAt: string;
}

interface NotificationSettings {
  onDataEntry: {
    enabled: boolean;
    description: string;
  };
  reminder: {
    enabled: boolean;
    dayOfMonth: number;
    time: string;
    description: string;
  };
  updatedAt: string;
}

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');
const LINE_SETTINGS_FILE = path.join(DATA_DIR, 'line-settings.json');
const NOTIFICATION_SETTINGS_FILE = path.join(DATA_DIR, 'notification-settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getLineSettings(): LineSettings {
  ensureDataDir();
  if (!fs.existsSync(LINE_SETTINGS_FILE)) {
    return {
      channelAccessToken: '',
      channelSecret: '',
      webhookUrl: '',
      enabled: false,
      updatedAt: new Date().toISOString()
    };
  }
  try {
    return JSON.parse(fs.readFileSync(LINE_SETTINGS_FILE, 'utf-8'));
  } catch {
    return {
      channelAccessToken: '',
      channelSecret: '',
      webhookUrl: '',
      enabled: false,
      updatedAt: new Date().toISOString()
    };
  }
}

function saveLineSettings(data: Partial<LineSettings>) {
  ensureDataDir();
  const current = getLineSettings();
  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(LINE_SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

function getNotificationSettings(): NotificationSettings {
  ensureDataDir();
  if (!fs.existsSync(NOTIFICATION_SETTINGS_FILE)) {
    return {
      onDataEntry: {
        enabled: true,
        description: 'แจ้งเตือนเมื่อมีการลงข้อมูลใหม่'
      },
      reminder: {
        enabled: true,
        dayOfMonth: 25,
        time: '09:00',
        description: 'แจ้งเตือนใกล้ครบกำหนดลงข้อมูล'
      },
      updatedAt: new Date().toISOString()
    };
  }
  try {
    return JSON.parse(fs.readFileSync(NOTIFICATION_SETTINGS_FILE, 'utf-8'));
  } catch {
    return {
      onDataEntry: {
        enabled: true,
        description: 'แจ้งเตือนเมื่อมีการลงข้อมูลใหม่'
      },
      reminder: {
        enabled: true,
        dayOfMonth: 25,
        time: '09:00',
        description: 'แจ้งเตือนใกล้ครบกำหนดลงข้อมูล'
      },
      updatedAt: new Date().toISOString()
    };
  }
}

function saveNotificationSettings(data: Partial<NotificationSettings>) {
  ensureDataDir();
  const current = getNotificationSettings();
  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString()
  };
  fs.writeFileSync(NOTIFICATION_SETTINGS_FILE, JSON.stringify(updated, null, 2));
  return updated;
}

// ================= API Handlers =================

// GET - Get all settings
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    if (type === 'line') {
      const lineSettings = getLineSettings();
      // Mask token for security
      return NextResponse.json({
        success: true,
        data: {
          ...lineSettings,
          channelAccessToken: lineSettings.channelAccessToken
            ? '●●●●●●●●' + lineSettings.channelAccessToken.slice(-10)
            : '',
          channelSecret: lineSettings.channelSecret
            ? '●●●●●●●●' + lineSettings.channelSecret.slice(-4)
            : ''
        }
      });
    }

    if (type === 'notification') {
      const notificationSettings = getNotificationSettings();
      return NextResponse.json({
        success: true,
        data: notificationSettings
      });
    }

    // Return all settings
    const lineSettings = getLineSettings();
    const notificationSettings = getNotificationSettings();

    return NextResponse.json({
      success: true,
      data: {
        line: {
          ...lineSettings,
          channelAccessToken: lineSettings.channelAccessToken
            ? '●●●●●●●●' + lineSettings.channelAccessToken.slice(-10)
            : '',
          channelSecret: lineSettings.channelSecret
            ? '●●●●●●●●' + lineSettings.channelSecret.slice(-4)
            : ''
        },
        notification: notificationSettings
      }
    });
  } catch (error) {
    console.error('Get settings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get settings'
    }, { status: 500 });
  }
}

// POST - Save settings
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { type, ...data } = body;

    if (type === 'line') {
      // Only update token if new value provided (not masked)
      const currentSettings = getLineSettings();
      const updateData: Partial<LineSettings> = {};

      // Encrypt token if provided and not already masked/encrypted
      if (data.channelAccessToken && !data.channelAccessToken.startsWith('●') && !data.channelAccessToken.startsWith('🔒')) {
        // Encrypt the new token
        updateData.channelAccessToken = encryptToken(data.channelAccessToken);
        console.log('🔒 Token encrypted for storage');
      }
      if (data.channelSecret && !data.channelSecret.startsWith('●') && !data.channelSecret.startsWith('🔒')) {
        // Encrypt the channel secret
        updateData.channelSecret = encryptToken(data.channelSecret);
      }
      if (data.webhookUrl !== undefined) {
        updateData.webhookUrl = data.webhookUrl;
      }
      if (data.enabled !== undefined) {
        updateData.enabled = data.enabled;
      }

      const saved = saveLineSettings(updateData);

      return NextResponse.json({
        success: true,
        message: 'บันทึกการตั้งค่า LINE สำเร็จ',
        data: {
          ...saved,
          channelAccessToken: maskToken(saved.channelAccessToken),
          channelSecret: maskToken(saved.channelSecret)
        }
      });
    }

    if (type === 'notification') {
      const saved = saveNotificationSettings(data);
      return NextResponse.json({
        success: true,
        message: 'บันทึกการตั้งค่าแจ้งเตือนสำเร็จ',
        data: saved
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid settings type'
    }, { status: 400 });

  } catch (error) {
    console.error('Save settings error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to save settings'
    }, { status: 500 });
  }
}
