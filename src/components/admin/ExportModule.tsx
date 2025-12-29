'use client';

import React, { useState, useMemo } from 'react';
import ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import {
  Download, FileSpreadsheet, FileText, Calendar, Filter,
  CheckCircle, Building2, ChevronDown, Loader2, FileDown,
  Table, BarChart3, PieChart
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

interface ExportModuleProps {
  allDepartmentsData: DepartmentData[];
  fiscalYear: string;
  fieldLabels: Record<string, string>;
  departmentGroup?: string;
  groupConfig?: GroupConfig | null;
  onExportStart?: () => void;
  onExportComplete?: () => void;
}

// ================= Constants =================
const MONTHS_TH = [
  "ตุลาคม", "พฤศจิกายน", "ธันวาคม", "มกราคม", "กุมภาพันธ์", "มีนาคม",
  "เมษายน", "พฤษภาคม", "มิถุนายน", "กรกฎาคม", "สิงหาคม", "กันยายน"
];

const EXPORT_PRESETS = [
  {
    id: 'full',
    name: 'ข้อมูลทั้งหมด',
    description: 'รวมทุกตัวชี้วัดของทุกแผนก',
    icon: Table,
    color: 'indigo'
  },
  {
    id: 'summary',
    name: 'สรุปภาพรวม',
    description: 'Productivity, LOS, แผลกดทับ, Readmission',
    icon: BarChart3,
    color: 'emerald'
  },
  {
    id: 'safety',
    name: 'อุบัติการณ์ความปลอดภัย',
    description: 'เฉพาะข้อมูลด้านความปลอดภัย',
    icon: PieChart,
    color: 'rose'
  },
  {
    id: 'cpr',
    name: 'สถิติ CPR',
    description: 'ข้อมูล CPR และผลลัพธ์',
    icon: FileText,
    color: 'purple'
  }
];

// ================= Utility Functions =================
const generateCSV = (data: string[][], filename: string) => {
  // Add BOM for UTF-8 encoding in Excel
  const BOM = '\uFEFF';
  const csvContent = BOM + data.map(row =>
    row.map(cell => {
      // Escape quotes and wrap in quotes if contains comma or newline
      const escaped = String(cell || '').replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('\n') || escaped.includes('"')) {
        return `"${escaped}"`;
      }
      return escaped;
    }).join(',')
  ).join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

const generateExcelXML = (sheets: { name: string; data: string[][] }[], filename: string) => {
  // Generate Excel XML format (compatible with Excel without external libraries)
  const escapeXML = (str: string) => {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  };

  const sheetsXML = sheets.map(sheet => {
    const rows = sheet.data.map((row, rowIndex) => {
      const cells = row.map((cell, colIndex) => {
        const isNumber = !isNaN(Number(cell)) && cell !== '';
        const type = isNumber ? 'Number' : 'String';
        const value = isNumber ? Number(cell) : escapeXML(cell);
        const style = rowIndex === 0 ? ' ss:StyleID="Header"' : '';
        return `<Cell${style}><Data ss:Type="${type}">${value}</Data></Cell>`;
      }).join('');
      return `<Row>${cells}</Row>`;
    }).join('\n');

    return `
    <Worksheet ss:Name="${escapeXML(sheet.name.slice(0, 31))}">
      <Table>
        ${rows}
      </Table>
    </Worksheet>`;
  }).join('\n');

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
  xmlns:o="urn:schemas-microsoft-com:office:office"
  xmlns:x="urn:schemas-microsoft-com:office:excel"
  xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
  <Styles>
    <Style ss:ID="Default" ss:Name="Normal">
      <Alignment ss:Vertical="Center"/>
      <Font ss:FontName="TH Sarabun New" ss:Size="14"/>
    </Style>
    <Style ss:ID="Header">
      <Font ss:FontName="TH Sarabun New" ss:Size="14" ss:Bold="1"/>
      <Interior ss:Color="#4F46E5" ss:Pattern="Solid"/>
      <Font ss:Color="#FFFFFF"/>
      <Alignment ss:Horizontal="Center" ss:Vertical="Center"/>
    </Style>
  </Styles>
  ${sheetsXML}
</Workbook>`;

  const blob = new Blob([xml], { type: 'application/vnd.ms-excel' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename.replace('.xlsx', '.xls');
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

// ================= Main Component =================
export default function ExportModule({
  allDepartmentsData,
  fiscalYear,
  fieldLabels,
  departmentGroup = 'ipd',
  groupConfig,
  onExportStart,
  onExportComplete
}: ExportModuleProps) {
  const [selectedPreset, setSelectedPreset] = useState<string>('full');
  const [selectedMonths, setSelectedMonths] = useState<Set<string>>(new Set(MONTHS_TH));
  const [selectedDepartments, setSelectedDepartments] = useState<Set<string>>(
    new Set(allDepartmentsData.map(r => r.departmentId))
  );
  const [exportFormat, setExportFormat] = useState<'xlsx' | 'csv'>('xlsx');
  const [isExporting, setIsExporting] = useState(false);
  const [showMonthFilter, setShowMonthFilter] = useState(false);
  const [showDeptFilter, setShowDeptFilter] = useState(false);

  // Get unique departments
  const departments = useMemo(() => {
    const deptMap = new Map<string, string>();
    allDepartmentsData.forEach(r => {
      if (!deptMap.has(r.departmentId)) {
        deptMap.set(r.departmentId, r.departmentName);
      }
    });
    return Array.from(deptMap.entries()).map(([id, name]) => ({ id, name }));
  }, [allDepartmentsData]);

  // Filter data based on selections
  const filteredData = useMemo(() => {
    return allDepartmentsData.filter(r =>
      selectedMonths.has(r.month) && selectedDepartments.has(r.departmentId)
    );
  }, [allDepartmentsData, selectedMonths, selectedDepartments]);

  // Get fields based on preset
  const getFieldsForPreset = (preset: string): string[] => {
    switch (preset) {
      case 'summary':
        return [
          'productivityValue', 'actualHPPD', 'averageLOS', 'pressureUlcerRate',
          'readmissionRate', 's7_1', 's7_3'
        ];
      case 'safety':
        return [
          's1_1', 's1_2', 's1_3', 's1_4', 's1_5', 's1_7', 's1_8', 's1_9', 's1_10'
        ];
      case 'cpr':
        return ['s7_1', 's7_2', 's7_3'];
      case 'full':
      default:
        // Get all unique fields from data
        const allFields = new Set<string>();
        filteredData.forEach(r => {
          Object.keys(r.data).forEach(key => allFields.add(key));
        });
        return Array.from(allFields).sort();
    }
  };

  // Handle export
  const handleExport = async () => {
    if (filteredData.length === 0) {
      alert('ไม่มีข้อมูลที่จะ Export');
      return;
    }

    setIsExporting(true);
    onExportStart?.();

    try {
      const fields = getFieldsForPreset(selectedPreset);
      const timestamp = new Date().toISOString().split('T')[0];
      const presetName = EXPORT_PRESETS.find(p => p.id === selectedPreset)?.name || 'data';
      const filename = `QA_${presetName}_${fiscalYear}_${timestamp}`;

      if (exportFormat === 'csv') {
        // Generate CSV
        const headers = ['แผนก', 'เดือน', 'ปีงบประมาณ', ...fields.map(f => fieldLabels[f] || f)];
        const rows = filteredData.map(record => [
          record.departmentName,
          record.month,
          record.fiscalYear,
          ...fields.map(f => record.data[f] || '')
        ]);

        generateCSV([headers, ...rows], `${filename}.csv`);
      } else {
        // ========== Generate XLSX using ExcelJS (with beautiful styling) ==========
        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'QA System - รพ.หนองบัวลำภู';
        workbook.created = new Date();

        // ===== Sheet 1: ข้อมูลหลัก =====
        const worksheet = workbook.addWorksheet('ข้อมูล QA', {
          views: [{ state: 'frozen', xSplit: 0, ySplit: 1 }] // Freeze header row
        });

        // Define columns with headers
        const columns: Partial<ExcelJS.Column>[] = [
          { header: 'แผนก', key: 'dept', width: 30 },
          { header: 'เดือน', key: 'month', width: 12 },
          { header: 'ปีงบประมาณ', key: 'year', width: 15 },
          ...fields.map(field => ({
            header: fieldLabels[field] || field,
            key: field,
            width: Math.max(20, (fieldLabels[field] || field).length * 1.5)
          }))
        ];
        worksheet.columns = columns;

        // Style header row (Row 1)
        const headerRow = worksheet.getRow(1);
        headerRow.height = 30;
        headerRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: '4F46E5' } // Indigo color
          };
          cell.font = {
            name: 'TH Sarabun New',
            size: 16,
            bold: true,
            color: { argb: 'FFFFFF' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          cell.border = {
            top: { style: 'thin', color: { argb: '000000' } },
            left: { style: 'thin', color: { argb: '000000' } },
            bottom: { style: 'medium', color: { argb: '000000' } },
            right: { style: 'thin', color: { argb: '000000' } }
          };
        });

        // Add data rows
        filteredData.forEach((record) => {
          const rowData: Record<string, string | number> = {
            dept: record.departmentName,
            month: record.month,
            year: record.fiscalYear
          };

          fields.forEach(field => {
            const rawValue = record.data[field] || '';
            const numValue = parseFloat(String(rawValue).replace(/[^0-9.-]/g, ''));
            // Store as number if parseable, otherwise string
            rowData[field] = !isNaN(numValue) && rawValue !== '' ? numValue : rawValue;
          });

          const row = worksheet.addRow(rowData);

          // Style each cell in the data row
          row.eachCell((cell, colNumber) => {
            const fieldKey = columns[colNumber - 1]?.key as string;
            const value = cell.value;

            // Font styling
            cell.font = { name: 'TH Sarabun New', size: 14 };

            // Border
            cell.border = {
              top: { style: 'thin', color: { argb: 'D1D5DB' } },
              left: { style: 'thin', color: { argb: 'D1D5DB' } },
              bottom: { style: 'thin', color: { argb: 'D1D5DB' } },
              right: { style: 'thin', color: { argb: 'D1D5DB' } }
            };

            // Alignment: numbers right, text left
            if (typeof value === 'number') {
              cell.alignment = { horizontal: 'right', vertical: 'middle' };
            } else {
              cell.alignment = { horizontal: 'left', vertical: 'middle' };
            }

            // Conditional formatting: Productivity < 80 = red text
            if (fieldKey === 'productivityValue' && typeof value === 'number') {
              if (value < 80) {
                cell.font = {
                  name: 'TH Sarabun New',
                  size: 14,
                  bold: true,
                  color: { argb: 'DC2626' } // Red
                };
              } else {
                cell.font = {
                  name: 'TH Sarabun New',
                  size: 14,
                  color: { argb: '059669' } // Green
                };
              }
            }

            // Conditional formatting for pressure ulcer rate > 1
            if (fieldKey === 'pressureUlcerRate' && typeof value === 'number' && value > 1) {
              cell.font = {
                name: 'TH Sarabun New',
                size: 14,
                bold: true,
                color: { argb: 'DC2626' } // Red
              };
            }
          });
        });

        // ===== Summary Row (ค่าเฉลี่ย) =====
        const summaryRowValues: Record<string, string | number> = {
          dept: '📊 ค่าเฉลี่ยรวม (Average)',
          month: '-',
          year: '-'
        };

        fields.forEach(field => {
          const values = filteredData
            .map(r => parseFloat(String(r.data[field]).replace(/[^0-9.-]/g, '')))
            .filter(v => !isNaN(v) && v !== 0);

          if (values.length > 0) {
            const avg = values.reduce((a, b) => a + b, 0) / values.length;
            summaryRowValues[field] = parseFloat(avg.toFixed(2));
          } else {
            summaryRowValues[field] = '-';
          }
        });

        const summaryRow = worksheet.addRow(summaryRowValues);
        summaryRow.height = 28;
        summaryRow.eachCell((cell) => {
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'F3F4F6' } // Light gray
          };
          cell.font = { name: 'TH Sarabun New', size: 14, bold: true };
          cell.border = {
            top: { style: 'double', color: { argb: '4F46E5' } },
            left: { style: 'thin', color: { argb: 'D1D5DB' } },
            bottom: { style: 'medium', color: { argb: '4F46E5' } },
            right: { style: 'thin', color: { argb: 'D1D5DB' } }
          };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        });

        // ===== Auto-filter =====
        worksheet.autoFilter = {
          from: { row: 1, column: 1 },
          to: { row: 1, column: columns.length }
        };

        // ===== Sheet 2: สรุปรายเดือน =====
        const monthlySheet = workbook.addWorksheet('สรุปรายเดือน');
        const monthlyColumns = [
          { header: 'เดือน', key: 'month', width: 15 },
          { header: 'จำนวนแผนก', key: 'count', width: 15 },
          { header: 'Productivity เฉลี่ย', key: 'prod', width: 20 },
          { header: 'LOS เฉลี่ย', key: 'los', width: 15 },
          { header: 'แผลกดทับ เฉลี่ย', key: 'pressure', width: 18 },
          { header: 'Readmission เฉลี่ย', key: 'readmit', width: 20 }
        ];
        monthlySheet.columns = monthlyColumns;

        // Style monthly header
        const monthlyHeader = monthlySheet.getRow(1);
        monthlyHeader.height = 28;
        monthlyHeader.eachCell((cell) => {
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '10B981' } }; // Emerald
          cell.font = { name: 'TH Sarabun New', size: 14, bold: true, color: { argb: 'FFFFFF' } };
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
          cell.border = { bottom: { style: 'medium' } };
        });

        // Add monthly data
        MONTHS_TH.forEach(month => {
          const monthData = filteredData.filter(r => r.month === month);
          const calcAvg = (field: string) => {
            const vals = monthData.map(r => parseFloat(r.data[field]?.replace(/[^0-9.-]/g, '') || '0')).filter(v => !isNaN(v) && v > 0);
            return vals.length ? parseFloat((vals.reduce((a, b) => a + b, 0) / vals.length).toFixed(2)) : 0;
          };

          const row = monthlySheet.addRow({
            month,
            count: monthData.length,
            prod: calcAvg('productivityValue'),
            los: calcAvg('averageLOS'),
            pressure: calcAvg('pressureUlcerRate'),
            readmit: calcAvg('readmissionRate')
          });

          row.eachCell((cell) => {
            cell.font = { name: 'TH Sarabun New', size: 14 };
            cell.border = { bottom: { style: 'thin', color: { argb: 'E5E7EB' } } };
          });
        });

        // ===== Generate and Download =====
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        saveAs(blob, `${filename}.xlsx`);
      }

      // Small delay for UX feedback
      await new Promise(resolve => setTimeout(resolve, 300));

    } catch (error) {
      console.error('Export error:', error);
      alert('เกิดข้อผิดพลาดในการ Export กรุณาลองใหม่อีกครั้ง');
    } finally {
      setIsExporting(false);
      onExportComplete?.();
    }
  };

  // Toggle all months
  const toggleAllMonths = () => {
    if (selectedMonths.size === MONTHS_TH.length) {
      setSelectedMonths(new Set());
    } else {
      setSelectedMonths(new Set(MONTHS_TH));
    }
  };

  // Toggle all departments
  const toggleAllDepartments = () => {
    if (selectedDepartments.size === departments.length) {
      setSelectedDepartments(new Set());
    } else {
      setSelectedDepartments(new Set(departments.map(d => d.id)));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 p-6">
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl shadow-lg">
              <Download className="w-8 h-8 text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-800">Export ข้อมูล</h1>
              <p className="text-slate-500">
                ดาวน์โหลดข้อมูลตัวชี้วัดเป็นไฟล์ Excel หรือ CSV
              </p>
            </div>
          </div>
        </div>

        {/* Export Presets */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <h2 className="text-lg font-semibold text-slate-800 mb-4">เลือกประเภทข้อมูล</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            {EXPORT_PRESETS.map(preset => {
              const Icon = preset.icon;
              const isSelected = selectedPreset === preset.id;
              const colorClasses: Record<string, { bg: string; border: string; text: string }> = {
                indigo: { bg: 'bg-indigo-50', border: 'border-indigo-500', text: 'text-indigo-600' },
                emerald: { bg: 'bg-emerald-50', border: 'border-emerald-500', text: 'text-emerald-600' },
                rose: { bg: 'bg-rose-50', border: 'border-rose-500', text: 'text-rose-600' },
                purple: { bg: 'bg-purple-50', border: 'border-purple-500', text: 'text-purple-600' }
              };
              const colors = colorClasses[preset.color] || colorClasses.indigo;

              return (
                <button
                  key={preset.id}
                  onClick={() => setSelectedPreset(preset.id)}
                  className={`
                    relative p-4 rounded-xl border-2 transition-all text-left
                    ${isSelected
                      ? `${colors.bg} ${colors.border} shadow-md`
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                    }
                  `}
                >
                  {isSelected && (
                    <div className="absolute top-2 right-2">
                      <CheckCircle className={`w-5 h-5 ${colors.text}`} />
                    </div>
                  )}
                  <div className={`p-2 rounded-lg ${colors.bg} w-fit mb-3`}>
                    <Icon className={`w-5 h-5 ${colors.text}`} />
                  </div>
                  <h3 className="font-semibold text-slate-800">{preset.name}</h3>
                  <p className="text-xs text-slate-500 mt-1">{preset.description}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filters */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Month Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <button
              onClick={() => setShowMonthFilter(!showMonthFilter)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-5 h-5 text-slate-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800">เดือน</h3>
                  <p className="text-sm text-slate-500">
                    เลือก {selectedMonths.size} จาก {MONTHS_TH.length} เดือน
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showMonthFilter ? 'rotate-180' : ''}`} />
            </button>

            {showMonthFilter && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={toggleAllMonths}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedMonths.size === MONTHS_TH.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
                <div className="grid grid-cols-3 gap-2">
                  {MONTHS_TH.map(month => (
                    <label
                      key={month}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                        ${selectedMonths.has(month) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedMonths.has(month)}
                        onChange={(e) => {
                          const next = new Set(selectedMonths);
                          if (e.target.checked) {
                            next.add(month);
                          } else {
                            next.delete(month);
                          }
                          setSelectedMonths(next);
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm">{month.slice(0, 3)}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Department Filter */}
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <button
              onClick={() => setShowDeptFilter(!showDeptFilter)}
              className="w-full flex items-center justify-between"
            >
              <div className="flex items-center gap-3">
                <Building2 className="w-5 h-5 text-slate-400" />
                <div className="text-left">
                  <h3 className="font-semibold text-slate-800">แผนก</h3>
                  <p className="text-sm text-slate-500">
                    เลือก {selectedDepartments.size} จาก {departments.length} แผนก
                  </p>
                </div>
              </div>
              <ChevronDown className={`w-5 h-5 text-slate-400 transition-transform ${showDeptFilter ? 'rotate-180' : ''}`} />
            </button>

            {showDeptFilter && (
              <div className="mt-4 space-y-3">
                <button
                  onClick={toggleAllDepartments}
                  className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                >
                  {selectedDepartments.size === departments.length ? 'ยกเลิกทั้งหมด' : 'เลือกทั้งหมด'}
                </button>
                <div className="max-h-64 overflow-y-auto space-y-1">
                  {departments.map(dept => (
                    <label
                      key={dept.id}
                      className={`
                        flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors
                        ${selectedDepartments.has(dept.id) ? 'bg-indigo-50 text-indigo-700' : 'hover:bg-slate-50'}
                      `}
                    >
                      <input
                        type="checkbox"
                        checked={selectedDepartments.has(dept.id)}
                        onChange={(e) => {
                          const next = new Set(selectedDepartments);
                          if (e.target.checked) {
                            next.add(dept.id);
                          } else {
                            next.delete(dept.id);
                          }
                          setSelectedDepartments(next);
                        }}
                        className="rounded text-indigo-600"
                      />
                      <span className="text-sm truncate">{dept.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Export Format & Action */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h3 className="font-semibold text-slate-800 mb-2">รูปแบบไฟล์</h3>
              <div className="flex gap-3">
                <button
                  onClick={() => setExportFormat('xlsx')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                    ${exportFormat === 'xlsx'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <FileSpreadsheet className="w-5 h-5" />
                  <span className="font-medium">Excel (.xls)</span>
                </button>
                <button
                  onClick={() => setExportFormat('csv')}
                  className={`
                    flex items-center gap-2 px-4 py-2 rounded-lg border-2 transition-all
                    ${exportFormat === 'csv'
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 hover:border-slate-300'
                    }
                  `}
                >
                  <FileText className="w-5 h-5" />
                  <span className="font-medium">CSV (.csv)</span>
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="text-sm text-slate-500 mb-2">
                {filteredData.length} รายการจะถูก Export
              </p>
              <button
                onClick={handleExport}
                disabled={isExporting || filteredData.length === 0}
                className={`
                  inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold text-white
                  transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5
                  ${isExporting || filteredData.length === 0
                    ? 'bg-slate-400 cursor-not-allowed'
                    : 'bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700'
                  }
                `}
              >
                {isExporting ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลัง Export...
                  </>
                ) : (
                  <>
                    <FileDown className="w-5 h-5" />
                    Download
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Preview */}
        {filteredData.length > 0 && (
          <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6">
            <h3 className="font-semibold text-slate-800 mb-4">ตัวอย่างข้อมูล (5 รายการแรก)</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-2 px-3 font-semibold text-slate-600">แผนก</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">เดือน</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">Productivity</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">LOS</th>
                    <th className="text-center py-2 px-3 font-semibold text-slate-600">แผลกดทับ</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredData.slice(0, 5).map((record, idx) => (
                    <tr key={idx} className="border-b border-slate-100">
                      <td className="py-2 px-3 text-slate-800">{record.departmentName}</td>
                      <td className="py-2 px-3 text-center text-slate-600">{record.month}</td>
                      <td className="py-2 px-3 text-center">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${parseFloat(record.data.productivityValue || '0') >= 80
                          ? 'bg-emerald-100 text-emerald-700'
                          : 'bg-amber-100 text-amber-700'
                          }`}>
                          {record.data.productivityValue || '-'}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">
                        {record.data.averageLOS || '-'}
                      </td>
                      <td className="py-2 px-3 text-center text-slate-600">
                        {record.data.pressureUlcerRate || '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {filteredData.length > 5 && (
              <p className="text-sm text-slate-400 mt-3 text-center">
                ...และอีก {filteredData.length - 5} รายการ
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
