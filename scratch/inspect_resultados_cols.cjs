const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx', { cellFormula: true });
  const sheet = workbook.Sheets['Resultados'];
  
  console.log('Sheet keys:', Object.keys(sheet).filter(k => !k.startsWith('!')));
  
  // Group cells by row
  const rows = {};
  for (const cellAddress in sheet) {
    if (cellAddress.startsWith('!')) continue;
    const match = cellAddress.match(/^([A-Z]+)([0-9]+)$/);
    if (!match) continue;
    const col = match[1];
    const row = parseInt(match[2]);
    if (!rows[row]) rows[row] = {};
    rows[row][col] = sheet[cellAddress];
  }
  
  const sortedRows = Object.keys(rows).map(Number).sort((a, b) => a - b);
  
  console.log('Total rows in Resultados:', sortedRows.length);
  
  // Let's print rows that have formulas or text to see their layout
  sortedRows.forEach(rowNum => {
    const row = rows[rowNum];
    const cols = Object.keys(row).sort();
    
    // We only care about rows that contain a formula in column B or other columns, or have labels
    const hasFormula = cols.some(col => row[col].f);
    const hasVal = cols.some(col => row[col].v !== undefined && row[col].v !== null);
    
    if (hasFormula || (rowNum < 50 && hasVal)) {
      const parts = cols.map(col => {
        const cell = row[col];
        let valStr = '';
        if (cell.f) {
          valStr = `[F: ${cell.f}]`;
        } else {
          valStr = `[V: ${cell.v}]`;
        }
        return `${col}: ${valStr}`;
      });
      console.log(`Row ${rowNum}: ${parts.join(' | ')}`);
    }
  });
} catch (e) {
  console.error(e);
}
