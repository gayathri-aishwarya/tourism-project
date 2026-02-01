const XLSX = require('xlsx');

async function debugHotels() {
  console.log('🔍 DEBUGGING Excel structure...');
  
  const workbook = XLSX.readFile('Hotels.xlsx');
  const worksheet = workbook.Sheets['Sheet1'];
  const range = XLSX.utils.decode_range(worksheet['!ref']);
  
  console.log('📐 Range:', range.s.r, 'to', range.e.r, '(total rows:', range.e.r + 1, ')');
  
  for (let R = 0; R <= 10; R++) {
    console.log(`\n--- Row ${R} ---`);
    const row = [];
    for (let C = 0; C <= 15; C++) {
      const cell_address = XLSX.utils.encode_cell({ r: R, c: C });
      const cell = worksheet[cell_address];
      const value = cell ? cell.v : '';
      row.push(value);
      if (value) console.log(`  Col ${C} (${cell_address}): "${value}"`);
    }
    console.log('Full row:', JSON.stringify(row));
  }
}

debugHotels();

