'use client';

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ComposedChart,
  RadialBarChart,
  RadialBar
} from 'recharts';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  Clock,
  Shield,
  Heart,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Calendar,
  Building2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  ChevronRight,
  Target,
  Gauge,
  FileText,
  Bed,
  Stethoscope,
  Syringe,
  Thermometer,
  HeartPulse,
  Skull,
  Baby,
  Scissors,
  Ambulance,
  Pill,
  Filter,
  X,
  Search
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
  icon: React.ElementType;
}

interface AdminDashboardProps {
  allDepartmentsData: DepartmentData[];
  fiscalYear: string;
  onYearChange: (year: string) => void;
  onRefresh: () => void;
  loading?: boolean;
  departmentGroup?: string;
  groupConfig?: GroupConfig | null;
}

interface StatCard {
  title: string;
  value: string;
  unit: string;
  icon: React.ElementType;
  color: string;
  bgColor: string;
  threshold?: { good: number; warning: number };
  lowerIsBetter?: boolean;
}

// ================= Constants =================
const MONTHS_TH = [
  'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม', 'มกราคม', 'กุมภาพันธ์', 'มีนาคม',
  'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน'
];

const FISCAL_YEARS = ['2568', '2569', '2570', '2571', '2572'];

// Department names mapping
const DEPARTMENT_NAMES: Record<string, string> = {
  // IPD
  'DEPT001': 'หอผู้ป่วยอายุรกรรมชาย',
  'DEPT002': 'หอผู้ป่วยอายุรกรรมหญิง',
  'DEPT003': 'หอผู้ป่วยจิตเวช',
  'DEPT004': 'หอผู้ป่วยพิเศษรวมน้ำใจ',
  'DEPT005': 'หอผู้ป่วยศัลยกรรมชาย',
  'DEPT006': 'หอผู้ป่วยศัลยกรรมหญิง',
  'DEPT007': 'ICU-MED ชั้น 1',
  'DEPT008': 'ICU-MED ชั้น 2',
  'DEPT009': 'หอผู้ป่วยกระดูกและข้อ',
  'DEPT010': 'หอผู้ป่วยพิเศษอายุรกรรมชั้น4',
  'DEPT011': 'หอผู้ป่วยพิเศษศัลยกรรมชั้น4',
  'DEPT012': 'หอผู้ป่วยกุมารเวช',
  'DEPT013': 'หอผู้ป่วยอภิบาลสงฆ์',
  'DEPT014': 'หอผู้ป่วยโสต ศอ นาสิก',
  'DEPT015': 'หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น5',
  'DEPT016': 'หอผู้ป่วยพิเศษสูติ-นรีเวช ชั้น4',
  'DEPT017': 'หอผู้ป่วยพิเศษกุมารเวช',
  'DEPT018': 'หอผู้ป่วยศัลยกรรมระบบประสาทและสมอง',
  'DEPT019': 'NICU',
  'DEPT020': 'หอผู้ป่วยสูติ-นรีเวช (PP)',
  'DEPT021': 'ICU รวม',
  // Special Units
  'SPECIAL001': 'ห้องผ่าตัด (OR)',
  'SPECIAL002': 'ห้องอุบัติเหตุฉุกเฉิน (ER)',
  'SPECIAL003': 'วิสัญญีพยาบาล (Anesth)',
  'SPECIAL004': 'ห้องคลอด (LR)',
  // OPD
  'OPD001': 'OPD ศัลยกรรม',
  'OPD002': 'OPD กุมารเวช',
  'OPD003': 'OPD (Med+GP+Ortho+หัวใจ+พิเศษ)',
  'OPD004': 'OPD ANC',
  'OPD005': 'OPD Uro',
  'OPD006': 'OPD Neuro',
  'OPD007': 'OPD จักษุ',
  'OPD008': 'OPD ENT',
  'OPD009': 'OPD DM/HT',
  'OPD010': 'OPD CAPD'
};

// Field mappings by group - These must match the actual field names in saved data
// Check computeFields() and section configs in page.tsx for exact field names
const GROUP_FIELD_MAPPINGS: Record<string, {
  productivity: string;
  los: string;
  pressureUlcer: string;
  incidents: string[];
  cprSuccess: string;
  satisfaction: string;
  readmission: string;
  // Additional fields for specific stats display
  additionalStats?: {
    [key: string]: { field: string; label: string; unit: string };
  };
}> = {
  ipd: {
    productivity: 'productivityValue',          // Computed: ((b * hppd * 100) / rnHr) -> "100.00%"
    los: 'averageLOS',                          // Computed: s3_1 / daysInMonth -> "0.13"
    pressureUlcer: 'pressureUlcerRate',         // Computed: (s1_6_1 / s1_6_4) * 1000 -> "1000.00"
    incidents: [
      's1_1', 's1_2', 's1_3', 's1_4', 's1_5',   // Main safety incidents
      's1_7', 's1_8', 's1_9', 's1_10',          // Other incidents
      's2_1'                                     // Readmission cases
    ],
    cprSuccess: 's11_3_rate',                   // Computed: (s11_3_1 / s11_3_2) * 100 -> "75.00%"
    satisfaction: 's8_3',                       // SOS Score - satisfaction field
    readmission: 'readmissionRate'              // Computed: (s2_1 / s2_2) * 100 -> "100.00%"
  },
  special: {
    // Special units have varied fields depending on which unit (OR, ER, Anesth, LR)
    productivity: 'or_2_3',                     // OR satisfaction/productivity rate -> "0.00%"
    los: '',
    pressureUlcer: 'lr_1_6_5',                  // LR pressure ulcer rate (only LR has this)
    incidents: [
      // OR incidents
      'or_1_1', 'or_1_2', 'or_1_3', 'or_1_4', 'or_1_5', 'or_1_6', 'or_1_7', 'or_1_8', 'or_1_9',
      // ER incidents  
      'er_1_1', 'er_1_2', 'er_1_3', 'er_1_4', 'er_1_5', 'er_1_6', 'er_1_7', 'er_1_8', 'er_1_9',
      // Anesth incidents
      'an_1_1', 'an_1_2', 'an_1_3', 'an_1_4', 'an_1_5', 'an_1_6', 'an_1_7', 'an_1_8', 'an_1_9',
      // LR incidents
      'lr_1_1', 'lr_1_2', 'lr_1_3', 'lr_1_4', 'lr_1_5'
    ],
    cprSuccess: 'er_h3_3_3',                    // ER patient transfer success -> "0.00%"
    satisfaction: 'or_h2_3_3',                  // OR post-op assessment -> "0.00%"
    readmission: ''
  },
  opd: {
    productivity: '',                           // OPD doesn't track productivity in same way
    los: '',                                    // OPD doesn't have LOS
    pressureUlcer: '',                          // OPD doesn't track pressure ulcers
    incidents: [
      'opd_1_1', 'opd_1_2', 'opd_1_3', 'opd_1_4', 'opd_1_5', 'opd_1_6',  // Safety incidents
      'opd_2',                                  // Unexpected death
      'opd_3',                                  // Staff accidents
      'opd_4',                                  // Expired medications
      'opd_5_1', 'opd_5_2'                      // Unexpected death & Unplan ICU
    ],
    cprSuccess: 'opd_cpr_rate',                 // Computed: (opd_cpr_3 / opd_cpr_2) * 100 -> "100.00%"
    satisfaction: 'opd_pain_3_result',          // Pain management documentation -> "1.00%"
    readmission: ''
  }
};

