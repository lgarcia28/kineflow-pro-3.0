const fs = require('fs');
const path = require('path');

const commentsFiles = [
  'excel_extracted/xl/comments1.xml',
  'excel_extracted/xl/comments2.xml',
  'excel_extracted/xl/comments3.xml'
];

commentsFiles.forEach((file, idx) => {
  if (fs.existsSync(file)) {
    const content = fs.readFileSync(file, 'utf8');
    console.log(`\n--- Comments in Sheet ${idx + 1} (${file}) ---`);
    // Extract text from <text> or <r> tags
    const matches = content.match(/<t>([^<]+)<\/t>/g);
    if (matches) {
      console.log(matches.map(m => m.replace(/<\/?t>/g, '')).join('\n'));
    } else {
      console.log('No comments found');
    }
  } else {
    console.log(`${file} does not exist`);
  }
});
