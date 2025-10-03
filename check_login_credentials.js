const { Client } = require('pg');
const bcrypt = require('bcrypt');

const config = {
    host: 'localhost',
    port: 5432,
    database: 'itsm',
    user: 'postgres',
    password: 'postgres123'
};

async function checkCredentials() {
    const client = new Client(config);
    
    try {
        await client.connect();
        console.log('Connected to database successfully\n');
        
        // Get all users with their details and roles
        const userQuery = `
            SELECT 
                ud.user_id,
                ud.first_name,
                ud.last_name,
                ud.email_id,
                ud.user_name,
                ud.has_access,
                ur2.role_name,
                up.hashed_password
            FROM user_details ud
            LEFT JOIN user_relation ur ON ud.user_id = ur.user_id
            LEFT JOIN user_role ur2 ON ur.role_id = ur2.role_id
            LEFT JOIN user_passwords up ON ud.user_id = up.user_id
            WHERE ud.has_access = true
            ORDER BY ud.user_id
        `;
        
        const result = await client.query(userQuery);
        
        console.log('Available login credentials:');
        console.log('='.repeat(80));
        
        for (const user of result.rows) {
            console.log(`User ID: ${user.user_id}`);
            console.log(`Name: ${user.first_name} ${user.last_name}`);
            console.log(`Email: ${user.email_id}`);
            console.log(`Username: ${user.user_name}`);
            console.log(`Role: ${user.role_name || 'No role assigned'}`);
            console.log(`Has Access: ${user.has_access}`);
            console.log(`Password Hash: ${user.hashed_password ? 'Set' : 'Not set'}`);
            console.log('-'.repeat(40));
        }
        
        // Try to find common passwords
        console.log('\nTrying to identify passwords for users with access...');
        const commonPasswords = ['password', '123456', 'admin', 'rohit', 'test', 'user', '12345', 'qwerty'];
        
        for (const user of result.rows) {
            if (user.hashed_password) {
                for (const pwd of commonPasswords) {
                    try {
                        const isMatch = await bcrypt.compare(pwd, user.hashed_password);
                        if (isMatch) {
                            console.log(`✅ Found password for ${user.user_name}: "${pwd}"`);
                            break;
                        }
                    } catch (error) {
                        // Skip if bcrypt comparison fails
                    }
                }
            }
        }
        
    } catch (error) {
        console.error('Error:', error.message);
    } finally {
        await client.end();
    }
}

checkCredentials();

