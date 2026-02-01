const XLSX = require('xlsx');

const workbook = XLSX.readFile('Hotels.xlsx');
const sheetName = workbook.SheetNames[0];
const worksheet = workbook.Sheets[sheetName];

// Try multiple parsing strategies
console.log('🔍 Sheet name:', sheetName);
console.log('📊 All sheet names:', workbook.SheetNames);

// Method 1: Raw cell data (see everything)
const range = XLSX.utils.decode_range(worksheet['!ref']);
console.log('\n📋 First 10 rows (raw cells):');
for (let R = 0; R < Math.min(10, range.e.r + 1); R++) {
  let row = [];
  for (let C = 0; C < Math.min(20, range.e.c + 1); C++) {
    const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
    const cell = worksheet[cell_address];
    row.push(cell ? cell.v : '');
  }
  console.log(row.join(' | '));
}

// Method 2: JSON with header detection
const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
console.log('\n📈 JSON rows (first 5):');
jsonData.slice(0, 5).forEach((row, i) => {
  console.log(`Row ${i}:`, row);
});

// Method 3: Auto-detect headers
const dataWithHeaders = XLSX.utils.sheet_to_json(worksheet);
console.log('\n🏷️ Auto-detected headers:', Object.keys(dataWithHeaders[0] || {}));
