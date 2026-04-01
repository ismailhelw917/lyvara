import mysql from 'mysql2/promise';

async function deleteAllProducts() {
  try {
    const connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME,
    });

    // Delete all products
    const [deleteResult] = await connection.execute('DELETE FROM products');
    console.log(`✅ Deleted ${deleteResult.affectedRows} products`);

    // Verify
    const [[{ count }]] = await connection.execute('SELECT COUNT(*) as count FROM products');
    console.log(`✅ Remaining products: ${count}`);

    await connection.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

deleteAllProducts();
