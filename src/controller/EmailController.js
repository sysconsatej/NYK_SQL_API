const express = require("express");
const puppeteer = require("puppeteer");
const PDFDocument = require("pdfkit");
const nodemailer = require("nodemailer");
const fetch = require("node-fetch");

const app = express();
app.use(express.json());

module.exports = {
  Email: async (req, res) => {
    const { to, cc, bcc, subject, body } = req.body;

    if (!to) {
      return res.status(400).send({
        success: false,
        message: "Missing mandatory email fields: 'To' is required.",
      });
    }

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rohitanabhavane26@gmail.com",
        pass: "eghq byjb ggbk wgbm",
      },
    });

    // Prepare the email data
    const mailOptions = {
      from: "rohitanabhavane26@gmail.com",
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: body,
    };

    try {
      let info = await transporter.sendMail(mailOptions);
      res.status(200).send({
        success: true,
        message: "Email sent successfully",
        info: info,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
    }
  },
  PDFP: async (req, res) => {
    const { to, cc, bcc, subject, htmlContent, pdfFilename, userPassword } =
      req.body;

    if (!to) {
      return res.status(400).json({
        success: false,
        message: "Missing mandatory email fields: 'To' is required.",
      });
    }
    let browser = null;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        timeout: 60000, // Increase timeout to 60 seconds
        executablePath: "/usr/bin/chromium-browser", // The path to the executable on the server linux (ubuntu) for windows remove this parameter
      });
      const page = await browser.newPage();
      await page.setViewport({
        width: 1200,
        height: 800,
        deviceScaleFactor: 2,
      });
      await page.setContent(htmlContent, { waitUntil: "networkidle0" });
      const imageBuffer = await page.screenshot({ fullPage: true });

      await browser.close();

      const pdfDoc = new PDFDocument({
        userPassword: userPassword,
        ownerPassword: "ownerpass", // Consider using a unique owner password
        permissions: { printing: "lowResolution" },
      });

      const pdfBuffers = [];
      pdfDoc.on("data", (data) => pdfBuffers.push(data));

      // Define margins
      const marginLeft = 40; // Margin on the left and right
      const pageWidth = 595.28; // Standard width for an A4 page in points
      const contentWidth = pageWidth - 2 * marginLeft; // Width of the image to fit within the margins

      // Place the image with the calculated margins
      pdfDoc.image(imageBuffer, marginLeft, 0, {
        width: contentWidth,
        height: 750.89, // Adjust height if necessary
      });
      pdfDoc.end();
      pdfDoc.on("end", async () => {
        let transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 587,
          secure: false,
          auth: {
            user: "mailto:rohitanabhavane26@gmail.com",
            pass: "eghq byjb ggbk wgbm",
          },
        });

        const mailOptions = {
          from: "rohitanabhavane26@gmail.com",
          to,
          cc,
          bcc,
          subject,
          attachments: [
            {
              filename: pdfFilename || "attachment.pdf",
              content: Buffer.concat(pdfBuffers),
              contentType: "application/pdf",
            },
          ],
        };

        const info = await transporter.sendMail(mailOptions);
        res.status(200).json({
          success: true,
          message: "Encrypted email with PDF sent successfully",
          info,
        });
      });
    } catch (error) {
      console.error("Failed to generate or send encrypted PDF:", error);
      if (browser) await browser.close();
      res.status(500).json({
        success: false,
        message: "Failed to generate or send encrypted PDF",
        error: error.message,
      });
    }
  },
  PDF: async (req, res) => {
    const { to, cc, bcc, subject, htmlContent, pdfFilename } = req.body;
    if (!to) {
      return res.status(400).send({
        success: false,
        message: "Missing mandatory email fields: 'To' is required.",
      });
    }

    let browser;
    try {
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
        timeout: 60000, // Increase timeout to 60 seconds
        executablePath: "/usr/bin/chromium-browser", // The path to the executable on the server linux (ubuntu) for windows remove this parameter
      });

      const page = await browser.newPage();

      // Increase timeout for setContent
      await page.setContent(htmlContent, {
        waitUntil: "networkidle0",
        timeout: 60000,
      });
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "20px", bottom: "20px", left: "20px", right: "20px" },
      });

      const mailOptions = {
        from: "rohitanabhavane26@gmail.com",
        to: to,
        cc: cc,
        bcc: bcc,
        subject: subject,
        attachments: [
          {
            filename: pdfFilename || "attachment.pdf",
            content: pdfBuffer,
            contentType: "application/pdf",
          },
        ],
      };
      const transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        port: 587,
        secure: false,
        auth: {
          user: "rohitanabhavane26@gmail.com",
          pass: "eghq byjb ggbk wgbm",
        },
      });

      const info = await transporter.sendMail(mailOptions);
      res.status(200).send({
        success: true,
        message: "Email with PDF sent successfully",
        info: info,
      });
    } catch (error) {
      console.error("Failed to generate or send PDF:", error);
      res.status(500).send({
        success: false,
        message: "Failed to generate or send PDF",
        error: error.message,
      });
    } finally {
      if (browser) await browser.close();
    }
  },
  local_PDF: async (req, res) => {
    const { htmlContent, headerImageURL, pdfFilename } = req.body;

    let browser;
    try {
      // Fetch the image and convert it to base64
      const response = await fetch(headerImageURL);
      if (!response.ok) throw new Error("Failed to fetch the header image");
      const imageBuffer = await response.buffer();
      const base64Image = imageBuffer.toString("base64");
      const imageType = headerImageURL.endsWith(".png") ? "png" : "jpeg"; // Set image type based on URL

      // Launch Puppeteer
      browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox"],
        executablePath: "/usr/bin/chromium-browser", // The path to the executable on the server linux (ubuntu) for windows remove this parameter
      });
      const page = await browser.newPage();

      const fullHTML = `
            <html>
                <body>
                    <div>${htmlContent}</div>
                </body>
            </html>
        `;

      // Set the page content and wait for it to load
      await page.setContent(fullHTML, { waitUntil: "networkidle0" });

      // Generate the PDF with the header repeated on each page
      const pdfBuffer = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: {
          top: "250px", // Leave room for the header
          bottom: "40px", // Optional: Leave room for a footer
          left: "20px",
          right: "20px",
        },
        displayHeaderFooter: true,
        headerTemplate: `
                <div style="width: 100%; text-align: center; font-size: 10px; padding: 10px;">
                    <img src="data:image/${imageType};base64,${base64Image}" style="width: 100%; height: auto;" />
                </div>
            `,
        footerTemplate: `<span></span>`, // Optional: Add a footer template here if needed
      });

      // Send the generated PDF back to the client
      res.set({
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="${
          pdfFilename || "GeneratedPDF"
        }.pdf"`,
      });

      res.send(pdfBuffer);
    } catch (error) {
      console.error("Error generating PDF:", error);
      res
        .status(500)
        .send({
          success: false,
          message: "Failed to generate PDF",
          error: error.message,
        });
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
  localPDFReports: async (req, res) => {
    try {
      const { htmlContent, orientation, pdfFilename } = req.body;

      // Launch a new browser instance
      const browser = await puppeteer.launch({
        args: ["--no-sandbox", "--disable-setuid-sandbox"], // For environments like cloud servers
        // executablePath: '/usr/bin/chromium-browser', // The path to the executable on the server linux (ubuntu) for windows remove this parameter
      });
      const page = await browser.newPage();

      // Set the HTML content
      await page.setContent(htmlContent, {
        waitUntil: "domcontentloaded", // Wait until all DOM content is loaded
      });

      // Inject Tailwind CSS or any other styles if needed
      await page.addStyleTag({
        url: "https://cdn.jsdelivr.net/npm/tailwindcss@2.2.19/dist/tailwind.min.css",
      });

      // Generate the PDF with the provided orientation
      const pdfBuffer = await page.pdf({
        format: "A4", // Use A4 size
        printBackground: true, // Ensure background colors and images are included
        landscape: orientation === "landscape", // Set orientation based on input
        margin: {
          top: "20px",
          bottom: "20px",
          left: "20px",
          right: "20px",
        },
      });

      // Close the browser after generating the PDF
      await browser.close();

      // Set response headers to handle the PDF download
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader(
        "Content-Disposition",
        `attachment; filename="${pdfFilename}.pdf"`
      );

      // Send the PDF buffer as binary data
      res.end(pdfBuffer, "binary");
    } catch (error) {
      console.error("Error generating PDF:", error);
      res.status(500).send("An error occurred while generating the PDF");
    }
  },
  EmailLogin: async (req, res) => {
    const { to, cc, bcc, subject, body } = req.body;

    if (!to) {
      return res.status(400).send({
        success: false,
        message: "Missing mandatory email fields: 'To' is required.",
      });
    }

    let transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false,
      auth: {
        user: "rohitanabhavane26@gmail.com",
        pass: "eghq byjb ggbk wgbm",
      },
    });

    // Prepare the email data
    const mailOptions = {
      from: "rohitanabhavane26@gmail.com",
      to: to,
      cc: cc,
      bcc: bcc,
      subject: subject,
      html: body,
    };

    try {
      let info = await transporter.sendMail(mailOptions);
      res.status(200).send({
        success: true,
        message: "Email sent successfully",
        info: info,
      });
    } catch (error) {
      res.status(500).send({
        success: false,
        message: "Failed to send email",
        error: error.message,
      });
    }
  },
};
