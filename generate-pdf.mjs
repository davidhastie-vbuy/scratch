import puppeteer from 'puppeteer';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outputPath = path.join(__dirname, 'BookATrade-Investor-Deck.pdf');

(async () => {
  console.log('Launching browser...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1280, height: 720, deviceScaleFactor: 2 });

  console.log('Loading pitch deck...');
  await page.goto('http://localhost:8080/pitch-deck.html', {
    waitUntil: 'networkidle0',
    timeout: 30000,
  });

  // Wait for fonts to load
  await page.evaluate(() => document.fonts.ready);
  await new Promise(r => setTimeout(r, 1000));

  // Get total slide count
  const slideCount = await page.evaluate(() =>
    document.querySelectorAll('.slide').length
  );
  console.log(`Found ${slideCount} slides`);

  // Capture each slide as a screenshot, then combine into PDF
  const screenshots = [];

  for (let i = 0; i < slideCount; i++) {
    console.log(`Capturing slide ${i + 1} of ${slideCount}...`);

    // Navigate to slide and make it visible
    await page.evaluate((index) => {
      const slides = document.querySelectorAll('.slide');
      slides.forEach((s, j) => {
        s.classList.remove('active', 'prev');
        if (j === index) {
          s.classList.add('active');
          s.style.opacity = '1';
          s.style.visibility = 'visible';
          s.style.transform = 'none';
        }
      });

      // Force all animations complete on current slide
      slides[index].querySelectorAll('.anim').forEach(el => {
        el.style.animation = 'none';
        el.style.opacity = '1';
        el.style.transform = 'none';
      });

      // Hide nav and toolbar
      const nav = document.getElementById('nav');
      const toolbar = document.getElementById('editToolbar');
      if (nav) nav.style.display = 'none';
      if (toolbar) toolbar.style.display = 'none';
    }, i);

    await new Promise(r => setTimeout(r, 300));

    const screenshot = await page.screenshot({
      type: 'jpeg',
      quality: 95,
      clip: { x: 0, y: 0, width: 1280, height: 720 },
    });
    screenshots.push(screenshot);
  }

  // Now create a PDF with all slides as full-page images
  console.log('Composing PDF...');

  // Create a new page with all screenshots as full-bleed images
  const pdfPage = await browser.newPage();
  
  const imagesHtml = screenshots
    .map((buf, i) => {
      const b64 = buf.toString('base64');
      return `<div class="slide-page${i > 0 ? ' break' : ''}">
        <img src="data:image/jpeg;base64,${b64}" />
      </div>`;
    })
    .join('\n');

  await pdfPage.setContent(`<!DOCTYPE html>
<html>
<head>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: 1280px 720px; margin: 0; }
  body { margin: 0; padding: 0; }
  .slide-page {
    width: 1280px;
    height: 720px;
    overflow: hidden;
    page-break-after: always;
    break-after: page;
  }
  .slide-page:last-child {
    page-break-after: auto;
  }
  .slide-page img {
    width: 1280px;
    height: 720px;
    display: block;
  }
</style>
</head>
<body>
${imagesHtml}
</body>
</html>`, { waitUntil: 'load' });

  await pdfPage.pdf({
    path: outputPath,
    width: '1280px',
    height: '720px',
    printBackground: true,
    margin: { top: 0, right: 0, bottom: 0, left: 0 },
    preferCSSPageSize: true,
  });

  await browser.close();
  console.log(`✅ PDF saved to: ${outputPath}`);
})();
