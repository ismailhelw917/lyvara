import axios from 'axios';
import * as cheerio from 'cheerio';

const testASIN = 'B0BLK7NRLM'; // Test with a real ASIN

async function testImageScraper() {
  try {
    console.log(`Testing image scraper for ASIN: ${testASIN}`);
    
    const url = `https://www.amazon.com/dp/${testASIN}`;
    console.log(`Fetching: ${url}`);
    
    const response = await axios.get(url, {
      timeout: 15000,
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });
    
    console.log(`Response status: ${response.status}`);
    console.log(`Response length: ${response.data.length} bytes`);
    
    const $ = cheerio.load(response.data);
    
    // Look for images
    const images = [];
    
    // Check for img tags with data-a-dynamic-image
    $('img[data-a-dynamic-image]').each((i, elem) => {
      const dataAttr = $(elem).attr('data-a-dynamic-image');
      if (dataAttr) {
        try {
          const imageData = JSON.parse(dataAttr);
          const urls = Object.keys(imageData);
          urls.forEach((url) => {
            if (url && url.includes('images-amazon.com')) {
              images.push(url);
            }
          });
        } catch (e) {
          // Skip
        }
      }
    });
    
    console.log(`Found ${images.length} images`);
    if (images.length > 0) {
      console.log(`First image: ${images[0]}`);
    } else {
      console.log('No images found - checking HTML structure...');
      console.log(response.data.substring(0, 2000));
    }
    
  } catch (error) {
    console.error('Error:', error.message);
  }
}

testImageScraper();
