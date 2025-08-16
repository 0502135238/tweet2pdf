// server.js
const express = require('express');
const puppeteer = require('puppeteer');
const bodyParser = require('body-parser');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());
app.use(express.static(path.join(__dirname))); // serve index.html

// Endpoint to generate PDF
app.post('/generate-pdf', async (req, res) => {
  const { threadUrl } = req.body;

  if (!threadUrl) {
    return res.status(400).send({ error: 'No thread URL provided' });
  }

  try {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();

    // Navigate to the thread URL
    await page.goto(threadUrl, { waitUntil: 'networkidle2' });

    // Generate PDF
    const pdfBuffer = await page.pdf({ format: 'A4' });

    await browser.close();

    // Send PDF as response
    res.set({
      'Content-Type': 'application/pdf',
      'Content-Disposition': 'attachment; filename="thread.pdf"',
    });
    res.send(pdfBuffer);

  } catch (err) {
    console.error(err);
    res.status(500).send({ error: 'Failed to generate PDF' });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
