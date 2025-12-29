'use client';

import React, { useState } from 'react';
import {
  Settings, Bell, Shield, Database, Users, Clock, Palette,
  Save, RefreshCw, AlertTriangle, CheckCircle, Info,
  ChevronRight, Lock, Eye, EyeOff, Trash2, Download,
  MessageSquare, Send, Copy, ExternalLink
} from 'lucide-react';

// Import LINE Notification Settings component
import LineNotificationSettings from './LineNotificationSettings';

// ================= Types =================
interface SettingsModuleProps {
  currentUser?: {
    name: string;
    role: string;
    department?: string;
  };
  onSaveSettings?: (settings: Record<string, any>) => void;
  onResetData?: () => void;
}

interface SettingSection {
  id: string;
  title: string;
  icon: React.ElementType;
  description: string;
}

// ================= Main Component =================
export default function SettingsModule({
  currentUser,
  onSaveSettings,
  onResetData
}: SettingsModuleProps) {
  const [activeSection, setActiveSection] = useState<string>('general');
  const [showConfirmReset, setShowConfirmReset] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // LINE OA Settings
  const [lineSettings, setLineSettings] = useState({
    token: '6PikKaXZ0yw3qIThSdf8XguOhe/+6E88reeIAZK23u+iIwJphopyupJNBXWqJh7r3/xKdjJ97EGUvJigeyXTk+cU78TMouCQ3mEEUXU7iupt9UGBbWznDYGyBoocgJ2Wu7z1ugFox+9rL9XIRkAs2wdB04t89/1O/w1cDnyilFU=',
    targetId: ''
  });
  const [isTestingLine, setIsTestingLine] = useState(false);
  const [lineTestResult, setLineTestResult] = useState<'success' | 'error' | null>(null);

  // Settings state
  const [settings, setSettings] = useState({
    // General
    fiscalYearStart: '10', // October
    autoLogoutMinutes: '60',
    language: 'th',

    // Notifications
    emailNotifications: true,
    reminderDays: '3',
    alertOnIncident: true,

    // Display
    theme: 'light',
    compactMode: false,
    showTips: true,

    // Security
    requirePasswordChange: false,
    sessionTimeout: '60',
    twoFactorAuth: false,

    // Data
    autoBackup: true,
    backupFrequency: 'daily',
    retentionDays: '365'
  });

  const sections: SettingSection[] = [
    { id: 'general', title: 'ทั่วไป', icon: Settings, description: 'การตั้งค่าพื้นฐานของระบบ' },
    { id: 'line', title: 'LINE แจ้งเตือน', icon: MessageSquare, description: 'ตั้งค่า LINE Messaging API' },
    { id: 'notifications', title: 'การแจ้งเตือน', icon: Bell, description: 'ตั้งค่าการแจ้งเตือนและเตือนความจำ' },
    { id: 'display', title: 'การแสดงผล', icon: Palette, description: 'ปรับแต่งรูปแบบการแสดงผล' },
    { id: 'security', title: 'ความปลอดภัย', icon: Shield, description: 'การตั้งค่าความปลอดภัยและการเข้าถึง' },
    { id: 'data', title: 'ข้อมูล', icon: Database, description: 'การจัดการข้อมูลและสำรองข้อมูล' },
  ];

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      onSaveSettings?.(settings);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setShowConfirmReset(false);
    onResetData?.();
  };

  const updateSetting = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          เดือนเริ่มต้นปีงบประมาณ
        </label>
        <select
          value={settings.fiscalYearStart}
          onChange={(e) => updateSetting('fiscalYearStart', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="10">ตุลาคม (ปีงบประมาณไทย)</option>
          <option value="1">มกราคม (ปีปฏิทิน)</option>
          <option value="4">เมษายน</option>
        </select>
        <p className="mt-1 text-xs text-slate-500">ระบบจะเริ่มนับปีงบประมาณใหม่ในเดือนที่เลือก</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          เวลา Auto Logout (นาที)
        </label>
        <input
          type="number"
          value={settings.autoLogoutMinutes}
          onChange={(e) => updateSetting('autoLogoutMinutes', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="5"
          max="480"
        />
        <p className="mt-1 text-xs text-slate-500">ระบบจะออกจากระบบอัตโนมัติหากไม่มีการใช้งาน</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          ภาษา
        </label>
        <select
          value={settings.language}
          onChange={(e) => updateSetting('language', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="th">ไทย</option>
          <option value="en">English</option>
        </select>
      </div>
    </div>
  );

  // Test LINE notification
  const testLineNotification = async () => {
    if (!lineSettings.token || !lineSettings.targetId) {
      alert('กรุณากรอก Token และ Group ID ก่อนครับ');
      return;
    }
    setIsTestingLine(true);
    setLineTestResult(null);
    try {
      const res = await fetch('/api/notifications/send-push', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: lineSettings.token,
          targetId: lineSettings.targetId,
          message: '✅ ทดสอบการเชื่อมต่อ: ระบบ QA พร้อมแจ้งเตือนแล้วครับ!\n\n📊 โรงพยาบาลหนองบัวลำภู\n🕐 ' + new Date().toLocaleString('th-TH')
        })
      });
      if (res.ok) {
        setLineTestResult('success');
        setTimeout(() => setLineTestResult(null), 5000);
      } else {
        setLineTestResult('error');
      }
    } catch (e) {
      setLineTestResult('error');
    } finally {
      setIsTestingLine(false);
    }
  };

  // Copy webhook URL
  const copyWebhookUrl = () => {
    const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
    navigator.clipboard.writeText(`${baseUrl}/api/webhook`);
    alert('คัดลอก Webhook URL แล้ว!');
  };

  const renderNotificationSettings = () => (
    <div className="space-y-6">
      {/* LINE OA Section */}
      <div className="p-5 bg-gradient-to-br from-green-50 to-emerald-50 rounded-2xl border border-green-200">
        <div className="flex items-center gap-3 mb-5">
          <div className="p-3 bg-gradient-to-br from-green-500 to-emerald-600 rounded-xl shadow-lg">
            <MessageSquare className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-green-900 text-lg">LINE Official Account</h3>
            <p className="text-sm text-green-700">ตั้งค่าการแจ้งเตือนผ่าน LINE Messaging API</p>
          </div>
        </div>

        {/* Test Result Toast */}
        {lineTestResult && (
          <div className={`mb-4 p-3 rounded-xl flex items-center gap-2 ${lineTestResult === 'success'
            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
            : 'bg-rose-100 text-rose-800 border border-rose-300'
            }`}>
            {lineTestResult === 'success' ? (
              <><CheckCircle className="w-5 h-5" /> ส่งข้อความทดสอบสำเร็จ! เช็คในไลน์ได้เลยครับ</>
            ) : (
              <><AlertTriangle className="w-5 h-5" /> ส่งไม่สำเร็จ ตรวจสอบ Token หรือ ID อีกครั้ง</>
            )}
          </div>
        )}

        {/* Token Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-green-900 mb-2">
            🔑 Channel Access Token
          </label>
          <div className="relative">
            <input
              type="password"
              value={lineSettings.token}
              onChange={(e) => setLineSettings({ ...lineSettings, token: e.target.value })}
              className="w-full border-2 border-green-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
              placeholder="วาง Token ที่ได้จาก LINE Developers..."
            />
          </div>
          <p className="mt-1.5 text-xs text-green-600 flex items-center gap-1">
            <ExternalLink className="w-3 h-3" />
            รับ Token ที่ <a href="https://developers.line.biz/" target="_blank" rel="noopener noreferrer" className="underline hover:text-green-800">LINE Developers Console</a>
          </p>
        </div>

        {/* Group ID Input */}
        <div className="mb-4">
          <label className="block text-sm font-semibold text-green-900 mb-2">
            🎯 Target Group ID (รหัสกลุ่มปลายทาง)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={lineSettings.targetId}
              onChange={(e) => setLineSettings({ ...lineSettings, targetId: e.target.value })}
              className="flex-1 border-2 border-green-200 rounded-xl px-4 py-3 text-sm bg-white focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono"
              placeholder="Cxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
            />
            <button
              onClick={testLineNotification}
              disabled={isTestingLine || !lineSettings.token || !lineSettings.targetId}
              className="inline-flex items-center gap-2 px-5 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl text-sm font-semibold hover:from-green-600 hover:to-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-500/30 transition-all"
            >
              {isTestingLine ? (
                <><RefreshCw className="w-4 h-4 animate-spin" /> กำลังส่ง...</>
              ) : (
                <><Send className="w-4 h-4" /> ทดสอบส่ง</>
              )}
            </button>
          </div>
          <div className="mt-2 p-3 bg-white/70 rounded-xl border border-green-100">
            <p className="text-xs text-green-700 font-medium mb-1">💡 วิธีหา Group ID:</p>
            <ol className="text-xs text-green-600 list-decimal list-inside space-y-1">
              <li>เชิญบอท LINE OA เข้ากลุ่มที่ต้องการ</li>
              <li>พิมพ์ <code className="bg-green-100 px-1.5 py-0.5 rounded font-mono font-bold">!id</code> ในกลุ่ม</li>
              <li>บอทจะตอบกลับรหัส Group ID มาให้</li>
            </ol>
          </div>
        </div>

        {/* Webhook URL */}
        <div className="p-4 bg-white/70 rounded-xl border border-green-100">
          <label className="block text-sm font-semibold text-green-900 mb-2">
            🔗 Webhook URL (สำหรับตั้งค่าใน LINE Developers)
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              readOnly
              value="https://ticklish-disaffectedly-josette.ngrok-free.dev/api/webhook"
              className="flex-1 border border-green-200 rounded-lg px-3 py-2 text-sm bg-green-50 text-green-800 font-mono"
            />
            <button
              onClick={() => {
                navigator.clipboard.writeText('https://ticklish-disaffectedly-josette.ngrok-free.dev/api/webhook');
                alert('คัดลอก Webhook URL แล้ว!');
              }}
              className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition-colors"
              title="คัดลอก URL"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>
          <p className="mt-2 text-xs text-green-600">
            ⚠️ URL นี้ใช้กับ ngrok tunnel - ถ้า ngrok restart ต้องอัพเดท URL ใหม่
          </p>
        </div>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-4">
        <div className="flex-1 h-px bg-slate-200" />
        <span className="text-sm text-slate-400">การแจ้งเตือนอื่นๆ</span>
        <div className="flex-1 h-px bg-slate-200" />
      </div>

      {/* Email Settings */}
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <h4 className="font-medium text-slate-800">📧 Email แจ้งเตือน</h4>
          <p className="text-sm text-slate-500">รับการแจ้งเตือนทาง Email</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.emailNotifications}
            onChange={(e) => updateSetting('emailNotifications', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          ⏰ แจ้งเตือนล่วงหน้า (วัน)
        </label>
        <input
          type="number"
          value={settings.reminderDays}
          onChange={(e) => updateSetting('reminderDays', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="1"
          max="14"
        />
        <p className="mt-1 text-xs text-slate-500">ระบบจะแจ้งเตือนก่อนถึงกำหนดส่งข้อมูล</p>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
        <div>
          <h4 className="font-medium text-slate-800">🚨 แจ้งเตือนเมื่อมีอุบัติการณ์</h4>
          <p className="text-sm text-slate-500">รับการแจ้งเตือนทันทีเมื่อบันทึกอุบัติการณ์ใหม่</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.alertOnIncident}
            onChange={(e) => updateSetting('alertOnIncident', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );

  const renderDisplaySettings = () => (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-3">
          ธีมสี
        </label>
        <div className="grid grid-cols-3 gap-3">
          {[
            { id: 'light', name: 'สว่าง', bg: 'bg-white', border: 'border-slate-200' },
            { id: 'dark', name: 'มืด', bg: 'bg-slate-800', border: 'border-slate-600' },
            { id: 'system', name: 'ตามระบบ', bg: 'bg-gradient-to-r from-white to-slate-800', border: 'border-slate-300' }
          ].map(theme => (
            <button
              key={theme.id}
              onClick={() => updateSetting('theme', theme.id)}
              className={`
                p-4 rounded-xl border-2 transition-all
                ${settings.theme === theme.id
                  ? 'border-indigo-500 ring-2 ring-indigo-200'
                  : `${theme.border} hover:border-slate-300`
                }
              `}
            >
              <div className={`w-full h-8 rounded-lg ${theme.bg} mb-2 border ${theme.border}`} />
              <p className="text-sm font-medium text-slate-700">{theme.name}</p>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800">โหมดกระชับ</h4>
          <p className="text-sm text-slate-500">แสดงข้อมูลแบบกระชับ ลดพื้นที่ว่าง</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.compactMode}
            onChange={(e) => updateSetting('compactMode', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800">แสดงคำแนะนำ</h4>
          <p className="text-sm text-slate-500">แสดงเคล็ดลับและคำแนะนำการใช้งาน</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.showTips}
            onChange={(e) => updateSetting('showTips', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>
    </div>
  );

  const renderSecuritySettings = () => (
    <div className="space-y-6">
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 mt-0.5" />
          <div>
            <h4 className="font-medium text-amber-800">การตั้งค่าความปลอดภัย</h4>
            <p className="text-sm text-amber-700 mt-1">
              การเปลี่ยนแปลงการตั้งค่าความปลอดภัยอาจต้องการการยืนยันตัวตนใหม่
            </p>
          </div>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Session Timeout (นาที)
        </label>
        <select
          value={settings.sessionTimeout}
          onChange={(e) => updateSetting('sessionTimeout', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
        >
          <option value="15">15 นาที</option>
          <option value="30">30 นาที</option>
          <option value="60">1 ชั่วโมง</option>
          <option value="120">2 ชั่วโมง</option>
          <option value="240">4 ชั่วโมง</option>
        </select>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800">บังคับเปลี่ยนรหัสผ่าน</h4>
          <p className="text-sm text-slate-500">ให้ผู้ใช้เปลี่ยนรหัสผ่านทุก 90 วัน</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.requirePasswordChange}
            onChange={(e) => updateSetting('requirePasswordChange', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg opacity-60">
        <div>
          <h4 className="font-medium text-slate-800">Two-Factor Authentication</h4>
          <p className="text-sm text-slate-500">เพิ่มความปลอดภัยด้วยการยืนยันสองขั้นตอน</p>
        </div>
        <span className="text-xs px-2 py-1 bg-slate-200 text-slate-600 rounded">เร็วๆ นี้</span>
      </div>
    </div>
  );

  const renderDataSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between p-4 bg-slate-50 rounded-lg">
        <div>
          <h4 className="font-medium text-slate-800">สำรองข้อมูลอัตโนมัติ</h4>
          <p className="text-sm text-slate-500">ระบบจะสำรองข้อมูลโดยอัตโนมัติ</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            checked={settings.autoBackup}
            onChange={(e) => updateSetting('autoBackup', e.target.checked)}
            className="sr-only peer"
          />
          <div className="w-11 h-6 bg-slate-200 peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600"></div>
        </label>
      </div>

      {settings.autoBackup && (
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            ความถี่การสำรองข้อมูล
          </label>
          <select
            value={settings.backupFrequency}
            onChange={(e) => updateSetting('backupFrequency', e.target.value)}
            className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          >
            <option value="daily">ทุกวัน</option>
            <option value="weekly">ทุกสัปดาห์</option>
            <option value="monthly">ทุกเดือน</option>
          </select>
        </div>
      )}

      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          เก็บข้อมูลย้อนหลัง (วัน)
        </label>
        <input
          type="number"
          value={settings.retentionDays}
          onChange={(e) => updateSetting('retentionDays', e.target.value)}
          className="w-full border border-slate-200 rounded-lg px-4 py-2.5 focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
          min="30"
          max="3650"
        />
        <p className="mt-1 text-xs text-slate-500">ข้อมูลที่เก่ากว่าจำนวนวันที่กำหนดจะถูกเก็บถาวร</p>
      </div>

      {/* Manual Backup Button */}
      <div className="p-4 border border-slate-200 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="font-medium text-slate-800">สำรองข้อมูลด้วยตนเอง</h4>
            <p className="text-sm text-slate-500">ดาวน์โหลดข้อมูลทั้งหมดเป็นไฟล์</p>
          </div>
          <button className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg hover:bg-indigo-200 transition-colors">
            <Download className="w-4 h-4" />
            <span className="font-medium">Backup Now</span>
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="p-4 border border-rose-200 rounded-lg bg-rose-50">
        <h4 className="font-medium text-rose-800 mb-3">⚠️ Danger Zone</h4>
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-rose-700">รีเซ็ตข้อมูลทั้งหมด</p>
            <p className="text-xs text-rose-600">ลบข้อมูลทั้งหมดและเริ่มต้นใหม่ (ไม่สามารถกู้คืนได้)</p>
          </div>
          <button
            onClick={() => setShowConfirmReset(true)}
            className="inline-flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            <span className="font-medium">Reset</span>
          </button>
        </div>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (activeSection) {
      case 'general': return renderGeneralSettings();
      case 'line': return <LineNotificationSettings />;
      case 'notifications': return renderNotificationSettings();
      case 'display': return renderDisplaySettings();
      case 'security': return renderSecuritySettings();
      case 'data': return renderDataSettings();
      default: return renderGeneralSettings();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50">
      {/* Reset Confirmation Modal */}
      {showConfirmReset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md mx-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-rose-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-rose-600" />
              </div>
              <h3 className="text-lg font-semibold text-slate-800">ยืนยันการรีเซ็ตข้อมูล</h3>
            </div>
            <p className="text-slate-600 mb-6">
              คุณแน่ใจหรือไม่ว่าต้องการลบข้อมูลทั้งหมด? การดำเนินการนี้ไม่สามารถย้อนกลับได้
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmReset(false)}
                className="flex-1 px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleReset}
                className="flex-1 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
              >
                รีเซ็ตทั้งหมด
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {saveSuccess && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 bg-emerald-500 text-white rounded-lg shadow-lg animate-slide-in">
          <CheckCircle className="w-5 h-5" />
          <span className="font-medium">บันทึกการตั้งค่าสำเร็จ</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 mb-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-slate-700 to-slate-800 rounded-xl shadow-lg">
              <Settings className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">ตั้งค่าระบบ</h1>
              <p className="text-slate-500">จัดการการตั้งค่าและปรับแต่งระบบ</p>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 sticky top-6">
              <nav className="space-y-1">
                {sections.map(section => {
                  const Icon = section.icon;
                  const isActive = activeSection === section.id;
                  return (
                    <button
                      key={section.id}
                      onClick={() => setActiveSection(section.id)}
                      className={`
                        w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left
                        ${isActive
                          ? 'bg-indigo-50 text-indigo-700'
                          : 'hover:bg-slate-50 text-slate-600'
                        }
                      `}
                    >
                      <Icon className={`w-5 h-5 ${isActive ? 'text-indigo-600' : ''}`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium">{section.title}</p>
                        <p className="text-xs text-slate-500 truncate">{section.description}</p>
                      </div>
                      {isActive && <ChevronRight className="w-4 h-4" />}
                    </button>
                  );
                })}
              </nav>
            </div>
          </div>

          {/* Content */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-200">
                {(() => {
                  const section = sections.find(s => s.id === activeSection);
                  const Icon = section?.icon || Settings;
                  return (
                    <>
                      <div className="p-2 bg-indigo-100 rounded-lg">
                        <Icon className="w-5 h-5 text-indigo-600" />
                      </div>
                      <div>
                        <h2 className="text-lg font-semibold text-slate-800">{section?.title}</h2>
                        <p className="text-sm text-slate-500">{section?.description}</p>
                      </div>
                    </>
                  );
                })()}
              </div>

              {renderContent()}

              {/* Save Button */}
              <div className="mt-8 pt-6 border-t border-slate-200 flex justify-end gap-3">
                <button
                  onClick={() => window.location.reload()}
                  className="px-4 py-2 border border-slate-200 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
                >
                  ยกเลิก
                </button>
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="inline-flex items-center gap-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50"
                >
                  {isSaving ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      กำลังบันทึก...
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      บันทึกการตั้งค่า
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Current User Info */}
            {currentUser && (
              <div className="mt-6 bg-slate-50 rounded-2xl p-6 border border-slate-100">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <Users className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-800">{currentUser.name}</h3>
                    <p className="text-sm text-slate-500">
                      {currentUser.role}{currentUser.department ? ` • ${currentUser.department}` : ''}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
