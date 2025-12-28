const mongoose = require('mongoose');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const Festival = require('../models/Festival');

async function deleteFestivals() {
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

        // Get count before deletion
        const festivalCount = await Festival.countDocuments();
        
        if (festivalCount === 0) {
            console.log('\n✨ No festivals found in database. Nothing to delete.');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log(`\n📊 Found ${festivalCount} festivals in database`);
        
        // Show sample festivals before deletion
        console.log('\n🎉 Sample Festivals (to be deleted):');
        const samples = await Festival.find().limit(5);
        samples.forEach(f => {
            console.log(`   - ${f.name} (${f.date.toISOString().split('T')[0]}) [${f.category}]`);
        });
        
        if (festivalCount > 5) {
            console.log(`   ... and ${festivalCount - 5} more`);
        }

        // Get confirmation from command line argument
        const args = process.argv.slice(2);
        const forceFlag = args.includes('--force') || args.includes('-f');
        const confirmFlag = args.includes('--yes') || args.includes('-y');

        if (!forceFlag && !confirmFlag) {
            console.log('\n⚠️  WARNING: This will delete ALL festivals from the database!');
            console.log('   This action cannot be undone.');
            console.log('\n   To proceed, run the script with --force or --yes flag:');
            console.log('   node scripts/deleteFestivals.js --force');
            console.log('   or');
            console.log('   node scripts/deleteFestivals.js --yes');
            await mongoose.disconnect();
            process.exit(0);
        }

        console.log('\n🗑️  Deleting all festivals...');
        
        // Delete all festivals
        const result = await Festival.deleteMany({});
        
        console.log(`\n✅ Successfully deleted ${result.deletedCount} festivals!`);
        
        // Verify deletion
        const remainingCount = await Festival.countDocuments();
        console.log(`📊 Remaining festivals in database: ${remainingCount}`);
        
        await mongoose.disconnect();
        console.log('\n✅ Deletion complete! Database connection closed.');
        
    } catch (error) {
        console.error('❌ Error deleting festivals:', error.message);
        await mongoose.disconnect();
        process.exit(1);
    }
}

// Run the deletion
console.log('🗑️  Festival Delete Tool');
console.log('========================\n');
deleteFestivals();
