const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Festival = require('../models/Festival');

// Helper function to determine festival category
function determineFestivalCategory(festivalName) {
    const lowerName = festivalName.toLowerCase();
    
    // Check for Muslim festivals
    const muslimKeywords = ['eid', 'ramzan', 'ramadan', 'muharram', 'shab-e-barat', 
                            'shab-e-qadr', 'milad', 'bakrid', 'muslim', 'islam', 
                            'jamadilakhar', 'rajab'];
    
    for (const keyword of muslimKeywords) {
        if (lowerName.includes(keyword)) {
            return 'muslim';
        }
    }
    
    // Check for Hindu festivals
    const hinduKeywords = ['diwali', 'holi', 'navratri', 'dussehra', 'ganesh', 
                          'durga', 'ram', 'krishna', 'shiv', 'hanuman', 'puja',
                          'ekadashi', 'sankranti', 'purnima', 'amavasya', 'chaturthi',
                          'ashtami', 'jayanti', 'pradosh', 'shivaratri', 'panchmi'];
    
    for (const keyword of hinduKeywords) {
        if (lowerName.includes(keyword)) {
            return 'hindu';
        }
    }
    
    // Default to 'other' for non-categorized festivals
    return 'other';
}

// Helper function to parse date from CSV
function parseDate(dateIso, dateLabel, festivalName) {
    // Try ISO format first
    if (dateIso && dateIso !== '') {
        const parsed = new Date(dateIso);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    
    // If date_label has format like "01.01.2025"
    if (dateLabel && dateLabel.includes('.')) {
        const parts = dateLabel.split('.');
        if (parts.length === 3) {
            const day = parseInt(parts[0]);
            const month = parseInt(parts[1]) - 1; // JS months are 0-indexed
            const year = parseInt(parts[2]);
            const date = new Date(year, month, day);
            if (!isNaN(date.getTime())) {
                return date;
            }
        }
    }
    
    // Try format: "January 1, 2026 / ०१ जानेवारी २०२६"
    if (dateLabel && dateLabel.includes(',')) {
        // Extract the English date part before the "/"
        const englishPart = dateLabel.split('/')[0].trim();
        const parsed = new Date(englishPart);
        if (!isNaN(parsed.getTime())) {
            return parsed;
        }
    }
    
    // Fallback: set to null and log warning
    console.warn(`⚠️  Could not parse date for festival: ${festivalName}`);
    return null;
}

// Helper function to determine if festival is recurring (changes date yearly)
function isRecurringFestival(festivalName) {
    const lowerName = festivalName.toLowerCase();
    
    // Festivals that follow lunar calendar (dates change every year)
    const recurringKeywords = [
        'ekadashi', 'purnima', 'amavasya', 'chaturthi', 'navratri', 
        'dussehra', 'diwali', 'holi', 'ganesh', 'durga', 'janmashtami',
        'ram navami', 'hanuman jayanti', 'mahashivratri', 'pradosh',
        'eid', 'ramzan', 'ramadan', 'muharram', 'bakrid', 'milad',
        'shab-e', 'sankashti', 'vijaya', 'ashtami', 'panchmi'
    ];
    
    for (const keyword of recurringKeywords) {
        if (lowerName.includes(keyword)) {
            return true;
        }
    }
    
    // Fixed date festivals (same Gregorian date every year)
    const fixedKeywords = [
        'new year', 'sankranti', 'republic day', 'independence day',
        'gandhi jayanti', 'christmas', 'ambedkar jayanti'
    ];
    
    for (const keyword of fixedKeywords) {
        if (lowerName.includes(keyword)) {
            return false;
        }
    }
    
    // Default: assume recurring (most Indian festivals are lunar-based)
    return true;
}

async function importFestivals() {
    try {
        console.log('🔌 Connecting to MongoDB...');
        
        const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/social-media-platform';
        await mongoose.connect(MONGODB_URI);
        
        console.log('✅ Connected to MongoDB');
        
        // Get CSV filename from command line argument or use default
        const csvFileName = process.argv[2] || 'festivals.csv';
        const csvPath = path.join(__dirname, 'scrap_festivals', csvFileName);
        
        console.log(`📂 Using CSV file: ${csvFileName}`);
        
        // Optional: Clear existing festivals for this year only (not all data)
        // Uncomment below if you want to replace data for a specific year
        // const year = parseInt(csvFileName.match(/\d{4}/)?.[0]) || new Date().getFullYear();
        // console.log(`🗑️  Clearing existing festivals for year ${year}...`);
        // await Festival.deleteMany({ year });
        
        const festivals = [];
        
        console.log('📖 Reading CSV file...');
        
        // Check if file exists
        if (!fs.existsSync(csvPath)) {
            console.error('❌ CSV file not found at:', csvPath);
            process.exit(1);
        }
        
        // Read and parse CSV
        await new Promise((resolve, reject) => {
            fs.createReadStream(csvPath)
                .pipe(csv())
                .on('data', (row) => {
                    const festivalName = row.festival?.trim();
                    
                    // Skip empty rows
                    if (!festivalName) return;
                    
                    const date = parseDate(row.date_iso, row.date_label, festivalName);
                    
                    // Only add festivals with valid dates
                    if (date) {
                        const category = determineFestivalCategory(festivalName);
                        const isRecurring = isRecurringFestival(festivalName);
                        
                        festivals.push({
                            name: festivalName,
                            date: date,
                            year: date.getFullYear(),
                            category: category,
                            isRecurring: isRecurring,
                            baseImage: {
                                url: null,
                                public_id: null
                            },
                            description: row.source_url || ''
                        });
                    }
                })
                .on('end', () => {
                    console.log(`✅ CSV parsed successfully. Found ${festivals.length} festivals`);
                    resolve();
                })
                .on('error', (error) => {
                    console.error('❌ Error reading CSV:', error);
                    reject(error);
                });
        });
        
        if (festivals.length === 0) {
            console.log('⚠️  No festivals to import');
            await mongoose.disconnect();
            return;
        }
        
        // Insert festivals into database
        console.log('💾 Inserting festivals into MongoDB...');
        const result = await Festival.insertMany(festivals, { ordered: false });
        
        console.log(`\n✅ Successfully imported ${result.length} festivals!`);
        
        // Show category breakdown
        const categoryCount = {
            hindu: festivals.filter(f => f.category === 'hindu').length,
            muslim: festivals.filter(f => f.category === 'muslim').length,
            other: festivals.filter(f => f.category === 'other').length,
        };
        
        const recurringCount = festivals.filter(f => f.isRecurring).length;
        const fixedCount = festivals.filter(f => !f.isRecurring).length;
        
        console.log('\n📊 Category Breakdown:');
        console.log(`   Hindu: ${categoryCount.hindu}`);
        console.log(`   Muslim: ${categoryCount.muslim}`);
        console.log(`   Other: ${categoryCount.other}`);
        
        console.log('\n🔄 Date Type:');
        console.log(`   Recurring (changes yearly): ${recurringCount}`);
        console.log(`   Fixed (same date yearly): ${fixedCount}`);
        
        console.log(`\n📅 Year: ${festivals[0]?.year || 'N/A'}`);
        
        // Show sample festivals
        console.log('\n🎉 Sample Festivals:');
        const samples = await Festival.find().limit(5);
        samples.forEach(f => {
            console.log(`   - ${f.name} (${f.date.toISOString().split('T')[0]}) [${f.category}]`);
        });
        
        await mongoose.disconnect();
        console.log('\n✅ Import complete! Database connection closed.');
        
    } catch (error) {
        console.error('❌ Error importing festivals:', error);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the import
importFestivals();
