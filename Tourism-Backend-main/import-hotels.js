const mongoose = require('mongoose');
const XLSX = require('xlsx');
const Location = require('./src/models/location');
const Product = require('./src/models/product');

const MONGO_URI = 'mongodb://127.0.0.1:27017/tourism_db';
const EXCEL_FILE = './NewHotels.xlsx';  // Your Excel file
const BASE_IMAGE_URL = 'http://localhost:3001/assets/images/hotels';

// EXACT sheet name mapping from your Excel file
const SHEET_MAPPING = {
    'شرم': { 
        name_ar: 'شرم الشيخ', 
        name_en: 'Sharm El-Sheikh', 
        slug: 'sharm-el-sheikh',
        startRow: 3  // Data starts at row 4 (0-indexed)
    },
    'غردقه': { 
        name_ar: 'الغردقة', 
        name_en: 'Hurghada', 
        slug: 'hurghada',
        startRow: 3
    },
    'مرسي علم ': {  // Note: There's a space at the end
        name_ar: 'مرسى علم', 
        name_en: 'Marsa Alam', 
        slug: 'marsa-alam',
        startRow: 2  // Different structure
    },
    'العين السخنة ': {  // Note: There's a space at the end
        name_ar: 'العين السخنة', 
        name_en: 'Ain Sokhna', 
        slug: 'ain-sokhna',
        startRow: 4  // Different structure
    },
    'سهل حشيش': { 
        name_ar: 'سهل حشيش', 
        name_en: 'Sahl Hasheesh', 
        slug: 'sahl-hasheesh',
        startRow: 3
    },
    'مكادي باي': { 
        name_ar: 'مكادي باي', 
        name_en: 'Makadi Bay', 
        slug: 'makadi-bay',
        startRow: 2
    },
    'سوماباي': { 
        name_ar: 'سوما باي', 
        name_en: 'Soma Bay', 
        slug: 'soma-bay',
        startRow: 2
    },
    'الجونة': { 
        name_ar: 'الجونة', 
        name_en: 'El Gouna', 
        slug: 'el-gouna',
        startRow: 2
    },
    'طابا': { 
        name_ar: 'طابا', 
        name_en: 'Taba', 
        slug: 'taba',
        startRow: 2
    },
    'نوبيع': { 
        name_ar: 'نوبيع', 
        name_en: 'Nuweiba', 
        slug: 'nuweiba',
        startRow: 2
    },
    'الساحل': { 
        name_ar: 'الساحل الشمالي', 
        name_en: 'North Coast', 
        slug: 'north-coast',
        startRow: 2
    },
    'العلمين': { 
        name_ar: 'العلمين الجديدة', 
        name_en: 'New Alamein', 
        slug: 'new-alamein',
        startRow: 2
    },
    'مطروح': { 
        name_ar: 'مرسى مطروح', 
        name_en: 'Marsa Matrouh', 
        slug: 'marsa-matrouh',
        startRow: 2
    },
    'دهب': { 
        name_ar: 'دهب', 
        name_en: 'Dahab', 
        slug: 'dahab',
        startRow: 2
    },
    'القاهره': { 
        name_ar: 'القاهرة', 
        name_en: 'Cairo', 
        slug: 'cairo',
        startRow: 2
    },
    'بورسعيد': { 
        name_ar: 'بورسعيد', 
        name_en: 'Port Said', 
        slug: 'port-said',
        startRow: 2
    },
    'الفيوم': { 
        name_ar: 'الفيوم', 
        name_en: 'Fayoum', 
        slug: 'fayoum',
        startRow: 2
    },
    'اسكندرية': { 
        name_ar: 'اسكندرية', 
        name_en: 'Alexandria', 
        slug: 'alexandria',
        startRow: 2
    },
    'الاسماعيلية': { 
        name_ar: 'الاسماعيلية', 
        name_en: 'Ismailia', 
        slug: 'ismailia',
        startRow: 2
    },
    'راس البر ': {  // Note: There's a space at the end
        name_ar: 'راس البر', 
        name_en: 'Ras El Bar', 
        slug: 'ras-el-bar',
        startRow: 2
    },
    'سيوة': { 
        name_ar: 'سيوة', 
        name_en: 'Siwa', 
        slug: 'siwa',
        startRow: 2
    }
};

