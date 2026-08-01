const fs = require('fs');
const path = require('path');

const relsDir = 'excel_extracted/xl/drawings/_rels';
if (fs.existsSync(relsDir)) {
  fs.readdirSync(relsDir).forEach(file => {
    const content = fs.readFileSync(path.join(relsDir, file), 'utf8');
    console.log(`\n--- Drawing Rel: ${file} ---`);
    console.log(content);
  });
} else {
  console.log('Dir not found');
}
