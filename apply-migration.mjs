import mysql from 'mysql2/promise';

async function applyMigration() {
  let connection;
  try {
    // Parse DATABASE_URL to get connection details
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL not set');
    }

    // Create connection
    connection = await mysql.createConnection(dbUrl);
    
    console.log('Connected to database');

    // Apply the migration
    const sql = `ALTER TABLE \`products\` MODIFY COLUMN \`tab\` enum('classic','bargains','anklets','body-jewelry','bracelets','brooches-pins','earrings','jewelry-sets','necklaces','rings') NOT NULL DEFAULT 'classic'`;
    
    console.log('Executing migration...');
    console.log('SQL:', sql);
    
    await connection.execute(sql);
    
    console.log('✅ Migration applied successfully!');
    console.log('The products table now supports the new tab values:');
    console.log('- classic, bargains, anklets, body-jewelry, bracelets,');
    console.log('- brooches-pins, earrings, jewelry-sets, necklaces, rings');
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    if (error.code) {
      console.error('Error code:', error.code);
    }
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
}

applyMigration();
