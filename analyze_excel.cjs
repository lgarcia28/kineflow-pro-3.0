const fs = require('fs');

try {
    const data = JSON.parse(fs.readFileSync('spreadsheet_data.json', 'utf8'));
    const sheet = data['A completar'];
    
    if (!sheet) {
        console.error('Sheet "A completar" not found');
        process.exit(1);
    }

    const variables = [];
    const rows = 300;
    
    for (let r = 1; r <= rows; r++) {
        const label = sheet['B' + r];
        if (label && label.trim().length > 1) {
            variables.push({
                row: r,
                label: label.trim()
            });
        }
    }

    console.log(JSON.stringify(variables, null, 2));
} catch (err) {
    console.error('Error:', err.message);
}
