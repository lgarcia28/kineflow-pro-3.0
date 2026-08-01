const fs = require('fs');
const path = require('path');

const mediaDir = 'excel_extracted/xl/media';
if (fs.existsSync(mediaDir)) {
  const files = fs.readdirSync(mediaDir);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      const filePath = path.join(mediaDir, file);
      const buffer = fs.readFileSync(filePath);
      
      console.log(`\n=== File: ${file} ===`);
      console.log(`Size: ${buffer.length} bytes`);
      
      // Let's search for ascii strings in the buffer of length >= 4
      let strings = [];
      let currentStr = '';
      for (let i = 0; i < buffer.length; i++) {
        const charCode = buffer[i];
        if (charCode >= 32 && charCode <= 126) {
          currentStr += String.fromCharCode(charCode);
        } else {
          if (currentStr.length >= 4) {
            strings.push(currentStr);
          }
          currentStr = '';
        }
      }
      if (currentStr.length >= 4) {
        strings.push(currentStr);
      }
      
      // Filter strings to find any interesting keywords (like creator, software, keywords, titles)
      const filtered = strings.filter(s => 
        s.includes('Title') || s.includes('Description') || s.includes('Author') || 
        s.includes('Copyright') || s.includes('Creation') || s.includes('Software') || 
        s.includes('Adobe') || s.includes('Photoshop') || s.includes('GIMP') || 
        s.includes('Excel') || s.includes('Screenshot') || s.toLowerCase().includes('thomas') || 
        s.toLowerCase().includes('kineflow') || s.toLowerCase().includes('test')
      );
      
      console.log('Interesting strings:', filtered.slice(0, 10));
    }
  });
}
