const path = require('path');
const puppeteer = require('puppeteer-core');
const fs = require('fs');

async function renderComposite() {
  const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
  const browser = await puppeteer.launch({
    executablePath: chromePath,
    headless: true,
    defaultViewport: {
      width: 1920,
      height: 1080,
      deviceScaleFactor: 2,
    },
    args: ['--allow-file-access-from-files', '--no-sandbox'],
  });

  const page = await browser.newPage();
  const fileUrl = 'file:///' + path.join(__dirname, 'render_composite.html').replace(/\\/g, '/');
  console.log(`Loading composite template: ${fileUrl}`);
  await page.goto(fileUrl, { waitUntil: 'networkidle0' });
  await new Promise((r) => setTimeout(r, 1000));

  const outputPath = path.join(__dirname, '..', 'screenshots', 'slide_15_composite_all_in_one.png');
  await page.screenshot({ path: outputPath });
  console.log(`Saved composite slide image: ${outputPath}`);

  await browser.close();
}

renderComposite();
