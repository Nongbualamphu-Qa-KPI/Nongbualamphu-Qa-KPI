'use client';

import React from 'react';
import {
    LayoutDashboard,
    ClipboardEdit,
    Download,
    Settings,
    ChevronLeft,
    ChevronRight,
    Building2,
    LogOut,
    Bell,
    Moon,
    Sun,
} from 'lucide-react';

export type AdminView = 'dashboard' | 'data_entry' | 'export' | 'settings';

interface AdminSidebarProps {
    activeView: AdminView;
    onViewChange: (view: AdminView) => void;
    isCollapsed: boolean;
    onToggleCollapse: () => void;
    currentUser: {
        name: string;
        email?: string;
        role?: string;
    };
    onLogout: () => void;
    darkMode?: boolean;
    onToggleDarkMode?: () => void;
    notifications?: number;
}

const MENU_ITEMS: Array<{
    id: AdminView;
    icon: React.ReactNode;
    label: string;
    description: string;
    color: string;
}> = [
        {
            id: 'dashboard',
            icon: <LayoutDashboard className="w-5 h-5" />,
            label: 'Dashboard',
            description: 'ภาพรวมผลลัพธ์ KPI',
            color: 'from-indigo-500 to-purple-600',
        },
        {
            id: 'data_entry',
            icon: <ClipboardEdit className="w-5 h-5" />,
            label: 'จัดการข้อมูล',
            description: 'ดู/แก้ไขข้อมูลรายแผนก',
            color: 'from-emerald-500 to-teal-600',
        },
        {
            id: 'export',
            icon: <Download className="w-5 h-5" />,
            label: 'Export ข้อมูล',
            description: 'ดาวน์โหลด Excel',
            color: 'from-amber-500 to-orange-600',
        },
        {
            id: 'settings',
            icon: <Settings className="w-5 h-5" />,
            label: 'ตั้งค่าระบบ',
            description: 'การตั้งค่าทั่วไป',
            color: 'from-slate-500 to-slate-700',
        },
    ];

export function AdminSidebar({
    activeView,
    onViewChange,
    isCollapsed,
    onToggleCollapse,
    currentUser,
    onLogout,
    darkMode = false,
    onToggleDarkMode,
    notifications = 0,
}: AdminSidebarProps) {
    return (
        <aside
            className={`
        fixed left-0 top-0 h-full z-50
        bg-gradient-to-b from-slate-900 via-slate-800 to-slate-900
        border-r border-slate-700/50
        transition-all duration-300 ease-in-out
        flex flex-col shadow-2xl
        ${isCollapsed ? 'w-20' : 'w-72'}
      `}
        >
            {/* Header */}
            <div className="relative p-4 border-b border-slate-700/50">
                <div className={`flex items-center ${isCollapsed ? 'justify-center' : 'gap-3'}`}>
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
                        <Building2 className="w-5 h-5 text-white" />
                    </div>
                    {!isCollapsed && (
                        <div className="flex-1 min-w-0">
                            <h2 className="text-sm font-bold text-white truncate">QA Admin Panel</h2>
                            <p className="text-xs text-slate-400 truncate">โรงพยาบาลหนองบัวลำภู</p>
                        </div>
                    )}
                </div>

                {/* Collapse Toggle */}
                <button
                    onClick={onToggleCollapse}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-700 transition-all shadow-lg z-10"
                >
                    {isCollapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
                </button>
            </div>

            {/* Quick Actions */}
            {!isCollapsed && (
                <div className="px-4 py-3 border-b border-slate-700/50">
                    <div className="flex items-center gap-2">
                        {/* Notifications */}
                        <button className="relative flex-1 flex items-center justify-center gap-2 px-3 py-2 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all">
                            <Bell className="w-4 h-4" />
                            <span className="text-xs">แจ้งเตือน</span>
                            {notifications > 0 && (
                                <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-rose-500 text-white text-xs flex items-center justify-center font-bold">
                                    {notifications > 9 ? '9+' : notifications}
                                </span>
                            )}
                        </button>
                        {/* Dark Mode Toggle */}
                        {onToggleDarkMode && (
                            <button
                                onClick={onToggleDarkMode}
                                className="flex items-center justify-center w-10 h-10 rounded-lg bg-slate-800/50 hover:bg-slate-700/50 text-slate-300 hover:text-white transition-all"
                            >
                                {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                            </button>
                        )}
                    </div>
                </div>
            )}

            {/* Navigation */}
            <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
                {MENU_ITEMS.map((item) => {
                    const isActive = activeView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onViewChange(item.id)}
                            className={`
                w-full flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200
                ${isActive
                                    ? `bg-gradient-to-r ${item.color} text-white shadow-lg`
                                    : 'text-slate-400 hover:text-white hover:bg-slate-700/50'
                                }
                ${isCollapsed ? 'justify-center' : ''}
              `}
                            title={isCollapsed ? item.label : undefined}
                        >
                            <span className={`flex-shrink-0 ${isActive ? 'text-white' : ''}`}>{item.icon}</span>
                            {!isCollapsed && (
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-sm font-medium truncate">{item.label}</p>
                                    <p className={`text-xs truncate ${isActive ? 'text-white/80' : 'text-slate-500'}`}>
                                        {item.description}
                                    </p>
                                </div>
                            )}
                            {isActive && !isCollapsed && (
                                <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* User Section */}
            <div className={`p-4 border-t border-slate-700/50 ${isCollapsed ? 'text-center' : ''}`}>
                {!isCollapsed && (
                    <div className="mb-3 px-2">
                        <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-800/50">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-sm">
                                {currentUser.name.charAt(0).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-white truncate">{currentUser.name}</p>
                                <p className="text-xs text-slate-400 truncate">{currentUser.role || 'Administrator'}</p>
                            </div>
                        </div>
                    </div>
                )}
                <button
                    onClick={onLogout}
                    className={`
            w-full flex items-center gap-2 px-3 py-2.5 rounded-xl
            bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 hover:text-rose-300
            transition-all duration-200
            ${isCollapsed ? 'justify-center' : ''}
          `}
                    title={isCollapsed ? 'ออกจากระบบ' : undefined}
                >
                    <LogOut className="w-4 h-4" />
                    {!isCollapsed && <span className="text-sm font-medium">ออกจากระบบ</span>}
                </button>
            </div>
        </aside>
    );
}

export default AdminSidebar;
