const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['A completar'];
  
  const cells = [];
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    const val = String(cell.v || '').trim();
    if (val.toLowerCase().includes('foto') || val.toLowerCase().includes('imagen') || val.toLowerCase().includes('photo') || val.toLowerCase().includes('img')) {
      console.log(`Cell ${cellAddress}: [${cell.v}]`);
    }
    // Collect cell values to search for placeholders
    cells.push({ address: cellAddress, value: val });
  }
  
  console.log(`Total non-empty cells in Sheet 1: ${cells.length}`);
} catch (e) {
  console.error(e);
}
