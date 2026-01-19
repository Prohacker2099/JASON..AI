const { chromium } = require('playwright');

async function testScraper() {
  console.log('Starting browser scraper test...');
  
  try {
    const browser = await chromium.launch({ 
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage']
    });
    
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
    
    // Test Google Flights
    console.log('Testing Google Flights...');
    const url = 'https://www.google.com/travel/flights?q=Flights%20from%20LHR%20to%20CCU%20on%202025-12-17%20return%202025-12-28&tp=1';
    
    await page.goto(url);
    console.log('Page loaded, waiting for results...');
    
    // Wait a bit for results to load
    await page.waitForTimeout(5000);
    
    // Try to find any price elements
    const prices = await page.$$eval('.g2w0 .U3gS', elements => 
      elements.map(el => el.textContent?.trim()).filter(Boolean)
    );
    
    console.log('Prices found:', prices.slice(0, 3));
    
    await browser.close();
    console.log('Test completed successfully!');
    
  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

testScraper();
