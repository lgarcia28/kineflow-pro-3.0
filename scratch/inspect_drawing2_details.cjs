const fs = require('fs');

const drawingFile = 'excel_extracted/xl/drawings/drawing2.xml';
if (fs.existsSync(drawingFile)) {
  const content = fs.readFileSync(drawingFile, 'utf8');
  
  // Find all <xdr:oneCellAnchor> or <xdr:twoCellAnchor> that contain <xdr:pic>
  const regex = /<xdr:(twoCellAnchor|oneCellAnchor)[^>]*>([\s\S]*?)<\/xdr:\1>/g;
  let match;
  while ((match = regex.exec(content)) !== null) {
    const anchorContent = match[2];
    if (anchorContent.includes('<xdr:pic>')) {
      console.log('\n--- PICTURE ANCHOR ---');
      console.log(match[0].substring(0, 1500)); // print first 1500 chars of the anchor
    }
  }
} else {
  console.log('File not found');
}
