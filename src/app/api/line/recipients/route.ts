import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

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

// ================= Helpers =================
const DATA_DIR = path.join(process.cwd(), 'data');
const RECIPIENTS_FILE = path.join(DATA_DIR, 'line-recipients.json');

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

// ================= API Handlers =================

// GET - Get all recipients
export async function GET() {
  try {
    const recipients = getRecipients();
    
    return NextResponse.json({
      success: true,
      data: recipients
    });
  } catch (error) {
    console.error('Get recipients error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to get recipients'
    }, { status: 500 });
  }
}

// DELETE - Remove a recipient
export async function DELETE(request: NextRequest) {
  try {
    const { id, type } = await request.json();

    if (!id || !type) {
      return NextResponse.json({
        success: false,
        message: 'Missing id or type'
      }, { status: 400 });
    }

    const recipients = getRecipients();

    if (type === 'user') {
      const index = recipients.users.findIndex(u => u.id === id);
      if (index === -1) {
        return NextResponse.json({
          success: false,
          message: 'User not found'
        }, { status: 404 });
      }
      const removed = recipients.users.splice(index, 1)[0];
      saveRecipients(recipients);

      return NextResponse.json({
        success: true,
        message: `ลบผู้ใช้ ${removed.displayName} แล้ว`
      });
    }

    if (type === 'group') {
      const index = recipients.groups.findIndex(g => g.id === id);
      if (index === -1) {
        return NextResponse.json({
          success: false,
          message: 'Group not found'
        }, { status: 404 });
      }
      const removed = recipients.groups.splice(index, 1)[0];
      saveRecipients(recipients);

      return NextResponse.json({
        success: true,
        message: `ลบกลุ่ม ${removed.displayName} แล้ว`
      });
    }

    return NextResponse.json({
      success: false,
      message: 'Invalid type'
    }, { status: 400 });

  } catch (error) {
    console.error('Delete recipient error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to delete recipient'
    }, { status: 500 });
  }
}

// POST - Add recipient manually (optional, mainly for testing)
export async function POST(request: NextRequest) {
  try {
    const { id, type, displayName } = await request.json();

    if (!id || !type) {
      return NextResponse.json({
        success: false,
        message: 'Missing id or type'
      }, { status: 400 });
    }

    const recipients = getRecipients();
    const newRecipient: Recipient = {
      id,
      type,
      displayName: displayName || (type === 'user' ? 'Manual User' : 'Manual Group'),
      addedAt: new Date().toISOString()
    };

    if (type === 'user') {
      if (recipients.users.find(u => u.id === id)) {
        return NextResponse.json({
          success: false,
          message: 'User already exists'
        }, { status: 400 });
      }
      recipients.users.push(newRecipient);
    } else if (type === 'group') {
      if (recipients.groups.find(g => g.id === id)) {
        return NextResponse.json({
          success: false,
          message: 'Group already exists'
        }, { status: 400 });
      }
      recipients.groups.push(newRecipient);
    } else {
      return NextResponse.json({
        success: false,
        message: 'Invalid type'
      }, { status: 400 });
    }

    saveRecipients(recipients);

    return NextResponse.json({
      success: true,
      message: 'Recipient added',
      data: newRecipient
    });

  } catch (error) {
    console.error('Add recipient error:', error);
    return NextResponse.json({
      success: false,
      message: 'Failed to add recipient'
    }, { status: 500 });
  }
}
