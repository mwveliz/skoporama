const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  
  page.on('console', msg => console.log('PAGE LOG:', msg.text()));
  page.on('pageerror', error => console.log('PAGE ERROR:', error.message));

  await page.goto('http://localhost:3000');
  
  console.log('Page loaded');
  await page.waitForSelector('#btn-start-keyboard');
  
  console.log('Clicking button...');
  await page.click('#btn-start-keyboard');
  
  console.log('Checking if keyboard appeared...');
  try {
    await page.waitForSelector('.keyboard', { timeout: 2000 });
    console.log('SUCCESS: Keyboard appeared!');
  } catch (e) {
    console.log('FAILED: Keyboard did not appear');
  }
  
  await browser.close();
})();
