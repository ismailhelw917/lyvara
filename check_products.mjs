import mysql from 'mysql2/promise';

const connection = await mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const [rows] = await connection.execute(
  'SELECT COUNT(*) as total, MAX(createdAt) as latest FROM products'
);

console.log('Total products:', rows[0].total);
console.log('Latest product created at:', rows[0].latest);

// Check for recent products (last 10 minutes)
const [recentRows] = await connection.execute(
  "SELECT COUNT(*) as recent FROM products WHERE createdAt > DATE_SUB(NOW(), INTERVAL 10 MINUTE)"
);
console.log('Products added in last 10 minutes:', recentRows[0].recent);

await connection.end();
