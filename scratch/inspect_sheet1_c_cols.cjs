const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['A completar'];
  
  for (let r = 250; r <= 280; r++) {
    const rowCells = [];
    for (let c = 0; c < 6; c++) {
      const colLetter = XLSX.utils.encode_col(c);
      const cellAddress = colLetter + r;
      const cell = sheet[cellAddress];
      const val = cell ? cell.v : '';
      rowCells.push(`${colLetter}: [${val !== undefined ? val : ''}]`);
    }
    console.log(`Row ${r}: ${rowCells.join(' | ')}`);
  }
} catch (e) {
  console.error(e);
}
