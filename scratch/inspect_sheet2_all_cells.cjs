const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['Resultados'];
  
  const cells = [];
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    const val = String(cell.v || '').trim();
    if (val.toLowerCase().includes('foto') || val.toLowerCase().includes('imagen') || val.toLowerCase().includes('photo') || val.toLowerCase().includes('img')) {
      console.log(`Cell ${cellAddress}: [${cell.v}]`);
    }
  }
} catch (e) {
  console.error(e);
}
