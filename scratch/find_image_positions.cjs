const fs = require('fs');

const drawingFile = 'excel_extracted/xl/drawings/drawing2.xml';
if (fs.existsSync(drawingFile)) {
  const content = fs.readFileSync(drawingFile, 'utf8');
  
  // Look for anchors. Excel anchors can be twoCellAnchor or oneCellAnchor
  const regex = /<xdr:(twoCellAnchor|oneCellAnchor)[^>]*>([\s\S]*?)<\/xdr:\1>/g;
  let match;
  let index = 1;
  while ((match = regex.exec(content)) !== null) {
    const anchorType = match[1];
    const anchorContent = match[2];
    
    // Get from col/row
    const fromColMatch = anchorContent.match(/<xdr:col>(\d+)<\/xdr:col>/);
    const fromRowMatch = anchorContent.match(/<xdr:row>(\d+)<\/xdr:row>/);
    
    // Get to col/row if twoCellAnchor
    let toCol = null, toRow = null;
    const toMatch = anchorContent.match(/<xdr:to>([\s\S]*?)<\/xdr:to>/);
    if (toMatch) {
      const tc = toMatch[1].match(/<xdr:col>(\d+)<\/xdr:col>/);
      const tr = toMatch[1].match(/<xdr:row>(\d+)<\/xdr:row>/);
      if (tc) toCol = tc[1];
      if (tr) toRow = tr[1];
    }
    
    const fromCol = fromColMatch ? fromColMatch[1] : '?';
    const fromRow = fromRowMatch ? fromRowMatch[1] : '?';
    
    // Check if it has a picture or a chart
    const hasPic = anchorContent.includes('<xdr:pic>');
    const hasChart = anchorContent.includes('<c:chart>');
    
    let relId = null;
    const relMatch = anchorContent.match(/r:embed="([^"]+)"/) || anchorContent.match(/r:id="([^"]+)"/);
    if (relMatch) relId = relMatch[1];
    
    let name = null;
    const nameMatch = anchorContent.match(/name="([^"]+)"/);
    if (nameMatch) name = nameMatch[1];
    
    if (hasPic) {
      console.log(`Anchor ${index}: PICTURE (${name}) | From: Col ${fromCol}, Row ${fromRow} | To: Col ${toCol}, Row ${toRow} | RelId: ${relId} | Type: ${anchorType}`);
    } else if (hasChart) {
      console.log(`Anchor ${index}: CHART (${name}) | From: Col ${fromCol}, Row ${fromRow} | To: Col ${toCol}, Row ${toRow} | RelId: ${relId} | Type: ${anchorType}`);
    } else {
      console.log(`Anchor ${index}: OTHER | From: Col ${fromCol}, Row ${fromRow} | RelId: ${relId} | Type: ${anchorType}`);
    }
    index++;
  }
} else {
  console.log('File not found');
}
