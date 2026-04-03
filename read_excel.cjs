const XLSX = require('xlsx');

try {
  const workbook = XLSX.readFile('Informe General 2026.xlsx', { cellFormula: true });
  console.log('--- SHEETS ---');
  console.log(workbook.SheetNames);
  
  workbook.SheetNames.forEach(sheetName => {
    console.log(`\n=== SHEET: ${sheetName} ===`);
    const worksheet = workbook.Sheets[sheetName];
    
    // Convert to JSON just to see the headers/data representation
    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    console.log(`Dumping first 15 rows:`);
    console.log(JSON.stringify(json.slice(0, 15), null, 2));

    // Let's also look for cells that have formulas
    console.log(`\nFormulas found in ${sheetName}:`);
    for (const cellAddress in worksheet) {
      if (cellAddress[0] === '!') continue;
      const cell = worksheet[cellAddress];
      if (cell && cell.f) {
        console.log(`Cell ${cellAddress}: Formula -> ${cell.f} | Value -> ${cell.v}`);
      }
    }
  });
} catch (e) {
  console.error(e);
}