function parseRating(ratingText) {
    if (!ratingText) return 3;
    const text = String(ratingText).toLowerCase();
    
    if (text.includes('خمسه') || text.includes('خمسة') || text.includes('5') || text.includes('خمسه نحوم') || text.includes('خمسه نجوم')) return 5;
    if (text.includes('اربعه') || text.includes('أربعة') || text.includes('4') || text.includes('اربع نجوم') || text.includes('اربعة نجوم')) return 4;
    if (text.includes('ثلاث') || text.includes('ثلاثة') || text.includes('3') || text.includes('ثلاث نجوم') || text.includes('تلات نجوم')) return 3;
    if (text.includes('نجمتين') || text.includes('نجمتن') || text.includes('2')) return 2;
    
    return 3;
}

function parseAmenities(features, mealPlan) {
    const amenities = [];
    const combined = `${features} ${mealPlan}`.toLowerCase();

    if (combined.includes('اكوا بارك') || combined.includes('اكوابارك') || combined.includes('اكوبارك') || combined.includes('أكوابارك')) amenities.push('Aqua Park');
    if (combined.includes('شاطي رملي') || combined.includes('شاطئ رملي') || combined.includes('رملي')) amenities.push('Sandy Beach');
    if (combined.includes('كاملة') || combined.includes('كامله') || combined.includes('كامل')) amenities.push('All Inclusive');
    if (combined.includes('فطار وعشاء') || combined.includes('فطار وعشا') || combined.includes('نصف إقامة')) amenities.push('Half Board');
    if (combined.includes('فطار فقط') || combined.includes('فطارفقط')) amenities.push('Breakfast Only');
    if (combined.includes('سبا') || combined.includes('spa')) amenities.push('Spa');
    if (combined.includes('كيدز') || combined.includes('اطفال')) amenities.push('Kids Area');

    return amenities.length > 0 ? amenities : ['Half Board'];
}

function parsePrice(priceText) {
    if (!priceText) return 0;
    const text = String(priceText).replace(/[^\d]/g, '');
    return parseInt(text) || 0;
}

// Helper function to get column value with fallback
function getColumnValue(row, index, fallback = '') {
    return row && row.length > index ? String(row[index] || '').trim() : fallback;
}

