const fs = require('fs');
const path = require('path');

const srcDir = 'excel_extracted/xl/media';
const destDir = '/Users/leonel/.gemini/antigravity/brain/7db5fd61-0262-4208-9ac5-6f9a9365f19e';

if (fs.existsSync(srcDir)) {
  const files = fs.readdirSync(srcDir);
  files.forEach(file => {
    if (file.endsWith('.png')) {
      const srcPath = path.join(srcDir, file);
      const destPath = path.join(destDir, file);
      fs.copyFileSync(srcPath, destPath);
      console.log(`Copied ${file} to artifacts`);
    }
  });
} else {
  console.log('Source directory not found');
}
