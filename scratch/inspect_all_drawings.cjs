const fs = require('fs');
const path = require('path');

const drawingsDir = 'excel_extracted/xl/drawings';
if (fs.existsSync(drawingsDir)) {
  const files = fs.readdirSync(drawingsDir);
  files.forEach(file => {
    const filePath = path.join(drawingsDir, file);
    if (fs.statSync(filePath).isFile()) {
      const content = fs.readFileSync(filePath, 'utf8');
      console.log(`\n=== File: ${file} ===`);
      
      // Look for relationship IDs or image files
      const relMatches = content.match(/r:embed="([^"]+)"/g) || [];
      const imageMatches = content.match(/image\d+\.png/g) || [];
      const chartMatches = content.match(/chart\d+\.xml/g) || [];
      
      console.log(`Length of content: ${content.length}`);
      console.log(`Embed relationships: ${relMatches.length}`);
      console.log(`Image matches: ${imageMatches.length}`);
      console.log(`Chart matches: ${chartMatches.length}`);
      
      if (file.endsWith('.vml')) {
        // VML files might have image references or shape definitions
        const shapes = content.match(/<v:shape[^>]*>/g) || [];
        const images = content.match(/<v:imagedata[^>]*>/g) || [];
        console.log(`VML Shapes: ${shapes.length}`);
        console.log(`VML Images: ${images.length}`);
        if (images.length > 0) {
          images.forEach(img => console.log('  Image data:', img));
        }
      }
    }
  });
} else {
  console.log('Drawings directory not found');
}
