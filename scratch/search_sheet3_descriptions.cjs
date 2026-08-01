const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['Definición operativa'];
  
  let count = 0;
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const cell = sheet[cellAddress];
    const val = String(cell.v || '').toLowerCase();
    if (val.includes('foto') || val.includes('imagen') || val.includes('registro') || val.includes('captura') || val.includes('cámara') || val.includes('video') || val.includes('graba')) {
      console.log(`Cell ${cellAddress}: [V: ${cell.v}]`);
      count++;
    }
  }
  console.log(`Found ${count} matching cells in Sheet 3.`);
} catch (e) {
  console.error(e);
}
