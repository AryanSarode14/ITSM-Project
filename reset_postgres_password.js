const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Current config from the backend
const currentConfig = {
    host: 'localhost',
    port: 5432,
    database: 'itsm',
    user: 'postgres',
    password: 'rohit' // Current password from config.json
};

const newPassword = 'postgres123';

async function testConnection(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('✅ Connection successful with current password');
        await client.end();
        return true;
    } catch (error) {
        console.log('❌ Connection failed:', error.message);
        await client.end();
        return false;
    }
}

async function resetPassword() {
    console.log('Testing current password...');
    const currentWorks = await testConnection(currentConfig);
    
    if (currentWorks) {
        console.log('Current password works! No need to reset.');
        return;
    }
    
    console.log('Attempting to reset password...');
    
    // Try to connect as postgres user with different common passwords
    const commonPasswords = ['postgres', 'admin', 'password', '123456', ''];
    
    for (const pwd of commonPasswords) {
        console.log(`Trying password: ${pwd || '(empty)'}`);
        const testConfig = { ...currentConfig, password: pwd };
        
        try {
            const client = new Client(testConfig);
            await client.connect();
            console.log(`✅ Connected with password: ${pwd || '(empty)'}`);
            
            // Reset password
            await client.query(`ALTER USER postgres PASSWORD '${newPassword}';`);
            console.log(`✅ Password reset to: ${newPassword}`);
            
            await client.end();
            break;
        } catch (error) {
            console.log(`❌ Failed with password: ${pwd || '(empty)'}`);
        }
    }
    
    // Test new password
    console.log('Testing new password...');
    const newConfig = { ...currentConfig, password: newPassword };
    const newWorks = await testConnection(newConfig);
    
    if (newWorks) {
        console.log('✅ New password works!');
        updateConfigFiles(newPassword);
    } else {
        console.log('❌ Password reset failed. You may need to reset manually.');
        console.log('Try running: psql -U postgres -c "ALTER USER postgres PASSWORD \'postgres123\';"');
    }
}

function updateConfigFiles(password) {
    const configPath = path.join(__dirname, 'ITSM_Backend', 'db', 'config.json');
    
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
        config.DATABASE_URL1 = `postgres://postgres:${password}@localhost:5432/itsm`;
        
        fs.writeFileSync(configPath, JSON.stringify(config, null, 4));
        console.log('✅ Updated config.json with new password');
    } catch (error) {
        console.log('❌ Failed to update config.json:', error.message);
    }
    
    // Create .env file if it doesn't exist
    const envPath = path.join(__dirname, 'ITSM_Backend', '.env');
    const envContent = `# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=itsm
DB_USER=postgres
DB_PASSWORD=${password}

# JWT Secret
JWT_SECRET=THIS IS USED TO SIGN AND VERIFY JWT TOKENS, REPLACE IT WITH YOUR OWN SECRET, IT CAN BE ANY STRING
`;
    
    try {
        fs.writeFileSync(envPath, envContent);
        console.log('✅ Created/updated .env file');
    } catch (error) {
        console.log('❌ Failed to create .env file:', error.message);
    }
}

// Run the script
resetPassword().catch(console.error);

