const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== Sheet: ${sheetName} ===`);
    const sheet = workbook.Sheets[sheetName];
    let count = 0;
    for (const cellAddress in sheet) {
      if (cellAddress.startsWith('!')) continue;
      const cell = sheet[cellAddress];
      const val = String(cell.v || '').toLowerCase();
      if (val.includes('foto') || val.includes('imagen') || val.includes('upload') || val.includes('subir') || val.includes('thomas')) {
        console.log(`Cell ${cellAddress}: [V: ${cell.v}]`);
        count++;
      }
    }
    console.log(`Found ${count} matching cells.`);
  });
} catch (e) {
  console.error(e);
}
