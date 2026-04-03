import { createRequire } from 'module';
import * as fs from 'fs';
const require = createRequire(import.meta.url);
const XLSX = require('xlsx');

try {
    const workbook = XLSX.readFile('Informe General 2026.xlsx', { cellFormula: true });
    const result = {};

    workbook.SheetNames.forEach(sheetName => {
        const sheet = workbook.Sheets[sheetName];
        result[sheetName] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
        
        result[sheetName + '_formulas'] = {};
        for (let cell in sheet) {
            if (sheet[cell] && sheet[cell].f) {
                result[sheetName + '_formulas'][cell] = sheet[cell].f;
            }
        }
    });

    fs.writeFileSync('spreadsheet_data.json', JSON.stringify(result, null, 2));
    console.log('Data extracted to spreadsheet_data.json');
} catch (error) {
    console.error('Error reading the Excel file:', error);
}
