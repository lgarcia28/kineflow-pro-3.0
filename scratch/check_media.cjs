const fs = require('fs');
const path = require('path');

// Read drawings relationships
const relsFile = 'excel_extracted/xl/drawings/_rels/drawing2.xml.rels';
if (fs.existsSync(relsFile)) {
  const content = fs.readFileSync(relsFile, 'utf8');
  console.log('--- Drawing 2 relationships ---');
  console.log(content);
}

// Search for worksheet relations
const wsRelsDir = 'excel_extracted/xl/worksheets/_rels';
if (fs.existsSync(wsRelsDir)) {
  fs.readdirSync(wsRelsDir).forEach(file => {
    const content = fs.readFileSync(path.join(wsRelsDir, file), 'utf8');
    console.log(`\n--- Worksheet Rel: ${file} ---`);
    console.log(content);
  });
}
