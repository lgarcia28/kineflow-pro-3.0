const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['Definición operativa'];
  
  const range = XLSX.utils.decode_range(sheet['!ref']);
  for (let r = range.s.r; r <= range.e.r; r++) {
    const cellA = sheet[XLSX.utils.encode_cell({r, c: 0})];
    const cellB = sheet[XLSX.utils.encode_cell({r, c: 1})];
    const valA = cellA && cellA.v !== undefined ? String(cellA.v).trim() : '';
    const valB = cellB && cellB.v !== undefined ? String(cellB.v).trim() : '';
    if (valA || valB) {
      console.log(`Row ${r + 1} | A: ${valA} | B: ${valB}`);
    }
  }
} catch (e) {
  console.error(e);
}
