const fs = require('fs');
const path = require('path');

const chartsDir = 'excel_extracted/xl/charts';
if (fs.existsSync(chartsDir)) {
  const files = fs.readdirSync(chartsDir).filter(f => f.endsWith('.xml'));
  // Sort files numerically by chart number
  files.sort((a, b) => {
    const numA = parseInt(a.replace(/[^0-9]/g, ''));
    const numB = parseInt(b.replace(/[^0-9]/g, ''));
    return numA - numB;
  });

  files.forEach(file => {
    const content = fs.readFileSync(path.join(chartsDir, file), 'utf8');
    
    // Look for chart titles inside <c:title>
    // Title can be in <c:v> or <a:t>
    let title = null;
    
    const vMatch = content.match(/<c:v>([^<]+)<\/c:v>/);
    if (vMatch) {
      title = vMatch[1];
    } else {
      const tMatches = content.match(/<a:t>([^<]+)<\/a:t>/g);
      if (tMatches) {
        title = tMatches.map(t => t.replace(/<\/?a:t>/g, '')).join(' ');
      }
    }
    
    console.log(`${file}: ${title || 'No title found'}`);
  });
} else {
  console.log('Dir not found');
}
