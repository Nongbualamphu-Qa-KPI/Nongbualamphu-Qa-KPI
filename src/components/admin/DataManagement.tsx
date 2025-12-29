'use client';

import React, { useState, useMemo, useEffect } from 'react';
import {
  Search, Edit, Trash2, Eye, ChevronDown,
  Building2, Calendar, CheckCircle, AlertTriangle,
  RefreshCw, Save, X, FileText,
  Grid3X3, List, Bed, Stethoscope, Syringe, Heart, Activity,
  Clock, TrendingUp, Shield, Users, Sparkles, ChevronRight,
  Layers, BarChart3, Database, Scissors, Ambulance, Baby,
  Pill, ClipboardList, Hash, FolderOpen
} from 'lucide-react';

// ================= Types =================
interface DepartmentData {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
}

interface GroupConfig {
  id: string;
  name: string;
  nameTh: string;
  description: string;
  color: string;
  bgColor: string;
  textColor: string;
  borderColor: string;
  departmentIds: string[];
}

interface DataManagementProps {
  allDepartmentsData: DepartmentData[];
  fieldLabels: Record<string, string>;
  computedFields: Set<string>;
  computeFields: (fields: Record<string, string>, year: string, month: string) => Record<string, string>;
  departmentGroup?: string;
  groupConfig?: GroupConfig | null;
  onSave: (record: DepartmentData) => Promise<boolean>;
  onDelete: (record: DepartmentData) => Promise<boolean>;
  onRefresh: () => void;
  loading?: boolean;
}

type SortField = 'departmentName' | 'month' | 'updatedAt' | 'dataCount';
type SortOrder = 'asc' | 'desc';

// ================= Constants =================
const MONTHS_TH = [
  "ตุลาคม", "พฤศจิกายน", "ธันวาคม", "มกราคม", "กุมภาพันธ์", "มีนาคม",
  "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน"
];

const MONTH_ORDER = MONTHS_TH.reduce((acc, month, idx) => {
  acc[month] = idx;
  return acc;
}, {} as Record<string, number>);

// ================= Field Categories =================
// ตรงกับโครงสร้างหมวดหมู่ที่หน้า User ใช้ในการกรอกข้อมูล

interface CategoryConfig {
  icon: React.ElementType;
  color: string;
  fields: string[];
}

