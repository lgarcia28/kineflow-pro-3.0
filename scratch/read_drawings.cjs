const fs = require('fs');
const path = require('path');

const files = [
  'excel_extracted/xl/drawings/drawing1.xml',
  'excel_extracted/xl/drawings/drawing2.xml',
  'excel_extracted/xl/drawings/drawing3.xml'
];

files.forEach(file => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`\n=== File: ${file} ===`);
    // Find plain text inside drawing XML (often in <a:t> or <descr> or similar)
    const matches = content.match(/<a:t>([^<]+)<\/a:t>/g);
    if (matches) {
      console.log('Text nodes found:');
      console.log(matches.slice(0, 30).map(m => m.replace(/<\/?a:t>/g, '')).join(', '));
    } else {
      console.log('No text nodes found');
    }

    // Look for shape descriptions or names
    const descrMatches = content.match(/descr="([^"]+)"/g);
    if (descrMatches) {
      console.log('Descriptions:');
      console.log(descrMatches.slice(0, 30).join(', '));
    }

    const nameMatches = content.match(/name="([^"]+)"/g);
    if (nameMatches) {
      console.log('Names:');
      console.log(nameMatches.slice(0, 30).join(', '));
    }
  } else {
    console.log(`${file} does not exist`);
  }
});
