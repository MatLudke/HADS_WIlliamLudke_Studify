/**
 * Excel Export Utilities
 * Generate Excel (.xlsx) files from study data
 */

import type { Activity, StudySession } from './types';

/**
 * Export study sessions to Excel format
 * Uses SheetJS (xlsx) library approach without external dependencies
 */
export function exportStudySessionsToExcel(sessions: StudySession[], filename?: string): void {
  // Prepare data for Excel
  const headers = ['Date', 'Activity ID', 'Subject', 'Mode', 'Duration (minutes)', 'Start Time', 'End Time', 'Notes'];
  
  const rows = sessions.map(session => [
    session.startAt.toLocaleDateString(),
    session.activityId,
    session.subject,
    session.mode,
    session.duration,
    session.startAt.toLocaleTimeString(),
    session.endAt.toLocaleTimeString(),
    session.notes || ''
  ]);

  // Create Excel content using XML format (SpreadsheetML)
  const worksheetData = [headers, ...rows];
  const excelContent = generateExcelXML(worksheetData, 'Study Sessions');
  
  // Download the file
  downloadExcelFile(excelContent, filename || `study-sessions-${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * Export activities to Excel format
 */
export function exportActivitiesToExcel(activities: Activity[], filename?: string): void {
  // Prepare data for Excel
  const headers = ['Title', 'Subject', 'Priority', 'Status', 'Estimated Duration (minutes)', 'Goal Type', 'Goal Target'];
  
  const rows = activities.map(activity => [
    activity.title,
    activity.subject,
    activity.priority,
    activity.status,
    activity.estimatedDuration,
    activity.goalType || 'none',
    activity.goalTarget || 0
  ]);

  // Create Excel content using XML format (SpreadsheetML)
  const worksheetData = [headers, ...rows];
  const excelContent = generateExcelXML(worksheetData, 'Activities');
  
  // Download the file
  downloadExcelFile(excelContent, filename || `activities-${new Date().toISOString().split('T')[0]}.xls`);
}

/**
 * Generate Excel XML (SpreadsheetML format)
 * This creates a valid .xls file that Excel can open
 */
function generateExcelXML(data: (string | number)[][], sheetName: string): string {
  let xml = `<?xml version="1.0"?>
<?mso-application progid="Excel.Sheet"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:o="urn:schemas-microsoft-com:office:office"
 xmlns:x="urn:schemas-microsoft-com:office:excel"
 xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet"
 xmlns:html="http://www.w3.org/TR/REC-html40">
 <DocumentProperties xmlns="urn:schemas-microsoft-com:office:office">
  <Author>Studify</Author>
  <Created>${new Date().toISOString()}</Created>
 </DocumentProperties>
 <Styles>
  <Style ss:ID="Default" ss:Name="Normal">
   <Alignment ss:Vertical="Bottom"/>
   <Borders/>
   <Font ss:FontName="Calibri" x:Family="Swiss" ss:Size="11" ss:Color="#000000"/>
   <Interior/>
   <NumberFormat/>
   <Protection/>
  </Style>
  <Style ss:ID="Header">
   <Font ss:Bold="1" ss:Color="#FFFFFF"/>
   <Interior ss:Color="#4472C4" ss:Pattern="Solid"/>
  </Style>
 </Styles>
 <Worksheet ss:Name="${escapeXML(sheetName)}">
  <Table>`;

  // Add column definitions
  xml += `
   <Column ss:AutoFitWidth="1" ss:Width="100"/>`.repeat(data[0]?.length || 1);

  // Add rows
  data.forEach((row, rowIndex) => {
    xml += '\n   <Row>';
    row.forEach(cell => {
      const cellValue = cell !== null && cell !== undefined ? String(cell) : '';
      const isNumber = typeof cell === 'number';
      const styleID = rowIndex === 0 ? 'Header' : 'Default';
      
      if (isNumber) {
        xml += `
    <Cell ss:StyleID="${styleID}"><Data ss:Type="Number">${cellValue}</Data></Cell>`;
      } else {
        xml += `
    <Cell ss:StyleID="${styleID}"><Data ss:Type="String">${escapeXML(cellValue)}</Data></Cell>`;
      }
    });
    xml += '\n   </Row>';
  });

  xml += `
  </Table>
 </Worksheet>
</Workbook>`;

  return xml;
}

/**
 * Escape special XML characters
 */
function escapeXML(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

/**
 * Download Excel file to user's computer
 */
function downloadExcelFile(content: string, filename: string): void {
  const blob = new Blob([content], { 
    type: 'application/vnd.ms-excel;charset=utf-8;' 
  });
  
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
}