// IPD Field Categories - เหมือนหน้า User
const IPD_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1. ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    fields: ['s1_1', 's1_2', 's1_3', 's1_4', 's1_5']
  },
  '📑 1.6 ตัวชี้วัดแผลกดทับ': {
    icon: Heart,
    color: 'from-pink-500 to-rose-600',
    fields: ['s1_6_1', 's1_6_2', 's1_6_3', 's1_6_4', 'pressureUlcerRate']
  },
  '⚠️ 1.7-1.10 อุบัติการณ์อื่นๆ': {
    icon: AlertTriangle,
    color: 'from-orange-500 to-red-600',
    fields: ['s1_7', 's1_8', 's1_9', 's1_10']
  },
  '🔄 2. อัตราการกลับเข้ารับการรักษาซ้ำ': {
    icon: RefreshCw,
    color: 'from-amber-500 to-orange-600',
    fields: ['s2_1', 's2_2', 'readmissionRate']
  },
  '🛏️ 3. ระยะวันนอนเฉลี่ย': {
    icon: Bed,
    color: 'from-cyan-500 to-blue-600',
    fields: ['s3_1', 'daysInMonth', 'averageLOS']
  },
  '📊 4. Productivity & Staffing': {
    icon: TrendingUp,
    color: 'from-emerald-500 to-green-600',
    fields: ['s4_1', 's4_2', 's4_3', 'rnHr', 'auxHr', 'ratioRnAux', 'actualHPPD', 'productivityValue']
  },
  '❤️ 7. CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['s7_1', 's7_2', 's7_3']
  },
  '⚠️ 8. SOS Scores': {
    icon: AlertTriangle,
    color: 'from-amber-500 to-yellow-600',
    fields: ['s8_1', 's8_2', 's8_3', 's8_4', 's8_5']
  },
  '💊 11. Pain Management': {
    icon: Pill,
    color: 'from-purple-500 to-violet-600',
    fields: ['s11_1_1', 's11_1_2', 's11_1_total', 's11_2_1', 's11_2_2', 's11_2_3', 's11_3_1', 's11_3_2', 's11_3_rate']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// OPD Field Categories - เหมือนหน้า User
const OPD_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1. ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-emerald-500 to-teal-600',
    fields: ['opd_1_1', 'opd_1_2', 'opd_1_3', 'opd_1_4', 'opd_1_5', 'opd_1_6']
  },
  '💀 2. อุบัติการณ์การตายอย่างไม่คาดคิด': {
    icon: AlertTriangle,
    color: 'from-rose-500 to-red-600',
    fields: ['opd_2']
  },
  '⚠️ 3. อุบัติเหตุจากการปฏิบัติงานของบุคลากร': {
    icon: Scissors,
    color: 'from-orange-500 to-amber-600',
    fields: ['opd_3']
  },
  '💊 4. ยา/เวชภัณฑ์หมดอายุ': {
    icon: Pill,
    color: 'from-blue-500 to-indigo-600',
    fields: ['opd_4']
  },
  '🏥 5. Unexpected Death & Unplan ICU': {
    icon: Bed,
    color: 'from-pink-500 to-rose-600',
    fields: ['opd_5_1', 'opd_5_2']
  },
  '❤️ CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['opd_cpr_1', 'opd_cpr_2', 'opd_cpr_3', 'opd_cpr_rate']
  },
  '💉 Pain Management': {
    icon: Pill,
    color: 'from-purple-500 to-violet-600',
    fields: ['opd_pain_1', 'opd_pain_1_1', 'opd_pain_1_2', 'opd_pain_2_1', 'opd_pain_2_2', 'opd_pain_2_3', 'opd_pain_3_1', 'opd_pain_3_2', 'opd_pain_3_result']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// OR Field Categories - เหมือนหน้า User
const OR_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1.1 ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-purple-500 to-violet-600',
    fields: ['or_1_1', 'or_1_2', 'or_1_3', 'or_1_4', 'or_1_5', 'or_1_6', 'or_1_7', 'or_1_8', 'or_1_9']
  },
  '⭐ 1.2 ความพึงพอใจต่อการบริการ': {
    icon: Heart,
    color: 'from-pink-500 to-fuchsia-600',
    fields: ['or_2_1', 'or_2_2', 'or_2_3']
  },
  '📊 1.3-4 ตัวชี้วัดเฉพาะ': {
    icon: BarChart3,
    color: 'from-blue-500 to-indigo-600',
    fields: ['or_3', 'or_4_1', 'or_4_2']
  },
  '❤️ 1.5 CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['or_5_1', 'or_5_2', 'or_5_3']
  },
  '✅ 2.1 เตรียมความพร้อมก่อนผ่าตัด': {
    icon: ClipboardList,
    color: 'from-emerald-500 to-green-600',
    fields: ['or_h2_1_1', 'or_h2_1_2', 'or_h2_1_3']
  },
  '🚨 2.2 ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    fields: ['or_h2_2_1', 'or_h2_2_2', 'or_h2_2_3']
  },
  '🏥 2.3 ประเมินอาการหลังผ่าตัด': {
    icon: Bed,
    color: 'from-cyan-500 to-blue-600',
    fields: ['or_h2_3_1', 'or_h2_3_2', 'or_h2_3_3']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// ER Field Categories - เหมือนหน้า User
const ER_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1.1 ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    fields: ['er_1_1', 'er_1_2', 'er_1_3', 'er_1_4', 'er_1_5', 'er_1_6', 'er_1_7', 'er_1_8', 'er_1_9']
  },
  '⭐ 1.2 ความพึงพอใจต่อการบริการ': {
    icon: Heart,
    color: 'from-pink-500 to-fuchsia-600',
    fields: ['er_2_1', 'er_2_2', 'er_2_3']
  },
  '📊 1.3-4 ตัวชี้วัดเฉพาะ': {
    icon: BarChart3,
    color: 'from-blue-500 to-indigo-600',
    fields: ['er_3', 'er_4_1', 'er_4_2']
  },
  '❤️ 1.5 CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['er_5_1', 'er_5_2', 'er_5_3']
  },
  '💊 Pain 1: จำนวนครั้ง': {
    icon: Pill,
    color: 'from-purple-500 to-violet-600',
    fields: ['er_pm_1', 'er_pm_1_1', 'er_pm_1_2']
  },
  '📋 Pain 2: ชนิดความปวด': {
    icon: ClipboardList,
    color: 'from-indigo-500 to-blue-600',
    fields: ['er_pm_2_1', 'er_pm_2_2', 'er_pm_2_3']
  },
  '✅ Pain 3: ความครบถ้วน': {
    icon: ClipboardList,
    color: 'from-emerald-500 to-green-600',
    fields: ['er_pm_3_1', 'er_pm_3_2', 'er_pm_3_3']
  },
  '🏥 3.1 Triage (คัดกรอง)': {
    icon: Users,
    color: 'from-amber-500 to-orange-600',
    fields: ['er_h3_1_1', 'er_h3_1_2', 'er_h3_1_3']
  },
  '🚨 3.2 ความปลอดภัย': {
    icon: Shield,
    color: 'from-rose-500 to-red-600',
    fields: ['er_h3_2_1_1', 'er_h3_2_1_2', 'er_h3_2_1_3', 'er_h3_2_2', 'er_h3_2_3']
  },
  '🚑 3.3 การส่งต่อ': {
    icon: Ambulance,
    color: 'from-cyan-500 to-blue-600',
    fields: ['er_h3_3_1', 'er_h3_3_2', 'er_h3_3_3']
  },
  '🔄 3.4 Readmission': {
    icon: RefreshCw,
    color: 'from-amber-500 to-orange-600',
    fields: ['er_h3_4']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// Anesth Field Categories - เหมือนหน้า User
const ANESTH_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1.1 ความปลอดภัยของผู้ใช้บริการ': {
    icon: Shield,
    color: 'from-violet-500 to-purple-600',
    fields: ['an_1_1', 'an_1_2', 'an_1_3', 'an_1_4', 'an_1_5', 'an_1_6', 'an_1_7', 'an_1_8', 'an_1_9']
  },
  '⭐ 1.2 ความพึงพอใจต่อการบริการ': {
    icon: Heart,
    color: 'from-pink-500 to-fuchsia-600',
    fields: ['an_2_1', 'an_2_2', 'an_2_3']
  },
  '📊 1.3-4 ตัวชี้วัดเฉพาะ': {
    icon: BarChart3,
    color: 'from-blue-500 to-indigo-600',
    fields: ['an_3', 'an_4_1', 'an_4_2']
  },
  '❤️ 1.5 CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['an_5_1', 'an_5_2', 'an_5_3']
  },
  '💊 Pain 1: จำนวนครั้ง': {
    icon: Pill,
    color: 'from-purple-500 to-violet-600',
    fields: ['an_h2_1_1', 'an_h2_1_2', 'an_h2_1_3']
  },
  '📋 Pain 2: ชนิดความปวด': {
    icon: ClipboardList,
    color: 'from-indigo-500 to-blue-600',
    fields: ['an_h2_2_1', 'an_h2_2_2', 'an_h2_2_3']
  },
  '✅ Pain 3: ความครบถ้วน': {
    icon: ClipboardList,
    color: 'from-emerald-500 to-green-600',
    fields: ['an_h2_3_1', 'an_h2_3_2', 'an_h2_3_3']
  },
  '✅ 3.1 เตรียมความพร้อม': {
    icon: ClipboardList,
    color: 'from-teal-500 to-cyan-600',
    fields: ['an_h3_1_1', 'an_h3_1_2', 'an_h3_1_3']
  },
  '🚨 3.2 ความปลอดภัย': {
    icon: Shield,
    color: 'from-red-500 to-rose-600',
    fields: ['an_h3_2_1', 'an_h3_2_2', 'an_h3_2_3', 'an_h3_2_4']
  },
  '🏥 3.3 เฝ้าระวังอาการ': {
    icon: Bed,
    color: 'from-cyan-500 to-blue-600',
    fields: ['an_h3_3_1', 'an_h3_3_2', 'an_h3_3_3']
  },
  '🔍 3.4 Recovery Room': {
    icon: Bed,
    color: 'from-teal-500 to-cyan-600',
    fields: ['an_h3_4_1', 'an_h3_4_2', 'an_h3_4_3']
  },
  '📝 3.5 อธิบายเหตุผล': {
    icon: Users,
    color: 'from-indigo-500 to-blue-600',
    fields: ['an_h3_5_1', 'an_h3_5_2', 'an_h3_5_3']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// LR Field Categories - เหมือนหน้า User
const LR_FIELD_CATEGORIES: Record<string, CategoryConfig> = {
  '🛡️ 1. ความปลอดภัยและความพึงพอใจ': {
    icon: Shield,
    color: 'from-pink-500 to-rose-600',
    fields: ['lr_1_1', 'lr_1_2', 'lr_1_3', 'lr_1_4', 'lr_1_5', 'lr_1_6', 'lr_1_6_1', 'lr_1_6_2', 'lr_1_6_3', 'lr_1_6_4', 'lr_1_6_5', 'lr_1_7', 'lr_1_8', 'lr_1_9', 'lr_1_10']
  },
  '📊 2. Production & Productivity': {
    icon: TrendingUp,
    color: 'from-emerald-500 to-green-600',
    fields: ['lr_2_1', 'lr_2_2', 'lr_2_3', 'lr_2_4', 'lr_2_5', 'lr_2_6', 'lr_2_productivity']
  },
  '🌙 4. Oncall': {
    icon: Clock,
    color: 'from-blue-500 to-indigo-600',
    fields: ['lr_3']
  },
  '🎯 5. ตาย/Unplan ICU': {
    icon: AlertTriangle,
    color: 'from-rose-500 to-red-600',
    fields: ['lr_4_1', 'lr_4_2']
  },
  '❤️ 6. CPR': {
    icon: Activity,
    color: 'from-red-600 to-rose-700',
    fields: ['lr_5_1', 'lr_5_2', 'lr_5_3']
  },
  '🚨 7. SOS (เฝ้าระวังอาการ)': {
    icon: AlertTriangle,
    color: 'from-orange-500 to-amber-600',
    fields: ['lr_6_1', 'lr_6_2', 'lr_6_3', 'lr_6_4', 'lr_6_5']
  },
  '💊 Pain 1: จำนวนครั้ง': {
    icon: Pill,
    color: 'from-purple-500 to-violet-600',
    fields: ['lr_pm_1', 'lr_pm_1_1', 'lr_pm_1_2']
  },
  '📋 Pain 2: ชนิดความปวด': {
    icon: ClipboardList,
    color: 'from-indigo-500 to-blue-600',
    fields: ['lr_pm_2_1', 'lr_pm_2_2', 'lr_pm_2_3']
  },
  '✅ Pain 3: ความครบถ้วน': {
    icon: ClipboardList,
    color: 'from-emerald-500 to-green-600',
    fields: ['lr_pm_3', 'lr_pm_3_1', 'lr_pm_3_2', 'lr_pm_3_3']
  },
  '🏥 หัวตี้ 2: ปริการคลอด': {
    icon: Baby,
    color: 'from-rose-400 to-pink-500',
    fields: ['lr_h2_1', 'lr_h2_1_1', 'lr_h2_1_2', 'lr_h2_1_3', 'lr_h2_1_4', 'lr_h2_1_5', 'lr_h2_1_6', 'lr_h2_1_6_1', 'lr_h2_1_6_2', 'lr_h2_1_6_3', 'lr_h2_1_7', 'lr_h2_1_8', 'lr_h2_2', 'lr_h2_3_1', 'lr_h2_3_2', 'lr_h2_3_3', 'lr_h2_4']
  },
  '📝 หมายเหตุ': {
    icon: FileText,
    color: 'from-slate-500 to-gray-600',
    fields: ['note']
  }
};

// ================= Helper Functions =================

function getFieldCategoriesForDepartment(departmentId: string): Record<string, CategoryConfig> {
  if (departmentId.startsWith('OPD')) return OPD_FIELD_CATEGORIES;
  if (departmentId === 'SPECIAL001') return OR_FIELD_CATEGORIES;
  if (departmentId === 'SPECIAL002') return ER_FIELD_CATEGORIES;
  if (departmentId === 'SPECIAL003') return ANESTH_FIELD_CATEGORIES;
  if (departmentId === 'SPECIAL004') return LR_FIELD_CATEGORIES;
  return IPD_FIELD_CATEGORIES;
}

function getDepartmentTypeInfo(departmentId: string) {
  if (departmentId.startsWith('OPD')) {
    return { label: 'OPD', color: 'text-emerald-700', bgColor: 'bg-emerald-100', borderColor: 'border-emerald-300', gradient: 'from-emerald-500 via-teal-500 to-cyan-500', icon: Stethoscope, lightBg: 'bg-emerald-50' };
  }
  if (departmentId === 'SPECIAL001') {
    return { label: 'OR', color: 'text-purple-700', bgColor: 'bg-purple-100', borderColor: 'border-purple-300', gradient: 'from-purple-500 via-violet-500 to-indigo-500', icon: Scissors, lightBg: 'bg-purple-50' };
  }
  if (departmentId === 'SPECIAL002') {
    return { label: 'ER', color: 'text-red-700', bgColor: 'bg-red-100', borderColor: 'border-red-300', gradient: 'from-red-500 via-rose-500 to-pink-500', icon: Ambulance, lightBg: 'bg-red-50' };
  }
  if (departmentId === 'SPECIAL003') {
    return { label: 'Anesth', color: 'text-violet-700', bgColor: 'bg-violet-100', borderColor: 'border-violet-300', gradient: 'from-violet-500 via-purple-500 to-fuchsia-500', icon: Syringe, lightBg: 'bg-violet-50' };
  }
  if (departmentId === 'SPECIAL004') {
    return { label: 'LR', color: 'text-pink-700', bgColor: 'bg-pink-100', borderColor: 'border-pink-300', gradient: 'from-pink-500 via-rose-500 to-red-400', icon: Baby, lightBg: 'bg-pink-50' };
  }
  return { label: 'IPD', color: 'text-blue-700', bgColor: 'bg-blue-100', borderColor: 'border-blue-300', gradient: 'from-blue-500 via-indigo-500 to-purple-500', icon: Bed, lightBg: 'bg-blue-50' };
}

function countFilledFields(data: Record<string, string>): number {
  return Object.values(data).filter(v => v && v !== '' && v !== '-' && v !== '0').length;
}

// ================= Detail Modal =================
function DetailModal({
  record, fieldLabels, computedFields, computeFields, onClose, onSave, onDelete
}: {
  record: DepartmentData;
  fieldLabels: Record<string, string>;
  computedFields: Set<string>;
  computeFields: (fields: Record<string, string>, year: string, month: string) => Record<string, string>;
  onClose: () => void;
  onSave: (record: DepartmentData) => Promise<boolean>;
  onDelete: (record: DepartmentData) => Promise<boolean>;
}) {
  const [editedFields, setEditedFields] = useState<Record<string, string>>(record.data);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(new Set());

  const deptTypeInfo = useMemo(() => getDepartmentTypeInfo(record.departmentId), [record.departmentId]);
  const Icon = deptTypeInfo.icon;

  const baseCategories = useMemo(() => getFieldCategoriesForDepartment(record.departmentId), [record.departmentId]);

  // Build categories including ALL fields with data
  const fieldCategories = useMemo(() => {
    const result: Record<string, CategoryConfig> = {};
    const categorizedFields = new Set<string>();

    Object.entries(baseCategories).forEach(([catName, catConfig]) => {
      const fieldsWithData = catConfig.fields.filter(f => editedFields[f] !== undefined || fieldLabels[f]);
      if (fieldsWithData.length > 0) {
        result[catName] = { ...catConfig, fields: fieldsWithData };
        catConfig.fields.forEach(f => categorizedFields.add(f));
      }
    });

    // Add uncategorized fields that have data AND match this department type
    const uncategorizedFields: string[] = [];

    // Get valid field prefixes for this department type
    const getValidFieldPrefixes = (deptId: string): string[] => {
      if (deptId.startsWith('OPD')) return ['opd_', 'daysInMonth', 'note'];
      if (deptId === 'SPECIAL001') return ['or_', 'daysInMonth', 'note'];
      if (deptId === 'SPECIAL002') return ['er_', 'daysInMonth', 'note'];
      if (deptId === 'SPECIAL003') return ['an_', 'daysInMonth', 'note'];
      if (deptId === 'SPECIAL004') return ['lr_', 'daysInMonth', 'note'];
      // IPD (DEPT...)
      return ['s1_', 's2_', 's3_', 's4_', 's5_', 's6_', 's7_', 's8_', 's9_', 's10_', 's11_',
        'pressure', 'readmission', 'average', 'rn', 'aux', 'ratio', 'actual', 'productivity', 'daysInMonth', 'note'];
    };

    const validPrefixes = getValidFieldPrefixes(record.departmentId);

    Object.keys(editedFields).forEach(fieldId => {
      if (!categorizedFields.has(fieldId) && editedFields[fieldId]) {
        // Check if this field is valid for this department type
        const isValidForDepartment = validPrefixes.some(prefix =>
          fieldId.startsWith(prefix) || fieldId === prefix
        );
        if (isValidForDepartment) {
          uncategorizedFields.push(fieldId);
        }
      }
    });

    if (uncategorizedFields.length > 0) {
      result['📦 ข้อมูลอื่นๆ'] = { icon: FolderOpen, color: 'from-gray-500 to-slate-600', fields: uncategorizedFields };
    }

    return result;
  }, [baseCategories, editedFields, fieldLabels]);

  useEffect(() => {
    setExpandedCategories(new Set(Object.keys(fieldCategories)));
  }, [fieldCategories]);

  const toggleCategory = (category: string) => {
    setExpandedCategories(prev => {
      const next = new Set(prev);
      if (next.has(category)) next.delete(category);
      else next.add(category);
      return next;
    });
  };

  const handleFieldChange = (fieldId: string, value: string) => {
    setEditedFields(prev => {
      const updated = { ...prev, [fieldId]: value };
      return computeFields(updated, record.fiscalYear, record.month);
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    const success = await onSave({ ...record, data: editedFields });
    setIsSaving(false);
    if (success) setIsEditing(false);
  };

  const handleDelete = async () => {
    const success = await onDelete(record);
    if (success) onClose();
  };

  const filledCount = countFilledFields(editedFields);
  const totalFields = Object.values(fieldCategories).reduce((sum, cat) => sum + cat.fields.length, 0);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      {/* Delete Confirmation */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/40">
          <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md">
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-gradient-to-br from-rose-100 to-red-100 rounded-2xl">
                <AlertTriangle className="w-8 h-8 text-rose-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-slate-800">ยืนยันการลบ</h3>
                <p className="text-slate-500 text-sm">การดำเนินการนี้ไม่สามารถย้อนกลับได้</p>
              </div>
            </div>
            <div className="p-4 bg-gradient-to-r from-rose-50 to-red-50 rounded-2xl mb-6 border border-rose-200">
              <p className="text-slate-700">
                ต้องการลบข้อมูลของ <strong className="text-rose-700">{record.departmentName}</strong>
                <br />เดือน <strong className="text-rose-700">{record.month} {record.fiscalYear}</strong> หรือไม่?
              </p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 px-6 py-3 border-2 border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-semibold">
                ยกเลิก
              </button>
              <button onClick={handleDelete} className="flex-1 px-6 py-3 bg-gradient-to-r from-rose-500 to-red-600 text-white rounded-xl hover:from-rose-600 hover:to-red-700 font-semibold shadow-lg shadow-rose-500/30">
                ยืนยันลบ
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl max-h-[92vh] overflow-hidden">
        {/* Header */}
        <div className={`relative px-8 py-6 bg-gradient-to-r ${deptTypeInfo.gradient}`}>
          <div className="absolute inset-0 bg-black/5" />
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />

          <div className="relative flex items-start justify-between">
            <div className="flex items-center gap-5">
              <div className="p-4 bg-white/20 backdrop-blur-sm rounded-2xl shadow-lg">
                <Icon className="w-8 h-8 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-2xl font-bold text-white">{record.departmentName}</h2>
                  <span className="px-3 py-1 rounded-full text-sm font-bold bg-white/25 text-white">{deptTypeInfo.label}</span>
                </div>
                <div className="flex items-center gap-4 text-white/80 text-sm">
                  <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />{record.month} {record.fiscalYear}</span>
                  <span className="w-1 h-1 rounded-full bg-white/50" />
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" />อัปเดต: {new Date(record.updatedAt).toLocaleDateString('th-TH')}</span>
                </div>
              </div>
            </div>
            <div className="px-5 py-3 bg-white/20 backdrop-blur-sm rounded-2xl text-center">
              <p className="text-xs text-white/70 mb-1">กรอกข้อมูล</p>
              <p className="text-2xl font-bold text-white">{filledCount}<span className="text-sm font-normal">/{totalFields}</span></p>
            </div>
          </div>
        </div>

        {/* Action Bar */}
        <div className="px-8 py-4 border-b border-slate-100 bg-gradient-to-r from-slate-50 to-white flex items-center justify-between">
          <div className="flex items-center gap-3 text-sm text-slate-500">
            <Layers className="w-4 h-4" />
            <span>{Object.keys(fieldCategories).length} หมวดหมู่</span>
            <span className="w-1 h-1 rounded-full bg-slate-300" />
            <span>{totalFields} รายการ</span>
          </div>
          <div className="flex items-center gap-2">
            {!isEditing ? (
              <>
                <button onClick={() => setIsEditing(true)} className={`inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r ${deptTypeInfo.gradient} text-white rounded-xl hover:opacity-90 shadow-lg font-medium`}>
                  <Edit className="w-4 h-4" />แก้ไขข้อมูล
                </button>
                <button onClick={() => setShowDeleteConfirm(true)} className="inline-flex items-center gap-2 px-5 py-2.5 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 font-medium">
                  <Trash2 className="w-4 h-4" />ลบ
                </button>
              </>
            ) : (
              <>
                <button onClick={() => { setEditedFields(record.data); setIsEditing(false); }} className="px-5 py-2.5 border-2 border-slate-200 rounded-xl text-slate-700 hover:bg-slate-50 font-medium">
                  ยกเลิก
                </button>
                <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 text-white rounded-xl hover:from-emerald-600 hover:to-green-700 disabled:opacity-50 shadow-lg shadow-emerald-500/30 font-medium">
                  {isSaving ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}บันทึกข้อมูล
                </button>
              </>
            )}
            <button onClick={onClose} className="p-2.5 hover:bg-slate-100 rounded-xl ml-2">
              <X className="w-5 h-5 text-slate-400" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(92vh-220px)]">
          <div className="space-y-4">
            {Object.entries(fieldCategories).map(([category, config]) => {
              const isExpanded = expandedCategories.has(category);
              const CategoryIcon = config.icon;
              const filledInCat = config.fields.filter(f => editedFields[f] && editedFields[f] !== '-').length;

              return (
                <div key={category} className="border border-slate-200 rounded-2xl overflow-hidden hover:shadow-lg transition-all">
                  <button onClick={() => toggleCategory(category)} className={`w-full px-5 py-4 flex items-center justify-between transition-all ${isExpanded ? `bg-gradient-to-r ${config.color} text-white` : 'bg-gradient-to-r from-slate-50 to-white hover:from-slate-100'}`}>
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-xl ${isExpanded ? 'bg-white/20' : 'bg-white shadow-sm'}`}>
                        <CategoryIcon className={`w-5 h-5 ${isExpanded ? 'text-white' : 'text-slate-600'}`} />
                      </div>
                      <span className={`font-semibold ${isExpanded ? 'text-white' : 'text-slate-700'}`}>{category}</span>
                      <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${isExpanded ? 'bg-white/20 text-white' : filledInCat === config.fields.length ? 'bg-emerald-100 text-emerald-700' : filledInCat > 0 ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-500'}`}>
                        {filledInCat}/{config.fields.length}
                      </span>
                    </div>
                    <ChevronDown className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180 text-white' : 'text-slate-400'}`} />
                  </button>

                  {isExpanded && (
                    <div className="p-5 bg-white grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {config.fields.map(fieldId => {
                        const label = fieldLabels[fieldId] || fieldId;
                        const isComputed = computedFields.has(fieldId);
                        const value = editedFields[fieldId] || '';
                        const hasValue = value && value !== '-';

                        return (
                          <div key={fieldId} className="space-y-2">
                            <label className="text-sm font-medium text-slate-600 flex items-center gap-2">
                              <Hash className="w-3 h-3 text-slate-400" />
                              {label}
                              {isComputed && <span className="px-2 py-0.5 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-700 rounded-full text-[10px] font-bold">AUTO</span>}
                            </label>
                            {isEditing && !isComputed ? (
                              <input type="text" value={value} onChange={(e) => handleFieldChange(fieldId, e.target.value)} className="w-full border-2 border-slate-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 hover:border-slate-300" placeholder="กรอกข้อมูล..." />
                            ) : (
                              <div className={`px-4 py-2.5 rounded-xl text-sm font-medium ${isComputed ? 'bg-gradient-to-r from-blue-50 to-indigo-50 text-blue-800 border-2 border-blue-200' : hasValue ? 'bg-slate-50 text-slate-800 border-2 border-slate-100' : 'bg-slate-50 text-slate-400 border-2 border-dashed border-slate-200'}`}>
                                {value || '-'}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {Object.keys(fieldCategories).length === 0 && (
              <div className="text-center py-16">
                <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Database className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-bold text-slate-700 mb-2">ไม่มีข้อมูล</h3>
                <p className="text-slate-500">ยังไม่มีข้อมูลสำหรับรายการนี้</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ================= Main Component =================
export default function DataManagement({
  allDepartmentsData, fieldLabels, computedFields, computeFields,
  departmentGroup = 'ipd', groupConfig, onSave, onDelete, onRefresh, loading = false
}: DataManagementProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [sortField, setSortField] = useState<SortField>('departmentName');
  const [sortOrder, setSortOrder] = useState<SortOrder>('asc');
  const [selectedRecord, setSelectedRecord] = useState<DepartmentData | null>(null);
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('cards');

  const departments = useMemo(() => {
    const deptSet = new Map<string, string>();
    allDepartmentsData.forEach(r => {
      if (!deptSet.has(r.departmentId)) deptSet.set(r.departmentId, r.departmentName);
    });
    return Array.from(deptSet.entries()).map(([id, name]) => ({ id, name }));
  }, [allDepartmentsData]);

  const filteredData = useMemo(() => {
    let result = allDepartmentsData;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(r => r.departmentName.toLowerCase().includes(query) || r.month.toLowerCase().includes(query));
    }
    if (selectedDepartment !== 'all') result = result.filter(r => r.departmentId === selectedDepartment);
    if (selectedMonth !== 'all') result = result.filter(r => r.month === selectedMonth);

    return [...result].sort((a, b) => {
      let comparison = 0;
      switch (sortField) {
        case 'departmentName': comparison = a.departmentName.localeCompare(b.departmentName, 'th'); break;
        case 'month': comparison = (MONTH_ORDER[a.month] || 0) - (MONTH_ORDER[b.month] || 0); break;
        case 'updatedAt': comparison = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
        case 'dataCount': comparison = countFilledFields(a.data) - countFilledFields(b.data); break;
      }
      return sortOrder === 'asc' ? comparison : -comparison;
    });
  }, [allDepartmentsData, searchQuery, selectedDepartment, selectedMonth, sortField, sortOrder]);

  const stats = useMemo(() => ({
    total: allDepartmentsData.length,
    uniqueDepts: new Set(allDepartmentsData.map(r => r.departmentId)).size
  }), [allDepartmentsData]);

  const handleSort = (field: SortField) => {
    if (sortField === field) setSortOrder(prev => prev === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortOrder('asc'); }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="relative w-20 h-20 mx-auto mb-6">
            <div className="absolute inset-0 border-4 border-indigo-200 rounded-full" />
            <div className="absolute inset-0 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
            <Sparkles className="w-8 h-8 text-indigo-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <p className="text-slate-500 font-medium">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-3">
            <div className={`p-2.5 rounded-xl ${groupConfig?.bgColor || 'bg-gradient-to-br from-indigo-100 to-purple-100'}`}>
              <Database className={`w-6 h-6 ${groupConfig?.textColor || 'text-indigo-600'}`} />
            </div>
            จัดการข้อมูล
          </h2>
          <p className="text-slate-500 mt-1">ดู แก้ไข และลบข้อมูล QA รายแผนก</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="px-5 py-3 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-2xl border border-indigo-100">
            <p className="text-xs text-indigo-600 font-medium">ทั้งหมด</p>
            <p className="text-2xl font-bold text-indigo-700">{stats.total}</p>
          </div>
          <div className="px-5 py-3 bg-gradient-to-br from-emerald-50 to-teal-50 rounded-2xl border border-emerald-100">
            <p className="text-xs text-emerald-600 font-medium">แผนก</p>
            <p className="text-2xl font-bold text-emerald-700">{stats.uniqueDepts}</p>
          </div>
          <button onClick={onRefresh} className="p-3.5 bg-white rounded-2xl border-2 border-slate-200 hover:border-indigo-300 hover:bg-indigo-50 shadow-sm" title="รีเฟรช">
            <RefreshCw className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input type="text" placeholder="ค้นหาแผนก หรือเดือน..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="w-full pl-12 pr-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500" />
          </div>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white min-w-[220px] font-medium">
            <option value="all">ทุกแผนก ({departments.length})</option>
            {departments.map(dept => <option key={dept.id} value={dept.id}>{dept.name}</option>)}
          </select>
          <select value={selectedMonth} onChange={(e) => setSelectedMonth(e.target.value)} className="px-4 py-3.5 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 bg-white min-w-[160px] font-medium">
            <option value="all">ทุกเดือน</option>
            {MONTHS_TH.map(month => <option key={month} value={month}>{month}</option>)}
          </select>
          <div className="flex items-center gap-1 p-1.5 bg-slate-100 rounded-xl">
            <button onClick={() => setViewMode('cards')} className={`p-3 rounded-lg ${viewMode === 'cards' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><Grid3X3 className="w-5 h-5" /></button>
            <button onClick={() => setViewMode('table')} className={`p-3 rounded-lg ${viewMode === 'table' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}><List className="w-5 h-5" /></button>
          </div>
        </div>

        {(searchQuery || selectedDepartment !== 'all' || selectedMonth !== 'all') && (
          <div className="flex items-center gap-2 mt-4 pt-4 border-t border-slate-100">
            <span className="text-sm text-slate-500">ตัวกรอง:</span>
            {searchQuery && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-sm font-medium">"{searchQuery}"<button onClick={() => setSearchQuery('')}><X className="w-3.5 h-3.5 ml-1" /></button></span>}
            {selectedDepartment !== 'all' && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-full text-sm font-medium">{departments.find(d => d.id === selectedDepartment)?.name}<button onClick={() => setSelectedDepartment('all')}><X className="w-3.5 h-3.5 ml-1" /></button></span>}
            {selectedMonth !== 'all' && <span className="inline-flex items-center gap-1 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-full text-sm font-medium">{selectedMonth}<button onClick={() => setSelectedMonth('all')}><X className="w-3.5 h-3.5 ml-1" /></button></span>}
            <button onClick={() => { setSearchQuery(''); setSelectedDepartment('all'); setSelectedMonth('all'); }} className="text-sm text-slate-500 hover:text-slate-700 ml-2 font-medium">ล้างทั้งหมด</button>
          </div>
        )}
      </div>

      {/* Results */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-500">พบ <span className="font-bold text-slate-700">{filteredData.length}</span> รายการ</p>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-slate-500">เรียงตาม:</span>
          {[{ field: 'departmentName' as SortField, label: 'ชื่อแผนก' }, { field: 'month' as SortField, label: 'เดือน' }, { field: 'updatedAt' as SortField, label: 'วันที่' }, { field: 'dataCount' as SortField, label: 'ข้อมูล' }].map(({ field, label }) => (
            <button key={field} onClick={() => handleSort(field)} className={`px-3 py-1.5 rounded-lg font-medium ${sortField === field ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-100 text-slate-600'}`}>
              {label} {sortField === field && (sortOrder === 'asc' ? '↑' : '↓')}
            </button>
          ))}
        </div>
      </div>

      {/* Cards View */}
      {viewMode === 'cards' ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredData.map(record => {
            const deptInfo = getDepartmentTypeInfo(record.departmentId);
            const Icon = deptInfo.icon;
            const filledFields = countFilledFields(record.data);

            return (
              <div key={record.id} onClick={() => setSelectedRecord(record)} className="group bg-white rounded-2xl border-2 border-slate-100 hover:border-indigo-200 p-5 cursor-pointer transition-all hover:shadow-xl hover:-translate-y-1">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-xl ${deptInfo.bgColor} group-hover:scale-110 transition-transform shadow-sm`}>
                      <Icon className={`w-5 h-5 ${deptInfo.color}`} />
                    </div>
                    <div>
                      <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${deptInfo.bgColor} ${deptInfo.color} mb-1`}>{deptInfo.label}</span>
                      <h3 className="font-semibold text-slate-800 group-hover:text-indigo-700 line-clamp-1">{record.departmentName}</h3>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-1 transition-all" />
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-500 flex items-center gap-1.5"><Calendar className="w-4 h-4" />{record.month}</span>
                    <span className="text-slate-400">{record.fiscalYear}</span>
                  </div>
                  <div className={`px-4 py-3 rounded-xl ${deptInfo.lightBg} border ${deptInfo.borderColor}`}>
                    <p className="text-xs text-slate-500 mb-1">ข้อมูลที่กรอก</p>
                    <p className={`text-xl font-bold ${deptInfo.color}`}>{filledFields} <span className="text-sm font-normal text-slate-400">รายการ</span></p>
                  </div>
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3.5 h-3.5" />{new Date(record.updatedAt).toLocaleDateString('th-TH')}</span>
                    <span className="text-xs font-medium text-indigo-600 opacity-0 group-hover:opacity-100">คลิกเพื่อดู →</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-slate-50 to-slate-100">
                <tr>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">แผนก</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ประเภท</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">เดือน</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">ข้อมูล</th>
                  <th className="px-6 py-4 text-left text-sm font-semibold text-slate-700">อัปเดต</th>
                  <th className="px-6 py-4 text-right text-sm font-semibold text-slate-700">การกระทำ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredData.map(record => {
                  const deptInfo = getDepartmentTypeInfo(record.departmentId);
                  const Icon = deptInfo.icon;
                  return (
                    <tr key={record.id} className="hover:bg-slate-50">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${deptInfo.bgColor}`}><Icon className={`w-4 h-4 ${deptInfo.color}`} /></div>
                          <span className="font-medium text-slate-800">{record.departmentName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-xs font-bold ${deptInfo.bgColor} ${deptInfo.color}`}>{deptInfo.label}</span></td>
                      <td className="px-6 py-4 text-slate-600">{record.month} {record.fiscalYear}</td>
                      <td className="px-6 py-4"><span className={`font-bold ${deptInfo.color}`}>{countFilledFields(record.data)}</span><span className="text-slate-400 text-sm ml-1">รายการ</span></td>
                      <td className="px-6 py-4 text-sm text-slate-500">{new Date(record.updatedAt).toLocaleDateString('th-TH')}</td>
                      <td className="px-6 py-4">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setSelectedRecord(record)} className="p-2.5 hover:bg-indigo-50 rounded-lg text-slate-400 hover:text-indigo-600" title="ดูรายละเอียด"><Eye className="w-4 h-4" /></button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty State */}
      {filteredData.length === 0 && (
        <div className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-16 text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-slate-100 to-slate-200 rounded-full flex items-center justify-center mx-auto mb-6">
            <Database className="w-10 h-10 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-700 mb-2">ไม่พบข้อมูล</h3>
          <p className="text-slate-500 mb-6">{searchQuery || selectedDepartment !== 'all' || selectedMonth !== 'all' ? 'ลองปรับตัวกรองเพื่อดูข้อมูลเพิ่มเติม' : 'ยังไม่มีข้อมูลในระบบ'}</p>
          {(searchQuery || selectedDepartment !== 'all' || selectedMonth !== 'all') && (
            <button onClick={() => { setSearchQuery(''); setSelectedDepartment('all'); setSelectedMonth('all'); }} className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-xl hover:from-indigo-600 hover:to-purple-700 shadow-lg font-medium">
              <X className="w-4 h-4" />ล้างตัวกรอง
            </button>
          )}
        </div>
      )}

      {/* Modal */}
      {selectedRecord && (
        <DetailModal record={selectedRecord} fieldLabels={fieldLabels} computedFields={computedFields} computeFields={computeFields} onClose={() => setSelectedRecord(null)} onSave={onSave} onDelete={onDelete} />
      )}
    </div>
  );
}
