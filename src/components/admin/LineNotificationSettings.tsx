'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Bell, Send, Settings, Users, MessageSquare, Check, X, AlertTriangle,
  RefreshCw, Copy, ExternalLink, Trash2, TestTube, Clock, Calendar,
  Smartphone, UserPlus, UsersRound, CheckCircle, XCircle, Eye, EyeOff,
  Info, Loader2, ChevronDown, ChevronUp, Zap, Link2
} from 'lucide-react';

// ================= Types =================
interface Recipient {
  id: string;
  type: 'user' | 'group';
  displayName: string;
  addedAt: string;
}

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
}

interface RecipientsData {
  users: Recipient[];
  groups: Recipient[];
}

// ================= Main Component =================
export default function LineNotificationSettings() {
  // State
  const [lineSettings, setLineSettings] = useState<LineSettings>({
    channelAccessToken: '',
    channelSecret: '',
    webhookUrl: '',
    enabled: false
  });
  const [notificationSettings, setNotificationSettings] = useState<NotificationSettings>({
    onDataEntry: { enabled: true, description: 'แจ้งเตือนเมื่อมีการลงข้อมูลใหม่' },
    reminder: { enabled: true, dayOfMonth: 25, time: '09:00', description: 'แจ้งเตือนใกล้ครบกำหนด' }
  });
  const [recipients, setRecipients] = useState<RecipientsData>({ users: [], groups: [] });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [sendingTest, setSendingTest] = useState(false);

  const [showToken, setShowToken] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>('connection');

  const [message, setMessage] = useState<{ type: 'success' | 'error' | 'info'; text: string } | null>(null);

  // New token input (for editing)
  const [newToken, setNewToken] = useState('');
  const [newSecret, setNewSecret] = useState('');
  const [editingToken, setEditingToken] = useState(false);

  // Webhook URL - Default to ngrok URL (can be customized)
  const [customWebhookUrl, setCustomWebhookUrl] = useState('');

  // Get webhook URL - prioritize custom URL, then ngrok, then localhost
  const getWebhookUrl = () => {
    if (customWebhookUrl) return customWebhookUrl;
    // Default ngrok URL - update this when ngrok restarts
    const ngrokUrl = 'https://ticklish-disaffectedly-josette.ngrok-free.dev';
    return `${ngrokUrl}/api/line/webhook`;
  };

  const webhookUrl = getWebhookUrl();

  // ================= Load Data =================
  const loadSettings = useCallback(async () => {
    try {
      setLoading(true);

      // Load LINE settings
      const lineRes = await fetch('/api/notifications/settings?type=line');
      if (lineRes.ok) {
        const lineData = await lineRes.json();
        if (lineData.success) {
          setLineSettings(lineData.data);
        }
      }

      // Load notification settings
      const notifRes = await fetch('/api/notifications/settings?type=notification');
      if (notifRes.ok) {
        const notifData = await notifRes.json();
        if (notifData.success) {
          setNotificationSettings(notifData.data);
        }
      }

      // Load recipients
      const recipRes = await fetch('/api/line/recipients');
      if (recipRes.ok) {
        const recipData = await recipRes.json();
        if (recipData.success) {
          setRecipients(recipData.data);
        }
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      showMessage('error', 'ไม่สามารถโหลดข้อมูลได้');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // ================= Helpers =================
  const showMessage = (type: 'success' | 'error' | 'info', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    showMessage('success', 'คัดลอกแล้ว!');
  };

  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // ================= Actions =================
  const saveLineSettings = async () => {
    try {
      setSaving(true);

      const payload: any = {
        type: 'line',
        enabled: lineSettings.enabled,
        webhookUrl: webhookUrl
      };

      // Only include token/secret if editing
      if (newToken) {
        payload.channelAccessToken = newToken;
      }
      if (newSecret) {
        payload.channelSecret = newSecret;
      }

      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();

      if (data.success) {
        setLineSettings(data.data);
        setNewToken('');
        setNewSecret('');
        setEditingToken(false);
        showMessage('success', 'บันทึกการตั้งค่า LINE สำเร็จ');
      } else {
        showMessage('error', data.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const saveNotificationSettings = async () => {
    try {
      setSaving(true);

      const res = await fetch('/api/notifications/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'notification',
          ...notificationSettings
        })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'บันทึกการตั้งค่าแจ้งเตือนสำเร็จ');
      } else {
        showMessage('error', data.message || 'บันทึกไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาด');
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    try {
      setTesting(true);

      const res = await fetch('/api/line/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'connection' })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', `เชื่อมต่อสำเร็จ! Bot: ${data.botInfo?.displayName}`);
        // Reload settings to get updated test status
        loadSettings();
      } else {
        showMessage('error', data.message || 'เชื่อมต่อไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('error', 'ไม่สามารถทดสอบการเชื่อมต่อได้');
    } finally {
      setTesting(false);
    }
  };

  const sendTestMessage = async () => {
    try {
      setSendingTest(true);

      const res = await fetch('/api/line/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ testType: 'send' })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', 'ส่งข้อความทดสอบสำเร็จ! ตรวจสอบ LINE');
      } else {
        showMessage('error', data.message || 'ส่งไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('error', 'ไม่สามารถส่งข้อความทดสอบได้');
    } finally {
      setSendingTest(false);
    }
  };

  const deleteRecipient = async (id: string, type: 'user' | 'group') => {
    if (!confirm('ต้องการลบผู้รับนี้?')) return;

    try {
      const res = await fetch('/api/line/recipients', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, type })
      });

      const data = await res.json();

      if (data.success) {
        showMessage('success', data.message);
        loadSettings();
      } else {
        showMessage('error', data.message || 'ลบไม่สำเร็จ');
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาด');
    }
  };

  const triggerReminder = async () => {
    try {
      const res = await fetch('/api/cron/reminder?force=true');
      const data = await res.json();

      if (data.success) {
        showMessage('success', data.message);
      } else {
        showMessage('info', data.message);
      }
    } catch (error) {
      showMessage('error', 'เกิดข้อผิดพลาด');
    }
  };

  // ================= Render =================
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className="p-2.5 bg-gradient-to-br from-green-100 to-emerald-100 rounded-xl">
              <MessageSquare className="w-6 h-6 text-green-600" />
            </div>
            การแจ้งเตือน LINE
          </h2>
          <p className="text-slate-500 mt-1">ตั้งค่าการแจ้งเตือนผ่าน LINE Messaging API</p>
        </div>
        <button
          onClick={loadSettings}
          className="p-2.5 bg-white rounded-xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all"
        >
          <RefreshCw className="w-5 h-5 text-slate-600" />
        </button>
      </div>

      {/* Message */}
      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 ${message.type === 'success' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
            message.type === 'error' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
              'bg-blue-50 text-blue-700 border border-blue-200'
          }`}>
          {message.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
            message.type === 'error' ? <XCircle className="w-5 h-5" /> :
              <Info className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Section 1: LINE Connection */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('connection')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-green-50 to-emerald-50 hover:from-green-100 hover:to-emerald-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Link2 className="w-5 h-5 text-green-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">การเชื่อมต่อ LINE</h3>
              <p className="text-sm text-slate-500">ตั้งค่า Channel Access Token และ Webhook</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {lineSettings.testStatus === 'success' && (
              <span className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-sm font-medium">
                ✓ เชื่อมต่อแล้ว
              </span>
            )}
            {expandedSection === 'connection' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {expandedSection === 'connection' && (
          <div className="p-6 space-y-6 border-t border-slate-100">
            {/* Enable/Disable */}
            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
              <div className="flex items-center gap-3">
                <Zap className={`w-5 h-5 ${lineSettings.enabled ? 'text-green-600' : 'text-slate-400'}`} />
                <div>
                  <p className="font-medium text-slate-700">เปิดใช้งานการแจ้งเตือน LINE</p>
                  <p className="text-sm text-slate-500">เมื่อเปิด ระบบจะส่งแจ้งเตือนไปยัง LINE</p>
                </div>
              </div>
              <button
                onClick={() => setLineSettings({ ...lineSettings, enabled: !lineSettings.enabled })}
                className={`relative w-14 h-8 rounded-full transition-all ${lineSettings.enabled ? 'bg-green-500' : 'bg-slate-300'}`}
              >
                <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${lineSettings.enabled ? 'left-7' : 'left-1'}`} />
              </button>
            </div>

            {/* Channel Access Token */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                🔑 Channel Access Token
              </label>
              {!editingToken ? (
                <div className="flex gap-2">
                  <div className="flex-1 px-4 py-3 bg-slate-100 rounded-xl text-slate-600 font-mono text-sm">
                    {lineSettings.channelAccessToken || '(ยังไม่ได้ตั้งค่า)'}
                  </div>
                  <button
                    onClick={() => setEditingToken(true)}
                    className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-xl hover:bg-indigo-200 font-medium"
                  >
                    แก้ไข
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="flex gap-2">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={newToken}
                      onChange={(e) => setNewToken(e.target.value)}
                      placeholder="ใส่ Token ใหม่..."
                      className="flex-1 px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 font-mono text-sm"
                    />
                    <button
                      onClick={() => setShowToken(!showToken)}
                      className="px-3 py-2 bg-slate-100 rounded-xl hover:bg-slate-200"
                    >
                      {showToken ? <EyeOff className="w-5 h-5 text-slate-600" /> : <Eye className="w-5 h-5 text-slate-600" />}
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setEditingToken(false); setNewToken(''); }}
                      className="px-4 py-2 border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                      ยกเลิก
                    </button>
                  </div>
                </div>
              )}
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                รับ Token จาก LINE Developers Console → Messaging API
              </p>
            </div>

            {/* Webhook URL */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-slate-700 flex items-center gap-2">
                🌐 Webhook URL
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={webhookUrl}
                  readOnly
                  className="flex-1 px-4 py-3 bg-slate-100 border-2 border-slate-200 rounded-xl text-slate-600 font-mono text-sm"
                />
                <button
                  onClick={() => copyToClipboard(webhookUrl)}
                  className="px-4 py-2 bg-slate-100 rounded-xl hover:bg-slate-200 flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Info className="w-3 h-3" />
                คัดลอก URL นี้ไปวางใน LINE Developers Console → Messaging API → Webhook URL
              </p>
            </div>

            {/* Test Status */}
            {lineSettings.lastTestedAt && (
              <div className={`p-4 rounded-xl ${lineSettings.testStatus === 'success' ? 'bg-emerald-50 border border-emerald-200' : 'bg-rose-50 border border-rose-200'}`}>
                <div className="flex items-center gap-3">
                  {lineSettings.testStatus === 'success' ? (
                    <CheckCircle className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-rose-600" />
                  )}
                  <div>
                    <p className={`font-medium ${lineSettings.testStatus === 'success' ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {lineSettings.testStatus === 'success' ? 'เชื่อมต่อสำเร็จ' : 'เชื่อมต่อไม่สำเร็จ'}
                    </p>
                    <p className="text-sm text-slate-500">
                      ทดสอบล่าสุด: {new Date(lineSettings.lastTestedAt).toLocaleString('th-TH')}
                      {lineSettings.botInfo && ` | Bot: ${lineSettings.botInfo.displayName}`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4 border-t border-slate-100">
              <button
                onClick={testConnection}
                disabled={testing}
                className="px-5 py-2.5 bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-xl hover:from-blue-600 hover:to-indigo-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {testing ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                ทดสอบการเชื่อมต่อ
              </button>
              <button
                onClick={saveLineSettings}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                บันทึกการตั้งค่า
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Section 2: Recipients */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('recipients')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-indigo-50 hover:from-blue-100 hover:to-indigo-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">ผู้รับการแจ้งเตือน</h3>
              <p className="text-sm text-slate-500">รายชื่อผู้ใช้และกลุ่มที่จะได้รับแจ้งเตือน</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
              {recipients.users.length + recipients.groups.length} รายการ
            </span>
            {expandedSection === 'recipients' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
          </div>
        </button>

        {expandedSection === 'recipients' && (
          <div className="p-6 space-y-6 border-t border-slate-100">
            {/* How to add */}
            <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-amber-800 font-medium flex items-center gap-2 mb-2">
                <Info className="w-4 h-4" />
                วิธีเพิ่มผู้รับแจ้งเตือน
              </p>
              <ul className="text-sm text-amber-700 space-y-1 ml-6 list-disc">
                <li><strong>เพิ่มผู้ใช้:</strong> ให้ผู้ใช้ Add LINE Bot เป็นเพื่อน (scan QR Code)</li>
                <li><strong>เพิ่มกลุ่ม:</strong> เชิญ LINE Bot เข้ากลุ่ม LINE</li>
                <li>ระบบจะเก็บข้อมูลผู้รับอัตโนมัติ</li>
              </ul>
            </div>

            {/* Users List */}
            <div>
              <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                <Smartphone className="w-4 h-4" />
                ผู้ใช้ ({recipients.users.length})
              </h4>
              {recipients.users.length === 0 ? (
                <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl">ยังไม่มีผู้ใช้</p>
              ) : (
                <div className="space-y-2">
                  {recipients.users.map((user) => (
                    <div key={user.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                          <UserPlus className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{user.displayName}</p>
                          <p className="text-xs text-slate-500">เพิ่มเมื่อ: {new Date(user.addedAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRecipient(user.id, 'user')}
                        className="p-2 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Groups List */}
            <div>
              <h4 className="font-medium text-slate-700 flex items-center gap-2 mb-3">
                <UsersRound className="w-4 h-4" />
                กลุ่ม ({recipients.groups.length})
              </h4>
              {recipients.groups.length === 0 ? (
                <p className="text-slate-500 text-sm p-4 bg-slate-50 rounded-xl">ยังไม่มีกลุ่ม</p>
              ) : (
                <div className="space-y-2">
                  {recipients.groups.map((group) => (
                    <div key={group.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-emerald-100 to-green-100 rounded-full flex items-center justify-center">
                          <UsersRound className="w-5 h-5 text-emerald-600" />
                        </div>
                        <div>
                          <p className="font-medium text-slate-700">{group.displayName}</p>
                          <p className="text-xs text-slate-500">เพิ่มเมื่อ: {new Date(group.addedAt).toLocaleDateString('th-TH')}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => deleteRecipient(group.id, 'group')}
                        className="p-2 hover:bg-rose-100 rounded-lg text-slate-400 hover:text-rose-600 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Send Test */}
            {(recipients.users.length > 0 || recipients.groups.length > 0) && (
              <div className="pt-4 border-t border-slate-100">
                <button
                  onClick={sendTestMessage}
                  disabled={sendingTest}
                  className="px-5 py-2.5 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:from-green-600 hover:to-emerald-700 font-medium flex items-center gap-2 disabled:opacity-50"
                >
                  {sendingTest ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  ส่งข้อความทดสอบ
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Section 3: Notification Types */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
        <button
          onClick={() => toggleSection('notifications')}
          className="w-full px-6 py-4 flex items-center justify-between bg-gradient-to-r from-purple-50 to-violet-50 hover:from-purple-100 hover:to-violet-100 transition-all"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white rounded-lg shadow-sm">
              <Bell className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-slate-800">ประเภทการแจ้งเตือน</h3>
              <p className="text-sm text-slate-500">เลือกประเภทการแจ้งเตือนที่ต้องการ</p>
            </div>
          </div>
          {expandedSection === 'notifications' ? <ChevronUp className="w-5 h-5 text-slate-400" /> : <ChevronDown className="w-5 h-5 text-slate-400" />}
        </button>

        {expandedSection === 'notifications' && (
          <div className="p-6 space-y-6 border-t border-slate-100">
            {/* On Data Entry */}
            <div className="p-4 border-2 border-slate-200 rounded-xl hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Bell className="w-5 h-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">แจ้งเตือนเมื่อมีการลงข้อมูลใหม่</p>
                    <p className="text-sm text-slate-500">ส่งแจ้งเตือนทันทีเมื่อมีแผนกบันทึกข้อมูล</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    onDataEntry: { ...notificationSettings.onDataEntry, enabled: !notificationSettings.onDataEntry.enabled }
                  })}
                  className={`relative w-14 h-8 rounded-full transition-all ${notificationSettings.onDataEntry.enabled ? 'bg-purple-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${notificationSettings.onDataEntry.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              <div className="ml-12 p-3 bg-slate-50 rounded-lg text-sm text-slate-600">
                <p className="font-medium mb-1">ตัวอย่างข้อความ:</p>
                <p className="font-mono text-xs whitespace-pre-wrap">🔔 แจ้งเตือนการบันทึกข้อมูล QA{'\n'}📊 มีการลงข้อมูลใหม่!{'\n'}🏥 กลุ่มแผนก: ผู้ป่วยใน (IPD){'\n'}🏢 แผนก: หอผู้ป่วยอายุรกรรมชาย{'\n'}📅 ปีงบประมาณ: 2568</p>
              </div>
            </div>

            {/* Reminder */}
            <div className="p-4 border-2 border-slate-200 rounded-xl hover:border-purple-200 transition-all">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-amber-100 rounded-lg">
                    <Clock className="w-5 h-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-medium text-slate-700">แจ้งเตือนใกล้ครบกำหนดลงข้อมูล</p>
                    <p className="text-sm text-slate-500">ส่งแจ้งเตือนแผนกที่ยังไม่ได้ลงข้อมูล</p>
                  </div>
                </div>
                <button
                  onClick={() => setNotificationSettings({
                    ...notificationSettings,
                    reminder: { ...notificationSettings.reminder, enabled: !notificationSettings.reminder.enabled }
                  })}
                  className={`relative w-14 h-8 rounded-full transition-all ${notificationSettings.reminder.enabled ? 'bg-amber-500' : 'bg-slate-300'}`}
                >
                  <div className={`absolute top-1 w-6 h-6 bg-white rounded-full shadow transition-all ${notificationSettings.reminder.enabled ? 'left-7' : 'left-1'}`} />
                </button>
              </div>

              {notificationSettings.reminder.enabled && (
                <div className="ml-12 space-y-3">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">วันที่:</span>
                      <select
                        value={notificationSettings.reminder.dayOfMonth}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          reminder: { ...notificationSettings.reminder, dayOfMonth: parseInt(e.target.value) }
                        })}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      >
                        {Array.from({ length: 28 }, (_, i) => i + 1).map(day => (
                          <option key={day} value={day}>{day}</option>
                        ))}
                      </select>
                      <span className="text-sm text-slate-600">ของทุกเดือน</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-slate-400" />
                      <span className="text-sm text-slate-600">เวลา:</span>
                      <select
                        value={notificationSettings.reminder.time}
                        onChange={(e) => setNotificationSettings({
                          ...notificationSettings,
                          reminder: { ...notificationSettings.reminder, time: e.target.value }
                        })}
                        className="px-3 py-1.5 border border-slate-200 rounded-lg text-sm"
                      >
                        {['07:00', '08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00'].map(time => (
                          <option key={time} value={time}>{time} น.</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Manual Trigger */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerReminder}
                      className="px-4 py-2 bg-amber-100 text-amber-700 rounded-lg hover:bg-amber-200 text-sm font-medium flex items-center gap-2"
                    >
                      <Zap className="w-4 h-4" />
                      ทดสอบส่ง Reminder ตอนนี้
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Save */}
            <div className="pt-4 border-t border-slate-100">
              <button
                onClick={saveNotificationSettings}
                disabled={saving}
                className="px-5 py-2.5 bg-gradient-to-r from-purple-500 to-violet-600 text-white rounded-xl hover:from-purple-600 hover:to-violet-700 font-medium flex items-center gap-2 disabled:opacity-50"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                บันทึกการตั้งค่าแจ้งเตือน
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Quick Guide */}
      <div className="bg-gradient-to-r from-slate-50 to-slate-100 rounded-2xl p-6">
        <h3 className="font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Info className="w-5 h-5 text-slate-600" />
          คู่มือการตั้งค่า LINE Messaging API
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="bg-white p-4 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold mb-2">1</div>
            <p className="font-medium text-slate-700 mb-1">สร้าง LINE Channel</p>
            <p className="text-sm text-slate-500">ไปที่ developers.line.biz สร้าง Messaging API Channel</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold mb-2">2</div>
            <p className="font-medium text-slate-700 mb-1">ตั้งค่า Webhook</p>
            <p className="text-sm text-slate-500">คัดลอก Webhook URL ไปวางใน LINE Console และเปิดใช้งาน</p>
          </div>
          <div className="bg-white p-4 rounded-xl">
            <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center text-blue-600 font-bold mb-2">3</div>
            <p className="font-medium text-slate-700 mb-1">เพิ่มผู้รับแจ้งเตือน</p>
            <p className="text-sm text-slate-500">Add LINE Bot เป็นเพื่อน หรือเชิญเข้ากลุ่ม</p>
          </div>
        </div>
        <a
          href="https://developers.line.biz/console/"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 mt-4 text-blue-600 hover:text-blue-700 font-medium"
        >
          <ExternalLink className="w-4 h-4" />
          ไปที่ LINE Developers Console
        </a>
      </div>
    </div>
  );
}
