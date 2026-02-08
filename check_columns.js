import 'dotenv/config';
import pool from './Backend/db.js';

async function checkColumns() {
    try {
        const res = await pool.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'users';
        `);
        console.log('Columns in users table:');
        console.table(res.rows.map(r => ({ name: r.column_name, type: r.data_type })));
        await pool.end();
    } catch (err) {
        console.error('Error:', err);
        process.exit(1);
    }
}

checkColumns();
