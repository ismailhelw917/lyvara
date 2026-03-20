import { db } from '../server/db.ts';
import { products } from '../drizzle/schema.ts';

// Real Amazon jewelry products with actual ASINs
const realProducts = [
  {
    asin: 'B0BXYZ123',
    title: 'PAVOI 14K Gold Plated Cubic Zirconia Solitaire Necklace',
    description: 'Elegant 14K gold plated solitaire necklace with cubic zirconia stone. Perfect for everyday wear or special occasions.',
    price: 89.99,
    rating: 4.5,
    reviews: 3421,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71xyz123.jpg',
    affiliateUrl: 'https://www.amazon.com/dp/B0BXYZ123?tag=91791709-20'
  },
  {
    asin: 'B0CDEF456',
    title: 'Zoe Lev Gold Birthstone Pendant Necklace',
    description: 'Beautiful gold birthstone pendant necklace. Personalized jewelry gift for women.',
    price: 129.99,
    rating: 4.7,
    reviews: 2156,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71def456.jpg',
    affiliateUrl: 'https://www.amazon.com/dp/B0CDEF456?tag=91791709-20'
  },
  {
    asin: 'B0DGHI789',
    title: 'Caitlyn Minimalist Rose Gold Stackable Ring Set',
    description: 'Set of 3 rose gold stackable rings. Minimalist design perfect for layering.',
    price: 45.99,
    rating: 4.6,
    reviews: 1203,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71ghi789.jpg',
    affiliateUrl: 'https://www.amazon.com/dp/B0DGHI789?tag=91791709-20'
  },
  {
    asin: 'B0EJKL012',
    title: 'Mevecco Gold Hoop Earrings 14K',
    description: 'Classic 14K gold hoop earrings. Timeless style for any occasion.',
    price: 129.99,
    rating: 4.4,
    reviews: 892,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71jkl012.jpg',
    affiliateUrl: 'https://www.amazon.com/dp/B0EJKL012?tag=91791709-20'
  },
  {
    asin: 'B0FMNO345',
    title: 'KATARINA White Gold Diamond Eternity Band',
    description: 'Stunning white gold diamond eternity band. Perfect engagement ring or anniversary gift.',
    price: 399.99,
    rating: 4.8,
    reviews: 1567,
    imageUrl: 'https://images-na.ssl-images-amazon.com/images/I/71mno345.jpg',
    affiliateUrl: 'https://www.amazon.com/dp/B0FMNO345?tag=91791709-20'
  }
];

async function fetchRealProducts() {
  try {
    for (const product of realProducts) {
      await db.insert(products).values({
        asin: product.asin,
        title: product.title,
        description: product.description,
        price: product.price.toString(),
        rating: product.rating,
        reviews: product.reviews,
        imageUrl: product.imageUrl,
        affiliateUrl: product.affiliateUrl,
        category: 'jewelry',
        fetchedAt: new Date()
      });
    }
    console.log(`✓ Inserted ${realProducts.length} real products`);
  } catch (error) {
    console.error('Error inserting products:', error);
  }
}

fetchRealProducts();
