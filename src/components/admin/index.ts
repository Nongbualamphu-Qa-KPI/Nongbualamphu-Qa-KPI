// Admin Dashboard Components V3 
// With Department Group Support + Sub-department Selector + Real API Integration
// Export all admin modules

export { default as AdminPanel } from './AdminPanel';
export { default as AdminDashboard } from './AdminDashboard';
export { default as ExportModule } from './ExportModule';
export { default as SettingsModule } from './SettingsModule';
export { default as DataManagement } from './DataManagement';

// Types
export interface DepartmentData {
  id: string;
  departmentId: string;
  departmentName: string;
  fiscalYear: string;
  month: string;
  data: Record<string, string>;
  updatedAt: string;
}

export interface GroupConfig {
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

export interface AdminPanelProps {
  initialData?: DepartmentData[];
  fieldLabels: Record<string, string>;
  computedFields: Set<string>;
  computeFields: (data: Record<string, string>, departmentId: string) => Record<string, string>;
  currentUser?: {
    name: string;
    email: string;
    role: string;
    avatar?: string;
  };
  initialFiscalYear?: string;
  onLogout?: () => void;
}

export type AdminView = 'dashboard' | 'export' | 'settings' | 'data';
export type DepartmentGroup = 'all' | 'ipd' | 'opd' | 'special';

// Department Groups Configuration
export const DEPARTMENT_GROUPS = {
  ipd: {
    id: 'ipd',
    name: 'IPD',
    nameTh: 'ผู้ป่วยใน',
    description: 'หอผู้ป่วยในทั้งหมด',
    departmentIds: [
      'DEPT001', 'DEPT002', 'DEPT003', 'DEPT004', 'DEPT005', 'DEPT006',
      'DEPT007', 'DEPT008', 'DEPT009', 'DEPT010', 'DEPT011', 'DEPT012',
      'DEPT013', 'DEPT014', 'DEPT015', 'DEPT016', 'DEPT017', 'DEPT018',
      'DEPT019', 'DEPT020', 'DEPT021'
    ]
  },
  special: {
    id: 'special',
    name: 'Special Units',
    nameTh: 'หน่วยงานพิเศษ',
    description: 'OR, ER, วิสัญญี, ห้องคลอด',
    departmentIds: ['SPECIAL001', 'SPECIAL002', 'SPECIAL003', 'SPECIAL004']
  },
  opd: {
    id: 'opd',
    name: 'OPD',
    nameTh: 'ผู้ป่วยนอก',
    description: 'คลินิกผู้ป่วยนอกทั้งหมด',
    departmentIds: [
      'OPD001', 'OPD002', 'OPD003', 'OPD004', 'OPD005',
      'OPD006', 'OPD007', 'OPD008', 'OPD009', 'OPD010'
    ]
  }
};

// Department Names
export const DEPARTMENT_NAMES: Record<string, string> = {
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