// Colors
const COLORS = {
  primary: '#6366F1',
  success: '#10B981',
  warning: '#F59E0B',
  danger: '#EF4444',
  purple: '#8B5CF6',
  blue: '#3B82F6',
  pink: '#EC4899',
  teal: '#14B8A6'
};

const PIE_COLORS = ['#6366F1', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#3B82F6'];

// ================= Utility Functions =================
const parseNumeric = (val: string | undefined): number => {
  if (!val) return 0;
  // Remove % symbol and any other non-numeric characters except . and -
  const cleaned = String(val).replace(/%/g, '').replace(/[^0-9.-]/g, '');
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const formatNumber = (num: number, decimals: number = 2): string => {
  return num.toFixed(decimals);
};

const getStatusColor = (value: number, thresholds: { good: number; warning: number }, higherIsBetter: boolean = true): string => {
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'text-emerald-600';
    if (value >= thresholds.warning) return 'text-amber-600';
    return 'text-rose-600';
  } else {
    if (value <= thresholds.good) return 'text-emerald-600';
    if (value <= thresholds.warning) return 'text-amber-600';
    return 'text-rose-600';
  }
};

const getStatusBgColor = (value: number, thresholds: { good: number; warning: number }, higherIsBetter: boolean = true): string => {
  if (higherIsBetter) {
    if (value >= thresholds.good) return 'bg-emerald-50 border-emerald-200';
    if (value >= thresholds.warning) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  } else {
    if (value <= thresholds.good) return 'bg-emerald-50 border-emerald-200';
    if (value <= thresholds.warning) return 'bg-amber-50 border-amber-200';
    return 'bg-rose-50 border-rose-200';
  }
};

// ================= Main Component =================
export default function AdminDashboard({
  allDepartmentsData,
  fiscalYear,
  onYearChange,
  onRefresh,
  loading = false,
  departmentGroup = 'ipd',
  groupConfig
}: AdminDashboardProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  const [showDeptDropdown, setShowDeptDropdown] = useState(false);
  const [deptSearchQuery, setDeptSearchQuery] = useState('');
  const [expandedSections, setExpandedSections] = useState<Record<string, boolean>>({
    overview: true,
    kpi: true,
    trends: true,
    safety: true,
    departments: true,
    completion: true,
    departmentDetail: true
  });

  const toggleSection = (section: string) => {
    setExpandedSections(prev => ({ ...prev, [section]: !prev[section] }));
  };

  // Get field mappings for current group
  const fieldMapping = GROUP_FIELD_MAPPINGS[departmentGroup] || GROUP_FIELD_MAPPINGS.ipd;

  // Get unique departments in current data
  const availableDepartments = useMemo(() => {
    const deptMap = new Map<string, string>();
    allDepartmentsData.forEach(d => {
      if (!deptMap.has(d.departmentId)) {
        deptMap.set(d.departmentId, d.departmentName || DEPARTMENT_NAMES[d.departmentId] || d.departmentId);
      }
    });
    return Array.from(deptMap.entries())
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'));
  }, [allDepartmentsData]);

  // Filter departments by search
  const filteredDepartments = useMemo(() => {
    if (!deptSearchQuery) return availableDepartments;
    const query = deptSearchQuery.toLowerCase();
    return availableDepartments.filter(d =>
      d.name.toLowerCase().includes(query) || d.id.toLowerCase().includes(query)
    );
  }, [availableDepartments, deptSearchQuery]);

  // Reset department selection when group changes
  useEffect(() => {
    setSelectedDepartment('all');
  }, [departmentGroup]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    let data = allDepartmentsData;

    // Filter by month
    if (selectedMonth !== 'all') {
      data = data.filter(d => d.month === selectedMonth);
    }

    // Filter by department
    if (selectedDepartment !== 'all') {
      data = data.filter(d => d.departmentId === selectedDepartment);
    }

    return data;
  }, [allDepartmentsData, selectedMonth, selectedDepartment]);

  // Calculate statistics
  // Calculate statistics
  const stats = useMemo(() => {
    const totalRecords = filteredData.length;
    const uniqueDepts = new Set(filteredData.map(d => d.departmentId)).size;

    let avgProductivity = 0;
    let avgLOS = 0;
    let totalIncidents = 0;
    let avgSatisfaction = 0;
    let cprSuccessRate = 0;
    let pressureUlcerRate = 0;
    let avgReadmissionRate = 0;

    // OPD-specific individual incident counts
    let opdWrongPatientId = 0;      // opd_1_1
    let opdWrongTreatment = 0;      // opd_1_2
    let opdUnexpectedDeath = 0;     // opd_2
    let opdStaffAccidents = 0;      // opd_3

    // IPD-specific individual incident counts
    let ipdWrongPatientId = 0;      // s1_1
    let ipdWrongTreatment = 0;      // s1_2
    let ipdUnexpectedDeath = 0;     // s1_5

    // Special Unit specific incident counts
    // OR
    let specialOrWrongPatient = 0, specialOrUnexpectedDeath = 0, specialOrPtDeath = 0;
    let specialOrStaffAccident = 0, specialOrWrongSurgery = 0, specialOrForeignBody = 0;
    // ER
    let specialErWrongPatient = 0, specialErUnexpectedDeath = 0, specialErPtDeath = 0;
    let specialErCprTotal = 0, specialErCprSuccess = 0, specialErReadmission48hr = 0;
    // Anesth
    let specialAnWrongPatient = 0, specialAnUnexpectedDeath = 0, specialAnPtDeath = 0;
    let specialAnStaffAccident = 0, specialAnAspiration = 0, specialAnDrugAllergy = 0;
    let specialAnIntubationError = 0, specialAnOrDeath = 0;
    // LR
    let specialLrWrongPatient = 0, specialLrUnexpectedDeath = 0, specialLrPtDeath = 0;
    let specialLrStaffAccident = 0;

    if (filteredData.length > 0) {
      // Productivity
      if (fieldMapping.productivity) {
        const prodValues = filteredData.map(d => parseNumeric(d.data[fieldMapping.productivity])).filter(v => v > 0);
        avgProductivity = prodValues.length > 0 ? prodValues.reduce((a, b) => a + b, 0) / prodValues.length : 0;
      }

      // LOS
      if (fieldMapping.los) {
        const losValues = filteredData.map(d => parseNumeric(d.data[fieldMapping.los])).filter(v => v > 0);
        avgLOS = losValues.length > 0 ? losValues.reduce((a, b) => a + b, 0) / losValues.length : 0;
      }

      // Incidents
      if (fieldMapping.incidents.length > 0) {
        totalIncidents = filteredData.reduce((sum, d) => {
          return sum + fieldMapping.incidents.reduce((s, f) => s + parseNumeric(d.data[f]), 0);
        }, 0);
      }

      // OPD-specific incident breakdown
      if (departmentGroup === 'opd') {
        opdWrongPatientId = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['opd_1_1']), 0);
        opdWrongTreatment = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['opd_1_2']), 0);
        opdUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['opd_2']), 0);
        opdStaffAccidents = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['opd_3']), 0);
      }

      // IPD-specific incident breakdown
      if (departmentGroup === 'ipd') {
        ipdWrongPatientId = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['s1_1']), 0);
        ipdWrongTreatment = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['s1_2']), 0);
        ipdUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['s1_5']), 0);

        // Readmission Rate average
        const readmissionValues = filteredData.map(d => parseNumeric(d.data['readmissionRate'])).filter(v => v >= 0);
        avgReadmissionRate = readmissionValues.length > 0 ? readmissionValues.reduce((a, b) => a + b, 0) / readmissionValues.length : 0;
      }

      // Special Unit specific incident breakdown
      if (departmentGroup === 'special') {
        // OR specific metrics
        specialOrWrongPatient = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_1']), 0);
        specialOrUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_5']), 0);
        specialOrPtDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_4_1']), 0);
        specialOrStaffAccident = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_7']), 0);
        specialOrWrongSurgery = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_3']), 0);
        specialOrForeignBody = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_4']), 0);

        // ER specific metrics
        specialErWrongPatient = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_1_1']), 0);
        specialErUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_1_5']), 0);
        specialErPtDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_4_1']), 0);
        specialErCprTotal = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_5_2']), 0);
        specialErCprSuccess = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_5_3']), 0);
        specialErReadmission48hr = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['er_h3_4']), 0);

        // Anesth specific metrics
        specialAnWrongPatient = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_1']), 0);
        specialAnUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_5']), 0);
        specialAnPtDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_4_1']), 0);
        specialAnStaffAccident = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_7']), 0);
        specialAnAspiration = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_h3_2_1']), 0);
        specialAnDrugAllergy = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_h3_2_3']), 0);
        specialAnIntubationError = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_h3_2_2']), 0);
        specialAnOrDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['an_h3_2_4']), 0);

        // LR specific metrics
        specialLrWrongPatient = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_1']), 0);
        specialLrUnexpectedDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_5']), 0);
        specialLrPtDeath = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['lr_4_1']), 0);
        specialLrStaffAccident = filteredData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_7']), 0);
      }

      // Satisfaction
      if (fieldMapping.satisfaction) {
        const satValues = filteredData.map(d => parseNumeric(d.data[fieldMapping.satisfaction])).filter(v => v > 0);
        avgSatisfaction = satValues.length > 0 ? satValues.reduce((a, b) => a + b, 0) / satValues.length : 0;
      }

      // CPR Success
      if (fieldMapping.cprSuccess) {
        const cprValues = filteredData.map(d => parseNumeric(d.data[fieldMapping.cprSuccess])).filter(v => v > 0);
        cprSuccessRate = cprValues.length > 0 ? cprValues.reduce((a, b) => a + b, 0) / cprValues.length : 0;
      }

      // Pressure Ulcer
      if (fieldMapping.pressureUlcer) {
        const puValues = filteredData.map(d => parseNumeric(d.data[fieldMapping.pressureUlcer])).filter(v => v >= 0);
        pressureUlcerRate = puValues.length > 0 ? puValues.reduce((a, b) => a + b, 0) / puValues.length : 0;
      }
    }

    return {
      totalRecords,
      uniqueDepts,
      avgProductivity,
      avgLOS,
      totalIncidents,
      avgSatisfaction,
      cprSuccessRate,
      pressureUlcerRate,
      avgReadmissionRate,
      // OPD-specific
      opdWrongPatientId,
      opdWrongTreatment,
      opdUnexpectedDeath,
      opdStaffAccidents,
      // IPD-specific
      ipdWrongPatientId,
      ipdWrongTreatment,
      ipdUnexpectedDeath,
      // Special Unit - OR
      specialOrWrongPatient,
      specialOrUnexpectedDeath,
      specialOrPtDeath,
      specialOrStaffAccident,
      specialOrWrongSurgery,
      specialOrForeignBody,
      // Special Unit - ER
      specialErWrongPatient,
      specialErUnexpectedDeath,
      specialErPtDeath,
      specialErCprTotal,
      specialErCprSuccess,
      specialErReadmission48hr,
      // Special Unit - Anesth
      specialAnWrongPatient,
      specialAnUnexpectedDeath,
      specialAnPtDeath,
      specialAnStaffAccident,
      specialAnAspiration,
      specialAnDrugAllergy,
      specialAnIntubationError,
      specialAnOrDeath,
      // Special Unit - LR
      specialLrWrongPatient,
      specialLrUnexpectedDeath,
      specialLrPtDeath,
      specialLrStaffAccident
    };
  }, [filteredData, fieldMapping, departmentGroup]);

  // Monthly trend data
  const monthlyTrends = useMemo(() => {
    // Use filtered data (by department if selected)
    const dataToUse = selectedDepartment !== 'all'
      ? allDepartmentsData.filter(d => d.departmentId === selectedDepartment)
      : allDepartmentsData;

    return MONTHS_TH.map(month => {
      const monthData = dataToUse.filter(d => d.month === month);

      let productivity = 0;
      let los = 0;
      let incidents = 0;

      // Special Unit specific metrics per month
      let wrongPatient = 0;
      let wrongTreatment = 0;
      let unexpectedDeath = 0;
      let ptDeath = 0;
      let staffAccident = 0;
      let cprSuccess = 0;
      let cprTotal = 0;

      if (monthData.length > 0) {
        if (fieldMapping.productivity) {
          const prodValues = monthData.map(d => parseNumeric(d.data[fieldMapping.productivity])).filter(v => v > 0);
          productivity = prodValues.length > 0 ? prodValues.reduce((a, b) => a + b, 0) / prodValues.length : 0;
        }

        if (fieldMapping.los) {
          const losValues = monthData.map(d => parseNumeric(d.data[fieldMapping.los])).filter(v => v > 0);
          los = losValues.length > 0 ? losValues.reduce((a, b) => a + b, 0) / losValues.length : 0;
        }

        incidents = monthData.reduce((sum, d) => {
          return sum + fieldMapping.incidents.reduce((s, f) => s + parseNumeric(d.data[f]), 0);
        }, 0);

        // Calculate Special Unit specific metrics based on selected department
        if (departmentGroup === 'special') {
          if (selectedDepartment === 'SPECIAL001') { // OR
            wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_1']), 0);
            unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_5']), 0);
            ptDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['or_4_1']), 0);
            staffAccident = monthData.reduce((sum, d) => sum + parseNumeric(d.data['or_1_7']), 0);
          } else if (selectedDepartment === 'SPECIAL002') { // ER
            wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_1_1']), 0);
            unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_1_5']), 0);
            ptDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_4_1']), 0);
            cprTotal = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_5_2']), 0);
            cprSuccess = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_5_3']), 0);
          } else if (selectedDepartment === 'SPECIAL003') { // Anesth
            wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_1']), 0);
            unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_5']), 0);
            ptDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['an_4_1']), 0);
            staffAccident = monthData.reduce((sum, d) => sum + parseNumeric(d.data['an_1_7']), 0);
          } else if (selectedDepartment === 'SPECIAL004') { // LR
            wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_1']), 0);
            unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_5']), 0);
            ptDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['lr_4_1']), 0);
            staffAccident = monthData.reduce((sum, d) => sum + parseNumeric(d.data['lr_1_7']), 0);
          } else { // all - sum across all units
            wrongPatient = monthData.reduce((sum, d) => sum +
              parseNumeric(d.data['or_1_1']) + parseNumeric(d.data['er_1_1']) +
              parseNumeric(d.data['an_1_1']) + parseNumeric(d.data['lr_1_1']), 0);
            unexpectedDeath = monthData.reduce((sum, d) => sum +
              parseNumeric(d.data['or_1_5']) + parseNumeric(d.data['er_1_5']) +
              parseNumeric(d.data['an_1_5']) + parseNumeric(d.data['lr_1_5']), 0);
            ptDeath = monthData.reduce((sum, d) => sum +
              parseNumeric(d.data['or_4_1']) + parseNumeric(d.data['er_4_1']) +
              parseNumeric(d.data['an_4_1']) + parseNumeric(d.data['lr_4_1']), 0);
            cprSuccess = monthData.reduce((sum, d) => sum + parseNumeric(d.data['er_5_3']), 0);
          }
        }

        // IPD specific incident breakdown
        if (departmentGroup === 'ipd') {
          wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['s1_1']), 0);
          wrongTreatment = monthData.reduce((sum, d) => sum + parseNumeric(d.data['s1_2']), 0);
          unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['s1_5']), 0);
        }

        // OPD specific incident breakdown
        if (departmentGroup === 'opd') {
          wrongPatient = monthData.reduce((sum, d) => sum + parseNumeric(d.data['opd_1_1']), 0);
          wrongTreatment = monthData.reduce((sum, d) => sum + parseNumeric(d.data['opd_1_2']), 0);
          unexpectedDeath = monthData.reduce((sum, d) => sum + parseNumeric(d.data['opd_2']), 0);
          staffAccident = monthData.reduce((sum, d) => sum + parseNumeric(d.data['opd_3']), 0);
        }
      }

      return {
        month: month.substring(0, 3),
        monthFull: month,
        productivity: parseFloat(productivity.toFixed(2)),
        los: parseFloat(los.toFixed(2)),
        incidents,
        records: monthData.length,
        // Special Unit metrics
        wrongPatient,
        wrongTreatment,
        unexpectedDeath,
        ptDeath,
        staffAccident,
        cprSuccess,
        cprTotal
      };
    });
  }, [allDepartmentsData, selectedDepartment, fieldMapping, departmentGroup]);

  // Department ranking (only when viewing all departments)
  const departmentRanking = useMemo(() => {
    if (selectedDepartment !== 'all') return [];

    const deptMap = new Map<string, { name: string; values: number[] }>();

    allDepartmentsData.forEach(d => {
      if (!deptMap.has(d.departmentId)) {
        deptMap.set(d.departmentId, {
          name: d.departmentName || DEPARTMENT_NAMES[d.departmentId] || d.departmentId,
          values: []
        });
      }
      if (fieldMapping.productivity) {
        const val = parseNumeric(d.data[fieldMapping.productivity]);
        if (val > 0) {
          deptMap.get(d.departmentId)!.values.push(val);
        }
      }
    });

    return Array.from(deptMap.entries())
      .map(([id, data]) => ({
        id,
        name: data.name,
        avgValue: data.values.length > 0 ? data.values.reduce((a, b) => a + b, 0) / data.values.length : 0,
        records: data.values.length
      }))
      .sort((a, b) => b.avgValue - a.avgValue)
      .slice(0, 10);
  }, [allDepartmentsData, selectedDepartment, fieldMapping]);

  // Data completion matrix
  const completionMatrix = useMemo(() => {
    const dataToUse = selectedDepartment !== 'all'
      ? allDepartmentsData.filter(d => d.departmentId === selectedDepartment)
      : allDepartmentsData;

    const matrix: Record<string, Record<string, boolean>> = {};
    const depts = new Set<string>();

    dataToUse.forEach(d => {
      depts.add(d.departmentId);
      if (!matrix[d.departmentId]) {
        matrix[d.departmentId] = {};
      }
      matrix[d.departmentId][d.month] = true;
    });

    return { matrix, departments: Array.from(depts) };
  }, [allDepartmentsData, selectedDepartment]);

  // Get selected department info
  const selectedDeptInfo = useMemo(() => {
    if (selectedDepartment === 'all') return null;
    const dept = availableDepartments.find(d => d.id === selectedDepartment);
    return dept || null;
  }, [selectedDepartment, availableDepartments]);

  // Group-specific stat cards configuration
  const getStatCards = (): StatCard[] => {
    const baseCards = [
      {
        title: selectedDepartment === 'all' ? 'จำนวนแผนก' : 'จำนวนรายการ',
        value: selectedDepartment === 'all' ? stats.uniqueDepts.toString() : stats.totalRecords.toString(),
        unit: selectedDepartment === 'all' ? 'แผนก' : 'รายการ',
        icon: Building2,
        color: 'from-blue-500 to-indigo-600',
        bgColor: 'bg-blue-50'
      }
    ];

    if (departmentGroup === 'ipd') {
      return [
        ...baseCards,
        {
          title: 'Productivity เฉลี่ย',
          value: formatNumber(stats.avgProductivity, 1),
          unit: '%',
          icon: TrendingUp,
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          threshold: { good: 80, warning: 60 }
        },
        {
          title: 'LOS เฉลี่ย',
          value: formatNumber(stats.avgLOS, 1),
          unit: 'วัน',
          icon: Clock,
          color: 'from-amber-500 to-orange-600',
          bgColor: 'bg-amber-50',
          threshold: { good: 5, warning: 7 },
          lowerIsBetter: true
        },
        {
          title: 'Readmission Rate',
          value: formatNumber(stats.avgReadmissionRate, 1),
          unit: '%',
          icon: RefreshCw,
          color: 'from-cyan-500 to-blue-600',
          bgColor: 'bg-cyan-50',
          threshold: { good: 5, warning: 10 },
          lowerIsBetter: true
        },
        {
          title: 'ระบุตัว ผป.ผิด',
          value: stats.ipdWrongPatientId.toString(),
          unit: 'ครั้ง',
          icon: Users,
          color: 'from-amber-500 to-orange-600',
          bgColor: 'bg-amber-50'
        },
        {
          title: 'รักษาผิดคน',
          value: stats.ipdWrongTreatment.toString(),
          unit: 'ครั้ง',
          icon: XCircle,
          color: 'from-rose-500 to-pink-600',
          bgColor: 'bg-rose-50'
        },
        {
          title: 'ตายไม่คาดคิด',
          value: stats.ipdUnexpectedDeath.toString(),
          unit: 'ครั้ง',
          icon: Skull,
          color: 'from-slate-600 to-gray-700',
          bgColor: 'bg-slate-50'
        },
        {
          title: 'แผลกดทับ',
          value: formatNumber(stats.pressureUlcerRate, 2),
          unit: '/1000 วันนอน',
          icon: Shield,
          color: 'from-purple-500 to-violet-600',
          bgColor: 'bg-purple-50',
          threshold: { good: 1, warning: 2 },
          lowerIsBetter: true
        }
      ];
    }

    if (departmentGroup === 'special') {
      // Filter metrics based on selected department
      // SPECIAL001 = OR, SPECIAL002 = ER, SPECIAL003 = Anesth, SPECIAL004 = LR

      const summaryCards = [
        {
          title: 'จำนวนแผนก',
          value: stats.uniqueDepts.toString(),
          unit: 'แผนก',
          icon: Gauge,
          color: 'from-indigo-500 to-purple-600',
          bgColor: 'bg-indigo-50'
        },
        {
          title: 'อุบัติการณ์รวม',
          value: stats.totalIncidents.toString(),
          unit: 'ครั้ง',
          icon: AlertTriangle,
          color: 'from-rose-500 to-pink-600',
          bgColor: 'bg-rose-50'
        }
      ];

      // OR metrics (SPECIAL001)
      if (selectedDepartment === 'SPECIAL001' || selectedDepartment === 'all') {
        const orCards = [
          { title: 'ระบุตัว ผป.ผิดคน', value: stats.specialOrWrongPatient.toString(), unit: 'ครั้ง', icon: Users, color: 'from-amber-500 to-orange-600', bgColor: 'bg-amber-50' },
          { title: 'ตายไม่คาดคิด', value: stats.specialOrUnexpectedDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50' },
          { title: 'pt.เสียชีวิต', value: stats.specialOrPtDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50' },
          { title: 'อุบัติเหตุบุคลากร', value: stats.specialOrStaffAccident.toString(), unit: 'ครั้ง', icon: AlertTriangle, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' },
          { title: 'ผ่าตัดผิดคน/ตำแหน่ง', value: stats.specialOrWrongSurgery.toString(), unit: 'ครั้ง', icon: Scissors, color: 'from-emerald-500 to-green-600', bgColor: 'bg-emerald-50' },
          { title: 'สิ่งของตกค้างหลังผ่าตัด', value: stats.specialOrForeignBody.toString(), unit: 'ครั้ง', icon: XCircle, color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50' }
        ];
        if (selectedDepartment === 'SPECIAL001') return [...summaryCards, ...orCards];
      }

      // ER metrics (SPECIAL002)
      if (selectedDepartment === 'SPECIAL002' || selectedDepartment === 'all') {
        const erCards = [
          { title: 'ระบุตัว ผป.ผิดคน', value: stats.specialErWrongPatient.toString(), unit: 'ครั้ง', icon: Users, color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50' },
          { title: 'ตายไม่คาดคิด', value: stats.specialErUnexpectedDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50' },
          { title: 'pt.เสียชีวิต', value: stats.specialErPtDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50' },
          { title: 'CPR ทั้งหมด', value: stats.specialErCprTotal.toString(), unit: 'ครั้ง', icon: Ambulance, color: 'from-blue-500 to-indigo-600', bgColor: 'bg-blue-50' },
          { title: 'CPR สำเร็จ', value: stats.specialErCprSuccess.toString(), unit: 'ครั้ง', icon: HeartPulse, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50' },
          { title: 'กลับมารักษาซ้ำ 48 ชม.', value: stats.specialErReadmission48hr.toString(), unit: 'ครั้ง', icon: RefreshCw, color: 'from-orange-500 to-amber-600', bgColor: 'bg-orange-50' }
        ];
        if (selectedDepartment === 'SPECIAL002') return [...summaryCards, ...erCards];
      }

      // Anesth metrics (SPECIAL003)
      if (selectedDepartment === 'SPECIAL003' || selectedDepartment === 'all') {
        const anesthCards = [
          { title: 'ระบุตัว ผป.ผิดคน', value: stats.specialAnWrongPatient.toString(), unit: 'ครั้ง', icon: Users, color: 'from-amber-500 to-yellow-600', bgColor: 'bg-amber-50' },
          { title: 'ตายไม่คาดคิด', value: stats.specialAnUnexpectedDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-rose-500 to-pink-600', bgColor: 'bg-rose-50' },
          { title: 'pt.เสียชีวิต', value: stats.specialAnPtDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50' },
          { title: 'อุบัติเหตุบุคลากร', value: stats.specialAnStaffAccident.toString(), unit: 'ครั้ง', icon: AlertTriangle, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' },
          { title: 'Aspiration', value: stats.specialAnAspiration.toString(), unit: 'ครั้ง', icon: Thermometer, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50' },
          { title: 'แพ้ยา', value: stats.specialAnDrugAllergy.toString(), unit: 'ครั้ง', icon: Pill, color: 'from-orange-500 to-red-600', bgColor: 'bg-orange-50' },
          { title: 'ผิดพลาดใส่ท่อช่วยหายใจ', value: stats.specialAnIntubationError.toString(), unit: 'ครั้ง', icon: Syringe, color: 'from-cyan-500 to-blue-600', bgColor: 'bg-cyan-50' },
          { title: 'เสียชีวิตในห้องผ่าตัด', value: stats.specialAnOrDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-red-500 to-rose-600', bgColor: 'bg-red-50' }
        ];
        if (selectedDepartment === 'SPECIAL003') return [...summaryCards, ...anesthCards];
      }

      // LR metrics (SPECIAL004)
      if (selectedDepartment === 'SPECIAL004' || selectedDepartment === 'all') {
        const lrCards = [
          { title: 'ระบุตัว ผป.ผิดคน', value: stats.specialLrWrongPatient.toString(), unit: 'ครั้ง', icon: Baby, color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50' },
          { title: 'ตายไม่คาดคิด', value: stats.specialLrUnexpectedDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-rose-500 to-red-600', bgColor: 'bg-rose-50' },
          { title: 'pt.เสียชีวิต', value: stats.specialLrPtDeath.toString(), unit: 'ครั้ง', icon: Skull, color: 'from-purple-500 to-violet-600', bgColor: 'bg-purple-50' },
          { title: 'อุบัติเหตุบุคลากร', value: stats.specialLrStaffAccident.toString(), unit: 'ครั้ง', icon: AlertTriangle, color: 'from-blue-500 to-cyan-600', bgColor: 'bg-blue-50' }
        ];
        if (selectedDepartment === 'SPECIAL004') return [...summaryCards, ...lrCards];
      }

      // When 'all' is selected, show summary only (to avoid too many cards)
      return [
        ...summaryCards,
        { title: 'CPR สำเร็จ (ER)', value: stats.specialErCprSuccess.toString(), unit: 'ครั้ง', icon: HeartPulse, color: 'from-emerald-500 to-teal-600', bgColor: 'bg-emerald-50' },
        { title: 'ความพึงพอใจ', value: formatNumber(stats.avgSatisfaction, 1), unit: '%', icon: Heart, color: 'from-pink-500 to-rose-600', bgColor: 'bg-pink-50' }
      ];
    }

    if (departmentGroup === 'opd') {
      return [
        ...baseCards,
        {
          title: 'ระบุตัว ผป.ผิด',
          value: stats.opdWrongPatientId.toString(),
          unit: 'ครั้ง',
          icon: Users,
          color: 'from-amber-500 to-orange-600',
          bgColor: 'bg-amber-50'
        },
        {
          title: 'รักษาผิดคน',
          value: stats.opdWrongTreatment.toString(),
          unit: 'ครั้ง',
          icon: XCircle,
          color: 'from-rose-500 to-pink-600',
          bgColor: 'bg-rose-50'
        },
        {
          title: 'ตายไม่คาดคิด',
          value: stats.opdUnexpectedDeath.toString(),
          unit: 'ครั้ง',
          icon: Skull,
          color: 'from-slate-600 to-gray-700',
          bgColor: 'bg-slate-50'
        },
        {
          title: 'อุบัติเหตุบุคลากร',
          value: stats.opdStaffAccidents.toString(),
          unit: 'ครั้ง',
          icon: AlertTriangle,
          color: 'from-purple-500 to-violet-600',
          bgColor: 'bg-purple-50'
        },
        {
          title: 'CPR Success',
          value: formatNumber(stats.cprSuccessRate, 1),
          unit: '%',
          icon: HeartPulse,
          color: 'from-emerald-500 to-teal-600',
          bgColor: 'bg-emerald-50',
          threshold: { good: 50, warning: 30 }
        }
      ];
    }

    return baseCards;
  };

  const statCards = getStatCards();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <RefreshCw className="w-12 h-12 text-indigo-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-500">กำลังโหลดข้อมูล...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Filters */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-3">
            {groupConfig && (
              <span className={`p-2 rounded-xl ${groupConfig.bgColor}`}>
                {departmentGroup === 'ipd' && <Bed className={`w-6 h-6 ${groupConfig.textColor}`} />}
                {departmentGroup === 'special' && <Syringe className={`w-6 h-6 ${groupConfig.textColor}`} />}
                {departmentGroup === 'opd' && <Stethoscope className={`w-6 h-6 ${groupConfig.textColor}`} />}
              </span>
            )}
            Dashboard {groupConfig?.nameTh || ''}
          </h2>
          <p className="text-gray-500 mt-1">
            {selectedDeptInfo
              ? `📊 ${selectedDeptInfo.name}`
              : `ภาพรวมข้อมูล ${groupConfig?.description || 'ทั้งหมด'}`
            } • ปีงบประมาณ {fiscalYear}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Department Filter (Sub-department Selector) */}
          <div className="relative">
            <button
              onClick={() => setShowDeptDropdown(!showDeptDropdown)}
              className={`px-4 py-2.5 rounded-xl border text-sm font-medium flex items-center gap-2 transition-all min-w-[200px] justify-between
                ${selectedDepartment !== 'all'
                  ? 'bg-indigo-50 border-indigo-300 text-indigo-700'
                  : 'bg-white border-gray-200 text-gray-700 hover:border-indigo-300'
                }`}
            >
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4" />
                <span className="truncate max-w-[150px]">
                  {selectedDepartment === 'all' ? 'ทุกแผนก' : selectedDeptInfo?.name || selectedDepartment}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 transition-transform ${showDeptDropdown ? 'rotate-180' : ''}`} />
            </button>

            {/* Department Dropdown */}
            {showDeptDropdown && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowDeptDropdown(false)}
                />
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-xl border border-gray-200 shadow-xl z-50 overflow-hidden">
                  {/* Search */}
                  <div className="p-3 border-b border-gray-100">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="ค้นหาแผนก..."
                        value={deptSearchQuery}
                        onChange={(e) => setDeptSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                        autoFocus
                      />
                    </div>
                  </div>

                  {/* Department List */}
                  <div className="max-h-64 overflow-y-auto">
                    {/* All Departments Option */}
                    <button
                      onClick={() => {
                        setSelectedDepartment('all');
                        setShowDeptDropdown(false);
                        setDeptSearchQuery('');
                      }}
                      className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors border-b border-gray-100
                        ${selectedDepartment === 'all' ? 'bg-indigo-50' : ''}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${selectedDepartment === 'all' ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}>
                        <Building2 className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className={`font-medium ${selectedDepartment === 'all' ? 'text-indigo-700' : 'text-gray-700'}`}>
                          ทุกแผนก
                        </p>
                        <p className="text-xs text-gray-500">{availableDepartments.length} แผนก</p>
                      </div>
                      {selectedDepartment === 'all' && (
                        <CheckCircle className="w-5 h-5 text-indigo-500" />
                      )}
                    </button>

                    {/* Individual Departments */}
                    {filteredDepartments.map((dept) => {
                      const deptRecords = allDepartmentsData.filter(d => d.departmentId === dept.id).length;
                      return (
                        <button
                          key={dept.id}
                          onClick={() => {
                            setSelectedDepartment(dept.id);
                            setShowDeptDropdown(false);
                            setDeptSearchQuery('');
                          }}
                          className={`w-full px-4 py-3 text-left flex items-center gap-3 hover:bg-gray-50 transition-colors
                            ${selectedDepartment === dept.id ? 'bg-indigo-50' : ''}`}
                        >
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold
                            ${selectedDepartment === dept.id ? 'bg-indigo-500 text-white' : 'bg-gray-100 text-gray-500'}`}
                          >
                            {dept.name.charAt(0)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className={`font-medium truncate ${selectedDepartment === dept.id ? 'text-indigo-700' : 'text-gray-700'}`}>
                              {dept.name}
                            </p>
                            <p className="text-xs text-gray-500">{deptRecords} รายการ</p>
                          </div>
                          {selectedDepartment === dept.id && (
                            <CheckCircle className="w-5 h-5 text-indigo-500 flex-shrink-0" />
                          )}
                        </button>
                      );
                    })}

                    {filteredDepartments.length === 0 && (
                      <div className="px-4 py-8 text-center text-gray-500">
                        <Search className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">ไม่พบแผนกที่ค้นหา</p>
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Clear Department Filter */}
          {selectedDepartment !== 'all' && (
            <button
              onClick={() => setSelectedDepartment('all')}
              className="p-2 rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
              title="ล้างตัวกรอง"
            >
              <X className="w-4 h-4" />
            </button>
          )}

          {/* Month Filter */}
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-4 py-2.5 rounded-xl border border-gray-200 text-sm font-medium focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="all">ทุกเดือน</option>
            {MONTHS_TH.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 hover:bg-indigo-100 transition-all"
            title="รีเฟรชข้อมูล"
          >
            <RefreshCw className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Selected Department Badge */}
      {selectedDeptInfo && (
        <div className={`p-4 rounded-xl border-2 ${groupConfig?.borderColor || 'border-indigo-200'} ${groupConfig?.bgColor || 'bg-indigo-50'}`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${groupConfig?.bgColor || 'bg-indigo-100'}`}>
                <Building2 className={`w-5 h-5 ${groupConfig?.textColor || 'text-indigo-600'}`} />
              </div>
              <div>
                <p className="text-sm text-gray-500">กำลังดูข้อมูลของ</p>
                <p className={`font-bold text-lg ${groupConfig?.textColor || 'text-indigo-700'}`}>{selectedDeptInfo.name}</p>
              </div>
            </div>
            <button
              onClick={() => setSelectedDepartment('all')}
              className="px-4 py-2 rounded-lg bg-white border border-gray-200 text-gray-600 hover:bg-gray-50 text-sm font-medium flex items-center gap-2"
            >
              <X className="w-4 h-4" />
              ดูทุกแผนก
            </button>
          </div>
        </div>
      )}

      {/* Summary Stats - Premium Modern Design */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-5">
        {statCards.map((stat, idx) => {
          const Icon = stat.icon;
          const numValue = parseFloat(stat.value);

          // Dynamic color based on threshold
          const getGradient = () => {
            if (!stat.threshold) return stat.color;
            const isGood = stat.lowerIsBetter
              ? numValue <= stat.threshold.good
              : numValue >= stat.threshold.good;
            const isWarning = stat.lowerIsBetter
              ? numValue <= stat.threshold.warning && numValue > stat.threshold.good
              : numValue >= stat.threshold.warning && numValue < stat.threshold.good;
            if (isGood) return 'from-emerald-400 via-green-500 to-teal-600';
            if (isWarning) return 'from-amber-400 via-orange-500 to-red-500';
            return 'from-rose-400 via-red-500 to-pink-600';
          };

          return (
            <div
              key={idx}
              className="group relative overflow-hidden rounded-2xl transition-all duration-500 hover:scale-105 hover:-translate-y-2"
              style={{
                background: 'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,250,252,0.9) 100%)',
                boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(0,0,0,0.08), 0 25px 50px -12px rgba(0,0,0,0.12), inset 0 1px 0 rgba(255,255,255,0.8)',
                border: '1px solid rgba(255,255,255,0.6)'
              }}
            >
              {/* Animated gradient overlay on hover */}
              <div
                className={`absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-gradient-to-br ${getGradient()}`}
                style={{ filter: 'blur(60px)', transform: 'scale(1.5)' }}
              />

              {/* Glossy highlight */}
              <div className="absolute top-0 left-0 right-0 h-1/2 bg-gradient-to-b from-white/50 to-transparent rounded-t-2xl" />

              {/* Decorative circle */}
              <div
                className={`absolute -top-8 -right-8 w-28 h-28 rounded-full bg-gradient-to-br ${stat.color} opacity-10 group-hover:opacity-20 group-hover:scale-125 transition-all duration-500`}
              />

              {/* Content */}
              <div className="relative p-5 z-10">
                {/* Icon with premium styling */}
                <div
                  className={`inline-flex p-3 rounded-2xl bg-gradient-to-br ${stat.color} shadow-lg mb-4 group-hover:scale-110 group-hover:shadow-xl transition-all duration-300`}
                  style={{
                    boxShadow: `0 4px 14px -3px ${stat.color.includes('emerald') ? 'rgba(16,185,129,0.4)' :
                      stat.color.includes('blue') ? 'rgba(59,130,246,0.4)' :
                        stat.color.includes('amber') ? 'rgba(245,158,11,0.4)' :
                          stat.color.includes('rose') || stat.color.includes('pink') ? 'rgba(244,63,94,0.4)' :
                            stat.color.includes('purple') || stat.color.includes('violet') ? 'rgba(139,92,246,0.4)' : 'rgba(99,102,241,0.4)'}`
                  }}
                >
                  <Icon className="w-5 h-5 text-white drop-shadow-sm" />
                </div>

                {/* Title */}
                <p className="text-xs font-semibold text-slate-500 mb-2 group-hover:text-slate-600 transition-colors line-clamp-1">{stat.title}</p>

                {/* Value with auto-fit typography */}
                <div className="flex flex-col">
                  <span
                    className={`text-2xl md:text-3xl font-bold tracking-tight bg-gradient-to-r ${getGradient()} bg-clip-text text-transparent whitespace-nowrap`}
                    style={{
                      fontSize: stat.value.length > 4 ? 'clamp(1.25rem, 4vw, 1.75rem)' : 'clamp(1.5rem, 5vw, 2rem)',
                    }}
                  >
                    {stat.value}
                  </span>
                  <span className="text-xs font-medium text-slate-400 mt-0.5 line-clamp-1">{stat.unit}</span>
                </div>

                {/* Progress indicator for threshold values */}
                {stat.threshold && (
                  <div className="mt-3">
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full bg-gradient-to-r ${getGradient()} transition-all duration-700`}
                        style={{ width: `${Math.min(numValue, 100)}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom highlight line */}
              <div className={`absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
            </div>
          );
        })}
      </div>

      {/* Monthly Trends - Premium Design */}
      <div
        className="rounded-3xl overflow-hidden transition-all duration-300 hover:shadow-xl"
        style={{
          background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)',
          boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 10px 20px -5px rgba(0,0,0,0.08)',
          border: '1px solid rgba(255,255,255,0.8)'
        }}
      >
        <button
          onClick={() => toggleSection('trends')}
          className="w-full px-6 py-5 flex items-center justify-between transition-all hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50"
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg shadow-indigo-500/30">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <div className="text-left">
              <h3 className="font-bold text-lg text-slate-800">
                📊 แนวโน้มรายเดือน
                {selectedDeptInfo && <span className="text-indigo-600 ml-2 font-normal text-base">• {selectedDeptInfo.name}</span>}
              </h3>
              <p className="text-sm text-slate-500 mt-0.5">
                {departmentGroup === 'ipd' ? 'อุบัติการณ์แยกประเภท (ระบุตัวผิด/รักษาผิด/ตายไม่คาดคิด) + Productivity + LOS' :
                  departmentGroup === 'special' ? 'อุบัติการณ์แยกประเภท (ระบุตัวผิด/ตายไม่คาดคิด/pt.เสียชีวิต/อุบัติเหตุบุคลากร)' :
                    departmentGroup === 'opd' ? 'อุบัติการณ์แยกประเภท (ระบุตัวผิด/รักษาผิด/ตายไม่คาดคิด/อุบัติเหตุบุคลากร)' :
                      'ผู้รับบริการและเวลารอคอย'}
              </p>
            </div>
          </div>
          <div className={`p-2 rounded-xl transition-all duration-300 ${expandedSections.trends ? 'bg-indigo-100 rotate-180' : 'bg-slate-100'}`}>
            <ChevronDown className={`w-5 h-5 ${expandedSections.trends ? 'text-indigo-600' : 'text-slate-400'}`} />
          </div>
        </button>

        <div className={`transition-all duration-500 ease-in-out ${expandedSections.trends ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0 overflow-hidden'}`}>
          <div className="p-6 pt-0">
            <div className="h-80 rounded-2xl bg-gradient-to-br from-slate-50/50 to-white p-4">
              <ResponsiveContainer width="100%" height="100%">
                <ComposedChart data={monthlyTrends}>
                  <defs>
                    <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#F59E0B" stopOpacity={0.8} />
                      <stop offset="100%" stopColor="#D97706" stopOpacity={0.6} />
                    </linearGradient>
                    <linearGradient id="barWrongPatient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fbbf24" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barUnexpectedDeath" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#fb7185" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#f43f5e" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barPtDeath" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a78bfa" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#8b5cf6" stopOpacity={0.7} />
                    </linearGradient>
                    <linearGradient id="barStaffAccident" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#60a5fa" stopOpacity={0.9} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <YAxis yAxisId="left" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 12, fill: '#6B7280' }} stroke="#E5E7EB" />
                  <Tooltip
                    contentStyle={{
                      borderRadius: '16px',
                      border: 'none',
                      boxShadow: '0 10px 40px -10px rgba(0,0,0,0.2)',
                      background: 'linear-gradient(135deg, rgba(255,255,255,0.98) 0%, rgba(248,250,252,0.95) 100%)'
                    }}
                    formatter={(value: number, name: string) => [
                      `${typeof value === 'number' ? value.toFixed(0) : value} ครั้ง`,
                      name
                    ]}
                  />
                  <Legend />

                  {/* Special Unit specific chart - show incident breakdown */}
                  {departmentGroup === 'special' ? (
                    <>
                      <Bar yAxisId="left" dataKey="wrongPatient" fill="url(#barWrongPatient)" name="ระบุตัว ผป.ผิด" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="unexpectedDeath" fill="url(#barUnexpectedDeath)" name="ตายไม่คาดคิด" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="ptDeath" fill="url(#barPtDeath)" name="pt.เสียชีวิต" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="staffAccident" fill="url(#barStaffAccident)" name="อุบัติเหตุบุคลากร" radius={[4, 4, 0, 0]} />
                      {selectedDepartment === 'SPECIAL002' && (
                        <>
                          <Line yAxisId="right" type="monotone" dataKey="cprTotal" stroke="#3b82f6" strokeWidth={3} name="CPR ทั้งหมด" dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }} />
                          <Line yAxisId="right" type="monotone" dataKey="cprSuccess" stroke="#10b981" strokeWidth={3} name="CPR สำเร็จ" dot={{ fill: '#10b981', strokeWidth: 2, r: 4 }} />
                        </>
                      )}
                    </>
                  ) : departmentGroup === 'ipd' ? (
                    <>
                      {/* IPD specific chart - show incident breakdown + Productivity + LOS */}
                      <Bar yAxisId="right" dataKey="wrongPatient" fill="url(#barWrongPatient)" name="ระบุตัว ผป.ผิด" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="wrongTreatment" fill="url(#barUnexpectedDeath)" name="รักษาผิดคน" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="right" dataKey="unexpectedDeath" fill="url(#barPtDeath)" name="ตายไม่คาดคิด" radius={[4, 4, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={3} name="Productivity" dot={{ fill: '#6366F1', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#6366F1' }} />
                      <Line yAxisId="left" type="monotone" dataKey="los" stroke="#10B981" strokeWidth={3} name="LOS" dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#10B981' }} />
                    </>
                  ) : departmentGroup === 'opd' ? (
                    <>
                      {/* OPD specific chart - show incident breakdown */}
                      <Bar yAxisId="left" dataKey="wrongPatient" fill="url(#barWrongPatient)" name="ระบุตัว ผป.ผิด" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="wrongTreatment" fill="url(#barUnexpectedDeath)" name="รักษาผิดคน" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="unexpectedDeath" fill="url(#barPtDeath)" name="ตายไม่คาดคิด" radius={[4, 4, 0, 0]} />
                      <Bar yAxisId="left" dataKey="staffAccident" fill="url(#barStaffAccident)" name="อุบัติเหตุบุคลากร" radius={[4, 4, 0, 0]} />
                    </>
                  ) : (
                    <>
                      <Bar yAxisId="right" dataKey="incidents" fill="url(#barGradient)" name="อุบัติการณ์" radius={[8, 8, 0, 0]} />
                      <Line yAxisId="left" type="monotone" dataKey="productivity" stroke="#6366F1" strokeWidth={3} name="Productivity" dot={{ fill: '#6366F1', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#6366F1' }} />
                      {fieldMapping.los && (
                        <Line yAxisId="left" type="monotone" dataKey="los" stroke="#10B981" strokeWidth={3} name="LOS" dot={{ fill: '#10B981', strokeWidth: 2, r: 5 }} activeDot={{ r: 8, fill: '#10B981' }} />
                      )}
                    </>
                  )}
                </ComposedChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Department Ranking - Only show when viewing all departments */}
      {selectedDepartment === 'all' && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <button
            onClick={() => toggleSection('departments')}
            className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-emerald-50">
                <Target className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="text-left">
                <h3 className="font-semibold text-gray-800">อันดับแผนก</h3>
                <p className="text-sm text-gray-500">Top 10 ตาม {departmentGroup === 'opd' ? 'จำนวนผู้รับบริการ' : 'Productivity'}</p>
              </div>
            </div>
            {expandedSections.departments ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
          </button>

          {expandedSections.departments && (
            <div className="p-6 pt-0">
              <div className="space-y-3">
                {departmentRanking.map((dept, idx) => (
                  <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept.id)}
                    className="w-full flex items-center gap-4 p-3 rounded-xl hover:bg-indigo-50 transition-colors text-left group"
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm
                      ${idx === 0 ? 'bg-yellow-100 text-yellow-700' :
                        idx === 1 ? 'bg-gray-100 text-gray-600' :
                          idx === 2 ? 'bg-orange-100 text-orange-700' :
                            'bg-gray-50 text-gray-500'}`}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-800 truncate group-hover:text-indigo-700">{dept.name}</p>
                      <p className="text-xs text-gray-500">{dept.records} รายการ</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-lg font-bold ${dept.avgValue >= 80 ? 'text-emerald-600' :
                        dept.avgValue >= 60 ? 'text-amber-600' :
                          'text-rose-600'
                        }`}>
                        {formatNumber(dept.avgValue, 1)}
                        <span className="text-xs text-gray-400 ml-1">
                          {departmentGroup === 'opd' ? 'ราย' : '%'}
                        </span>
                      </p>
                    </div>
                    <div className="w-32 h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${dept.avgValue >= 80 ? 'bg-emerald-500' :
                          dept.avgValue >= 60 ? 'bg-amber-500' :
                            'bg-rose-500'
                          }`}
                        style={{ width: `${Math.min(dept.avgValue, 100)}%` }}
                      />
                    </div>
                    <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-indigo-500" />
                  </button>
                ))}

                {departmentRanking.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                    <p>ไม่มีข้อมูล</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Data Completion Matrix */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <button
          onClick={() => toggleSection('completion')}
          className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-purple-50">
              <Calendar className="w-5 h-5 text-purple-600" />
            </div>
            <div className="text-left">
              <h3 className="font-semibold text-gray-800">
                ความครบถ้วนของข้อมูล
                {selectedDeptInfo && <span className="text-purple-600 ml-2">• {selectedDeptInfo.name}</span>}
              </h3>
              <p className="text-sm text-gray-500">สถานะการบันทึกข้อมูลรายเดือน</p>
            </div>
          </div>
          {expandedSections.completion ? <ChevronUp className="w-5 h-5 text-gray-400" /> : <ChevronDown className="w-5 h-5 text-gray-400" />}
        </button>

        {expandedSections.completion && (
          <div className="p-6 pt-0 overflow-x-auto">
            <table className="w-full min-w-[800px]">
              <thead>
                <tr>
                  <th className="text-left text-xs font-medium text-gray-500 pb-3 sticky left-0 bg-white">แผนก</th>
                  {MONTHS_TH.map(month => (
                    <th key={month} className="text-center text-xs font-medium text-gray-500 pb-3 px-1">
                      {month.substring(0, 3)}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {completionMatrix.departments.slice(0, selectedDepartment !== 'all' ? 1 : 15).map(deptId => {
                  const deptData = allDepartmentsData.find(d => d.departmentId === deptId);
                  return (
                    <tr key={deptId} className="border-t border-gray-50">
                      <td className="py-2 text-sm text-gray-700 truncate max-w-[200px] sticky left-0 bg-white pr-4">
                        {deptData?.departmentName || DEPARTMENT_NAMES[deptId] || deptId}
                      </td>
                      {MONTHS_TH.map(month => {
                        const hasData = completionMatrix.matrix[deptId]?.[month];
                        return (
                          <td key={month} className="text-center py-2 px-1">
                            <div
                              className={`w-6 h-6 mx-auto rounded-md transition-all ${hasData
                                ? 'bg-emerald-500'
                                : 'bg-gray-100'
                                }`}
                              title={hasData ? `${month}: มีข้อมูล` : `${month}: ไม่มีข้อมูล`}
                            >
                              {hasData && <CheckCircle className="w-4 h-4 text-white m-1" />}
                            </div>
                          </td>
                        );
                      })}
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {selectedDepartment === 'all' && completionMatrix.departments.length > 15 && (
              <p className="text-center text-sm text-gray-500 mt-4">
                แสดง 15 จาก {completionMatrix.departments.length} แผนก
              </p>
            )}
          </div>
        )}
      </div>

      {/* Empty State */}
      {allDepartmentsData.length === 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">ไม่มีข้อมูล</h3>
          <p className="text-gray-500 mb-4">
            ยังไม่มีข้อมูลสำหรับ{groupConfig?.nameTh || 'กลุ่มนี้'} ในปีงบประมาณ {fiscalYear}
          </p>
          <button
            onClick={onRefresh}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
          >
            <RefreshCw className="w-4 h-4" />
            รีเฟรชข้อมูล
          </button>
        </div>
      )}
    </div>
  );
}
