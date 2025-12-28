const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Festival = require('../models/Festival');

async function importFestivals() {
    try {
        const mongoUri = process.env.MONGODB_URI || process.env.MONGO_URI;
        
        if (!mongoUri) {
            console.error('❌ MongoDB connection URI not found in .env file');
            console.log('   Please add MONGODB_URI or MONGO_URI to your .env file');
            process.exit(1);
        }

        console.log('📡 Connecting to MongoDB...');
        await mongoose.connect(mongoUri);
        console.log('✅ Connected to MongoDB!');

        // Read festivals.json file
        const festivalsPath = path.join(__dirname, 'festivals.json');
        
        if (!fs.existsSync(festivalsPath)) {
            console.error('❌ festivals.json file not found!');
            console.log(`   Expected path: ${festivalsPath}`);
            process.exit(1);
        }

        console.log('\n📂 Reading festivals.json...');
        const festivalsData = JSON.parse(fs.readFileSync(festivalsPath, 'utf8'));
        
        if (!Array.isArray(festivalsData) || festivalsData.length === 0) {
            console.error('❌ Invalid festivals.json format or empty array');
            process.exit(1);
        }

        console.log(`   Found ${festivalsData.length} festivals in JSON file`);

        // Transform JSON data to match Festival model
        const festivals = festivalsData.map(festival => ({
            name: festival.name,
            date: new Date(festival.date),
            year: festival.year || new Date(festival.date).getFullYear(),
            category: festival.category || 'all',
            isRecurring: festival.isRecurring !== undefined ? festival.isRecurring : true,
            baseImage: festival.baseImage || { url: null, public_id: null },
            description: festival.description || ''
        }));

        // Check if festivals already exist
        const existingCount = await Festival.countDocuments();
        
        if (existingCount > 0) {
            console.log(`\n⚠️  Database already contains ${existingCount} festivals`);
            console.log('   Options:');
            console.log('   1. Delete existing and import new (run deleteFestivals.js first)');
            console.log('   2. Add new festivals without deleting existing (continuing...)\n');
        }

        console.log('📥 Importing festivals to database...');
        
        // Use insertMany with ordered: false to continue on duplicate errors
        let importedCount = 0;
        let skippedCount = 0;
        
        try {
            const result = await Festival.insertMany(festivals, { ordered: false });
            importedCount = result.length;
        } catch (error) {
            if (error.code === 11000) {
                // Duplicate key errors
                importedCount = error.insertedDocs?.length || 0;
                skippedCount = festivals.length - importedCount;
                console.log(`⚠️  Skipped ${skippedCount} duplicate festivals`);
            } else {
                throw error;
            }
        }
        
        console.log(`\n✅ Successfully imported ${importedCount} festivals!`);
        
        if (skippedCount > 0) {
            console.log(`   (${skippedCount} duplicates were skipped)`);
        }
        
        // Show category breakdown
        const categoryCount = {
            hindu: festivals.filter(f => f.category === 'hindu').length,
            muslim: festivals.filter(f => f.category === 'muslim').length,
            other: festivals.filter(f => f.category === 'other' || f.category === 'all').length,
        };
        
        const recurringCount = festivals.filter(f => f.isRecurring).length;
        const fixedCount = festivals.filter(f => !f.isRecurring).length;
        
        console.log('\n📊 Category Breakdown:');
        console.log(`   Hindu: ${categoryCount.hindu}`);
        console.log(`   Muslim: ${categoryCount.muslim}`);
        console.log(`   Other/All: ${categoryCount.other}`);
        
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
        
        // Show total count
        const totalCount = await Festival.countDocuments();
        console.log(`\n📊 Total festivals in database: ${totalCount}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Import complete! Database connection closed.');
        
    } catch (error) {
        console.error('❌ Error importing festivals:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the import
console.log('🎉 Festival Import Tool - JSON Edition');
console.log('=====================================\n');
importFestivals();
