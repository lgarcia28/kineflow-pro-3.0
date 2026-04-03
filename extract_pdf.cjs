const fs = require('fs');
const pdf = require('pdf-parse');

let dataBuffer = fs.readFileSync('Eval. func. García Leonel 13-02-26.pdf');

pdf(dataBuffer).then(function(data) {
    fs.writeFileSync('pdf_content.txt', data.text);
    console.log('PDF text extracted to pdf_content.txt');
}).catch(err => {
    console.error('Error parsing PDF:', err);
});