async function run() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('✅ Connected to MongoDB\n');

        console.log('🗑️ Clearing existing data...');
        await Location.deleteMany({});
        await Product.deleteMany({ type: 'hotel' });
        console.log('✅ Old data cleared\n');

        console.log('📖 Reading Excel file:', EXCEL_FILE);
        const workbook = XLSX.readFile(EXCEL_FILE);
        
        // DEBUG: Show all sheet names to verify
        console.log('📋 All sheet names in Excel:');
        workbook.SheetNames.forEach((name, i) => {
            const hasMapping = SHEET_MAPPING[name] ? '✅' : '❌';
            console.log(`  ${i + 1}. "${name}" ${hasMapping}`);
        });
        console.log('');

        const allHotels = [];
        const locationIds = {};
        let hotelCounter = 1;

        console.log('📍 Creating Egyptian Cities from mapping...\n');

        // First, create all locations from mapping
        for (const [sheetName, cityInfo] of Object.entries(SHEET_MAPPING)) {
            // Check if location already created (avoid duplicates)
            let location = await Location.findOne({ slug: cityInfo.slug });
            
            if (!location) {
                location = await Location.create({
                    name: cityInfo.name_en,
                    description: `Hotels and resorts in ${cityInfo.name_en} (${cityInfo.name_ar})`,
                    heroImage: `http://localhost:3001/assets/images/locations/${cityInfo.slug}.jpeg`,
                    is_active: true
                });
                console.log(` ✅ Created: ${cityInfo.name_en.padEnd(20)} (${cityInfo.name_ar})`);
            } else {
                console.log(` ⚠️  Exists: ${cityInfo.name_en.padEnd(20)} (${cityInfo.name_ar})`);
            }
            
            locationIds[sheetName] = location._id;
        }

        console.log(`\n✅ ${Object.keys(locationIds).length} locations ready\n`);
        console.log('🏨 Parsing hotels from Excel sheets...\n');

        let totalHotels = 0;
        let processedSheets = 0;

        // Process each sheet in the workbook
        for (const sheetName of workbook.SheetNames) {
            if (sheetName === 'Sheet22') {
                console.log(` ⏭️  Skipping empty sheet: ${sheetName}`);
                continue;
            }

            if (!SHEET_MAPPING[sheetName]) {
                console.log(` ⚠️  Skipping unmapped sheet: "${sheetName}"`);
                continue;
            }

            const cityInfo = SHEET_MAPPING[sheetName];
            const locationId = locationIds[sheetName];
            const startRow = cityInfo.startRow || 3;

            console.log(` 📄 Processing: ${cityInfo.name_en} (Sheet: "${sheetName}", Start row: ${startRow})`);

            const sheet = workbook.Sheets[sheetName];
            const data = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });
            
            let sheetHotelCount = 0;
            let skippedRows = 0;

            for (let i = startRow; i < data.length; i++) {
                const row = data[i];
                
                // Skip empty rows
                if (!row || row.length === 0 || row.every(cell => !cell || String(cell).trim() === '')) {
                    skippedRows++;
                    continue;
                }

                // Different sheets have different column structures
                // Extract hotel name - try multiple columns
                let hotelName = '';
                
                // Try to find hotel name in various columns
                for (let col = 0; col < Math.min(row.length, 5); col++) {
                    const cell = String(row[col] || '').trim();
                    if (cell && cell.length > 2 && !cell.includes('المستوى') && !cell.includes('المستوي') && 
                        !cell.includes('الوصف') && !cell.includes('نوع') && !cell.includes('السعر') &&
                        !cell.includes('البحر') && !cell.includes('الموقع') && !cell.includes('المميزات')) {
                        hotelName = cell;
                        break;
                    }
                }
                
                if (!hotelName || hotelName.length < 2) {
                    skippedRows++;
                    continue;
                }

                // Parse other fields based on sheet structure
                let ratingText = '';
                let location = '';
                let beachLine = '';
                let features = '';
                let mealPlan = '';
                let priceText = '';

                // Find these fields in the row
                for (let col = 0; col < row.length; col++) {
                    const cell = String(row[col] || '').trim().toLowerCase();
                    
                    if (cell.includes('نجم') || cell.includes('مستوى') || cell.includes('مستوي')) {
                        ratingText = String(row[col] || '').trim();
                    } else if (cell.includes('موقع') || cell.includes('وصف') || (cell.length > 3 && !isNaN(parseInt(cell[0])) === false)) {
                        // This might be location/area description
                        if (!location && cell.length > 2) {
                            location = String(row[col] || '').trim();
                        }
                    } else if (cell.includes('بحر') || cell.includes('صف')) {
                        beachLine = String(row[col] || '').trim();
                    } else if (cell.includes('مميز') || cell.includes('اكوا') || cell.includes('اكوابارك') || cell.includes('شاطي')) {
                        features = String(row[col] || '').trim();
                    } else if (cell.includes('نوع') || cell.includes('إقام') || cell.includes('فاقام') || 
                               cell.includes('فطار') || cell.includes('كامل') || cell.includes('كامله')) {
                        mealPlan = String(row[col] || '').trim();
                    } else if (!isNaN(parseInt(cell.replace(/[^\d]/g, ''))) && parseInt(cell.replace(/[^\d]/g, '')) > 100) {
                        priceText = String(row[col] || '').trim();
                    }
                }

                // If we couldn't find price in the loop, check the last few columns
                if (!priceText && row.length > 0) {
                    for (let col = Math.max(0, row.length - 3); col < row.length; col++) {
                        const cell = String(row[col] || '').trim();
                        const numValue = parseInt(cell.replace(/[^\d]/g, ''));
                        if (numValue && numValue > 100 && numValue < 50000) {
                            priceText = cell;
                            break;
                        }
                    }
                }

                const rating = parseRating(ratingText);
                const price = parsePrice(priceText);
                const amenities = parseAmenities(features, mealPlan);

                const imageFilename = `hotel-${String(hotelCounter).padStart(3, '0')}.jpeg`;
                const imageUrl = `${BASE_IMAGE_URL}/${imageFilename}`;

                // Hotel details structure for booking
                const hotelDetails = {
                    rating: rating,
                    area: location || cityInfo.name_en,
                    beach_line: beachLine,
                    features: features || '',
                    room_types: ['single', 'double', 'triple'],
                    meal_plan: mealPlan || 'فطار وعشاء',
                    amenities_per_type: {
                        single: amenities,
                        double: amenities,
                        triple: amenities
                    },
                    available_rooms: {
                        single: 20,
                        double: 30,
                        triple: 15
                    },
                    prices_per_night: {
                        single: Math.round(price * 0.8) || 2500,
                        double: price || 3500,
                        triple: Math.round(price * 1.4) || 5000
                    },
                    img: imageUrl
                };

                const description = `${hotelName} - ${cityInfo.name_en}. ${location ? `Located in ${location}` : ''}${beachLine ? `, ${beachLine}` : ''}${features ? `. Features: ${features}` : ''}. ${mealPlan || 'Contact for booking'}`;

                const hotel = {
                    name: hotelName,
                    type: 'hotel',
                    description: description.trim(),
                    location_id: locationId,
                    is_active: true,
                    details: hotelDetails
                };

                allHotels.push(hotel);
                hotelCounter++;
                sheetHotelCount++;
                totalHotels++;
            }

            console.log(` ✅ ${sheetHotelCount} hotels parsed (${skippedRows} rows skipped)`);
            processedSheets++;
        }

        console.log(`\n✅ Total hotels parsed: ${allHotels.length} from ${processedSheets} sheets\n`);

        if (allHotels.length === 0) {
            console.log('❌ ERROR: No hotels were parsed. Check Excel file structure.');
            await mongoose.disconnect();
            process.exit(1);
        }

        console.log('💾 Inserting hotels to MongoDB...');
        const insertedHotels = await Product.insertMany(allHotels);
        console.log(`✅ Inserted ${insertedHotels.length} hotels!\n`);

        // Verification: Count hotels per location
        console.log('='.repeat(70));
        console.log('📊 VERIFICATION - Hotels per City');
        console.log('='.repeat(70));
        
        for (const [sheetName, cityInfo] of Object.entries(SHEET_MAPPING)) {
            if (locationIds[sheetName]) {
                const hotelCount = await Product.countDocuments({ 
                    type: 'hotel', 
                    location_id: locationIds[sheetName] 
                });
                console.log(`📍 ${cityInfo.name_en.padEnd(25)}: ${hotelCount} hotels`);
            }
        }
        
        console.log('='.repeat(70));
        console.log('📊 IMPORT SUMMARY');
        console.log('='.repeat(70));
        console.log(`✅ Locations created: ${Object.keys(SHEET_MAPPING).length}`);
        console.log(`✅ Hotels imported: ${insertedHotels.length}`);
        console.log(`✅ First hotel: ${insertedHotels[0]?.name || 'N/A'}`);
        console.log(`✅ Sample price: ${insertedHotels[0]?.details?.prices_per_night?.double || 'N/A'} EGP (double)`);
        console.log('='.repeat(70));
        
        console.log('\n🎉 IMPORT COMPLETE!');
        console.log('\n🧪 Test your API:');
        console.log('  1. Start backend: node server.js');
        console.log('  2. Test endpoint: curl http://localhost:3001/api/locations');
        console.log('  3. Test hotels: curl http://localhost:3001/api/products?type=hotel');
        console.log('\n✅ Your tourism app is now ready with all hotels!');

        await mongoose.disconnect();

    } catch (err) {
        console.error('❌ Error:', err);
        console.error('Stack:', err.stack);
        process.exit(1);
    }
}

run();