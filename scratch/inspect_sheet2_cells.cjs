const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['Resultados'];
  
  for (let r = 1; r <= 15; r++) {
    const rowCells = [];
    for (let c = 0; c < 15; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const cellAddress = colLetter + r;
      const cell = sheet[cellAddress];
      if (cell && cell.v !== undefined) {
        rowCells.push(`${colLetter}: [${cell.v}]`);
      }
    }
    if (rowCells.length > 0) {
      console.log(`Row ${r}: ${rowCells.join(' | ')}`);
    }
  }
} catch (e) {
  console.error(e);
}
