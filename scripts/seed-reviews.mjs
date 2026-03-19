import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const DB_URL = process.env.DATABASE_URL;
if (!DB_URL) { console.error("DATABASE_URL not set"); process.exit(1); }

const conn = await mysql.createConnection(DB_URL);

// Get first 8 product IDs
const [rows] = await conn.execute("SELECT id FROM products ORDER BY id LIMIT 8");
const productIds = rows.map(r => r.id);

const reviewTemplates = [
  // 5-star reviews
  { rating: 5, authorName: "Sophie L.", title: "Absolutely stunning!", body: "I bought this as a birthday gift for myself and I couldn't be happier. The quality is exceptional — it looks far more expensive than the price suggests. The gold tone is rich and warm, not at all cheap-looking. I've received so many compliments already. Will definitely be ordering more pieces from this collection!", isVerified: true },
  { rating: 5, authorName: "Isabella R.", title: "Perfect for everyday wear", body: "I was a bit nervous ordering jewelry online but this exceeded all my expectations. The craftsmanship is beautiful and it arrived in gorgeous packaging. It's delicate enough for daily wear but makes a real statement. My sister immediately asked where I got it. 10/10 would recommend to anyone looking for quality jewelry at a fair price.", isVerified: true },
  { rating: 5, authorName: "Amelia W.", title: "Exactly as described", body: "The photos don't do it justice — this piece is even more beautiful in person. The silver has a lovely lustre and the design is elegant without being over the top. I wore it to a dinner party and got loads of compliments. Packaging was also very luxurious which makes it perfect as a gift.", isVerified: false },
  { rating: 5, authorName: "Charlotte B.", title: "A true luxury piece", body: "I've been collecting jewelry for years and this is genuinely one of my favourite recent purchases. The weight feels substantial and premium, the finish is flawless. It pairs beautifully with both casual and formal outfits. Fast delivery and beautifully packaged too. Highly recommend!", isVerified: true },
  // 4-star reviews
  { rating: 4, authorName: "Emma T.", title: "Very happy with my purchase", body: "Really lovely piece — the quality is great and it looks beautiful. Took off one star only because the sizing was slightly different from what I expected, but once I adjusted it, it fit perfectly. The gold colour is exactly as shown in the photos. Would buy from here again.", isVerified: true },
  { rating: 4, authorName: "Olivia M.", title: "Beautiful but clasp could be better", body: "The necklace itself is gorgeous — really elegant and well-made. The only minor issue is the clasp is a little fiddly to do up on your own. Once it's on though, it looks stunning. I've worn it several times and always get compliments. Overall very happy with the purchase.", isVerified: false },
  { rating: 4, authorName: "Grace P.", title: "Great quality for the price", body: "I was pleasantly surprised by the quality. The metal is solid and the design is beautiful. It's become my go-to piece for evenings out. Delivery was quick and the packaging was lovely. Would definitely recommend as a gift or treat for yourself.", isVerified: true },
  // 3-star review
  { rating: 3, authorName: "Hannah K.", title: "Nice but smaller than expected", body: "The piece is pretty and well-made, but it was smaller than I expected from the photos. That said, it's still a lovely delicate piece and the quality is good. Just wish the product dimensions were clearer. Customer service was helpful when I reached out.", isVerified: false },
  // 5-star
  { rating: 5, authorName: "Lily C.", title: "My new favourite piece", body: "I wear this every single day now. It's the perfect weight — substantial enough to feel luxurious but light enough to forget you're wearing it. The gold hasn't tarnished at all after two months of daily wear. Genuinely one of the best jewelry purchases I've made.", isVerified: true },
  { rating: 5, authorName: "Mia H.", title: "Gifted this and she loved it", body: "Bought this as a birthday gift for my mum and she absolutely loves it. The presentation box was beautiful and made it feel really special to unwrap. She says it's her favourite piece of jewelry now. Will definitely be ordering from here again for Christmas.", isVerified: true },
];

let inserted = 0;
for (let i = 0; i < productIds.length; i++) {
  const pid = productIds[i];
  // Each product gets 2-4 reviews
  const count = 2 + (i % 3);
  for (let j = 0; j < count; j++) {
    const review = reviewTemplates[(i * 3 + j) % reviewTemplates.length];
    const helpfulCount = Math.floor(Math.random() * 18) + 1;
    const unhelpfulCount = Math.floor(Math.random() * 3);
    await conn.execute(
      `INSERT INTO reviews (productId, authorName, rating, title, body, isVerified, helpfulCount, unhelpfulCount, status, createdAt, updatedAt)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'approved', DATE_SUB(NOW(), INTERVAL ? DAY), NOW())`,
      [pid, review.authorName, review.rating, review.title ?? null, review.body, review.isVerified ? 1 : 0, helpfulCount, unhelpfulCount, Math.floor(Math.random() * 60) + 1]
    );
    inserted++;
  }
}

console.log(`✅ Seeded ${inserted} reviews across ${productIds.length} products`);
await conn.end();
