const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname)));

// Endpoint to generate PDF
app.post('/generate-pdf', async (req, res) => {
  const { threadUrl } = req.body;
  if (!threadUrl) return res.status(400).send({ error: 'No thread URL provided' });

  try {
    const browser = await puppeteer.launch({ args: ['--no-sandbox'] });
    const page = await browser.newPage();

    await page.goto(threadUrl, { waitUntil: 'networkidle2' });

    // Scroll to load all tweets
    let previousHeight;
    try {
      previousHeight = await page.evaluate('document.body.scrollHeight');
      while (true) {
        await page.evaluate('window.scrollTo(0, document.body.scrollHeight)');
        await page.waitForTimeout(1000);
        const newHeight = await page.evaluate('document.body.scrollHeight');
        if (newHeight === previousHeight) break;
        previousHeight = newHeight;
      }
    } catch (err) {
      console.log('Scrolling finished or failed:', err);
    }

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4', printBackground: true });

    await browser.close();

    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="thread.pdf"',
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error('PDF generation failed:', err);
    res.status(500).send({ error: 'Failed to generate PDF' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
