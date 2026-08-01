const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx');
  const sheet = workbook.Sheets['A completar'];
  
  if (sheet['!merges']) {
    console.log('Merged cells in Sheet 1 ("A completar"):');
    sheet['!merges'].forEach(merge => {
      const startCell = XLSX.utils.encode_cell({ r: merge.s.r, c: merge.s.c });
      const endCell = XLSX.utils.encode_cell({ r: merge.e.r, c: merge.e.c });
      
      // Get the value of the top-left cell
      const cell = sheet[startCell];
      const val = cell ? cell.v : '';
      console.log(`${startCell}:${endCell} - [V: ${val}]`);
    });
  } else {
    console.log('No merged cells in Sheet 1.');
  }
} catch (e) {
  console.error(e);
}
