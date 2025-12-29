import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { decryptToken } from '@/lib/crypto-utils';

// ================= Types =================
interface LineEvent {
  type: string;
  timestamp: number;
  source: {
    type: 'user' | 'group' | 'room';
    userId?: string;
    groupId?: string;
    roomId?: string;
  };
  replyToken?: string;
  message?: {
    type: string;
    text?: string;
  };
}

interface LineWebhookBody {
  destination: string;
  events: LineEvent[];
}

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

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');
const RECIPIENTS_FILE = path.join(DATA_DIR, 'line-recipients.json');
const SETTINGS_FILE = path.join(DATA_DIR, 'line-settings.json');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

function getRecipients(): RecipientsData {
  ensureDataDir();
  if (!fs.existsSync(RECIPIENTS_FILE)) {
    return { users: [], groups: [], updatedAt: new Date().toISOString() };
  }
  try {
    return JSON.parse(fs.readFileSync(RECIPIENTS_FILE, 'utf-8'));
  } catch {
    return { users: [], groups: [], updatedAt: new Date().toISOString() };
  }
}

function saveRecipients(data: RecipientsData) {
  ensureDataDir();
  data.updatedAt = new Date().toISOString();
  fs.writeFileSync(RECIPIENTS_FILE, JSON.stringify(data, null, 2));
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

// Verify LINE signature (optional but recommended)
function verifySignature(body: string, signature: string, channelSecret: string): boolean {
  if (!channelSecret) return true; // Skip verification if no secret
  const hash = crypto
    .createHmac('SHA256', channelSecret)
    .update(body)
    .digest('base64');
  return hash === signature;
}

// Get user profile from LINE API
async function getUserProfile(userId: string, accessToken: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/profile/${userId}`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.displayName || 'Unknown User';
    }
  } catch (e) {
    console.error('Error getting user profile:', e);
  }
  return 'LINE User';
}

// Get group summary from LINE API
async function getGroupSummary(groupId: string, accessToken: string): Promise<string> {
  try {
    const res = await fetch(`https://api.line.me/v2/bot/group/${groupId}/summary`, {
      headers: { Authorization: `Bearer ${accessToken}` }
    });
    if (res.ok) {
      const data = await res.json();
      return data.groupName || 'Unknown Group';
    }
  } catch (e) {
    console.error('Error getting group summary:', e);
  }
  return 'LINE Group';
}

// Send reply message
async function replyMessage(replyToken: string, message: string, accessToken: string) {
  try {
    await fetch('https://api.line.me/v2/bot/message/reply', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`
      },
      body: JSON.stringify({
        replyToken,
        messages: [{ type: 'text', text: message }]
      })
    });
  } catch (e) {
    console.error('Error sending reply:', e);
  }
}

// ================= Webhook Handler =================
export async function POST(request: NextRequest) {
  try {
    const bodyText = await request.text();
    const signature = request.headers.get('x-line-signature') || '';
    const settings = getSettings();

    // Verify signature (if channel secret is configured)
    if (settings.channelSecret && !verifySignature(bodyText, signature, settings.channelSecret)) {
      console.error('Invalid signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    const body: LineWebhookBody = JSON.parse(bodyText);
    const recipients = getRecipients();
    // Decrypt the access token (supports both encrypted and plaintext)
    const accessToken = decryptToken(settings.channelAccessToken) || process.env.LINE_CHANNEL_ACCESS_TOKEN || '';

    console.log('Received LINE webhook:', JSON.stringify(body, null, 2));

    for (const event of body.events) {
      const timestamp = new Date().toISOString();

      switch (event.type) {
        // User added bot as friend
        case 'follow': {
          const userId = event.source.userId;
          if (userId && !recipients.users.find(u => u.id === userId)) {
            const displayName = await getUserProfile(userId, accessToken);
            recipients.users.push({
              id: userId,
              type: 'user',
              displayName,
              addedAt: timestamp
            });
            saveRecipients(recipients);
            console.log(`New user followed: ${displayName} (${userId})`);

            // Send welcome message
            if (event.replyToken) {
              await replyMessage(
                event.replyToken,
                '🎉 ยินดีต้อนรับสู่ระบบแจ้งเตือน QA โรงพยาบาลหนองบัวลำภู!\n\nคุณจะได้รับการแจ้งเตือนเมื่อ:\n✅ มีการลงข้อมูล QA ใหม่\n✅ ใกล้ครบกำหนดลงข้อมูลประจำเดือน\n\nขอบคุณครับ 🙏',
                accessToken
              );
            }
          }
          break;
        }

        // User blocked/unfriended bot
        case 'unfollow': {
          const userId = event.source.userId;
          if (userId) {
            recipients.users = recipients.users.filter(u => u.id !== userId);
            saveRecipients(recipients);
            console.log(`User unfollowed: ${userId}`);
          }
          break;
        }

        // Bot joined a group
        case 'join': {
          const groupId = event.source.groupId;
          if (groupId && !recipients.groups.find(g => g.id === groupId)) {
            const groupName = await getGroupSummary(groupId, accessToken);
            recipients.groups.push({
              id: groupId,
              type: 'group',
              displayName: groupName,
              addedAt: timestamp
            });
            saveRecipients(recipients);
            console.log(`Bot joined group: ${groupName} (${groupId})`);

            // Send welcome message to group
            if (event.replyToken) {
              await replyMessage(
                event.replyToken,
                '🎉 สวัสดีครับ! Bot แจ้งเตือน QA โรงพยาบาลหนองบัวลำภู พร้อมให้บริการแล้ว\n\nกลุ่มนี้จะได้รับการแจ้งเตือน:\n✅ เมื่อมีการลงข้อมูล QA ใหม่\n✅ ใกล้ครบกำหนดลงข้อมูลประจำเดือน\n\nขอบคุณครับ 🙏',
                accessToken
              );
            }
          }
          break;
        }

        // Bot was removed from group
        case 'leave': {
          const groupId = event.source.groupId;
          if (groupId) {
            recipients.groups = recipients.groups.filter(g => g.id !== groupId);
            saveRecipients(recipients);
            console.log(`Bot left group: ${groupId}`);
          }
          break;
        }

        // Handle text messages (optional - for testing)
        case 'message': {
          if (event.message?.type === 'text' && event.message?.text) {
            const text = event.message.text.toLowerCase();

            // Test command
            if (text === 'test' || text === 'ทดสอบ') {
              if (event.replyToken) {
                await replyMessage(
                  event.replyToken,
                  '✅ ระบบแจ้งเตือน QA ทำงานปกติครับ!',
                  accessToken
                );
              }
            }

            // Status command
            if (text === 'status' || text === 'สถานะ') {
              if (event.replyToken) {
                const currentRecipients = getRecipients();
                await replyMessage(
                  event.replyToken,
                  `📊 สถานะระบบแจ้งเตือน QA\n\n👤 ผู้รับแจ้งเตือน: ${currentRecipients.users.length} คน\n👥 กลุ่ม: ${currentRecipients.groups.length} กลุ่ม\n\n✅ ระบบพร้อมใช้งาน`,
                  accessToken
                );
              }
            }
          }
          break;
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// GET - For LINE webhook verification
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'LINE Webhook endpoint is ready',
    timestamp: new Date().toISOString()
  });
}
