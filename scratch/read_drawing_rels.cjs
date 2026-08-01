const fs = require('fs');
const path = require('path');

const relsDir = 'excel_extracted/xl/drawings/_rels';
if (fs.existsSync(relsDir)) {
  fs.readdirSync(relsDir).forEach(file => {
    const filePath = path.join(relsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    
    // Extract targets
    const targets = [];
    const regex = /Target="([^"]+)"/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
      targets.push(match[1]);
    }
    
    console.log(`\nFile: ${file}`);
    console.log(`Targets:`, targets.filter(t => t.includes('media') || t.includes('image')));
  });
} else {
  console.log('Dir not found');
}
