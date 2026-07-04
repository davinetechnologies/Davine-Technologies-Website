'use strict';

const fs = require('fs');
const path = require('path');
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');

// ---------------------------------------------------------------------------
// Brand configuration — adjust to match your real assets/colors.
// ---------------------------------------------------------------------------
const BRAND = {
  companyName: 'Davine Technologies',
  cardTitle: 'OFFICIAL INTERNSHIP IDENTITY CARD',
  websiteLabel: 'www.davinetechnologies.com',
  verifyBaseUrl: 'https://davinetechnologies.com/verify',
  colors: {
    blue: '#2563EB',
    navy: '#0F172A',
    gray: '#64748B',
    grayDark: '#475569',
    grayLight: '#94A3B8',
    white: '#FFFFFF',
  },
  // Place your real brand assets at these paths. If a file is missing,
  // generation still succeeds — the image is simply skipped rather than
  // throwing, so a missing asset never breaks the payment flow.
  logoPath: path.join(__dirname, '..', 'assets', 'oglogo.png'),
  stampPath: path.join(__dirname, '..', 'assets', 'hr-stamp.png'),
};

const CARD_WIDTH = 1012;
const CARD_HEIGHT = 638;
const PANEL_WIDTH = 320;
const LEFT_WIDTH = CARD_WIDTH - PANEL_WIDTH;

const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'idcards');

/**
 * Draws an image at the given box only if the file actually exists on disk.
 * Prevents PDFKit from throwing (and the whole request failing) just because
 * a logo/stamp asset hasn't been uploaded to the server yet.
 */
function safeImage(doc, filePath, x, y, opts) {
  try {
    if (filePath && fs.existsSync(filePath)) {
      doc.image(filePath, x, y, opts);
      return true;
    }
  } catch (err) {
    console.error('[generateIdCard] Failed to draw image:', filePath, err.message);
  }
  return false;
}

/**
 * Generates the internship ID card PDF for a single intern and saves it to
 * backend/generated/idcards/{internId}.pdf
 *
 * @param {Object} data
 * @param {string} data.fullName
 * @param {string} data.role
 * @param {string} data.internId
 * @param {string} data.joiningDate - already formatted for display, e.g. "15 July 2026"
 * @param {string} [data.status] - defaults to "Active"
 * @returns {Promise<string>} absolute path to the generated PDF file
 */
async function generateIdCard(data) {
  const { fullName, role, internId, joiningDate, status = 'Active' } = data || {};

  if (!fullName || !role || !internId || !joiningDate) {
    throw new Error('generateIdCard: fullName, role, internId and joiningDate are required');
  }

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const outputPath = path.join(OUTPUT_DIR, `${internId}.pdf`);
  console.log("📄 Generating PDF for:", internId);
  console.log("📂 Output Path:", outputPath);
  const verifyUrl = `${BRAND.verifyBaseUrl}/${internId}`;

  // Generate the QR code as a PNG buffer up front so it's ready to embed.
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 400,
    margin: 1,
    color: {
      dark: BRAND.colors.navy,
      light: '#FFFFFF',
    },
  });

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: [CARD_WIDTH, CARD_HEIGHT],
      margin: 0,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

stream.on("finish", () => {
  console.log("✅ PDF Generated Successfully");
  resolve(outputPath);
});    stream.on('error', reject);
    doc.on('error', reject);

    try {
      drawCard(doc, { fullName, role, internId, joiningDate, status, qrBuffer });
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

function drawCard(doc, { fullName, role, internId, joiningDate, status, qrBuffer }) {
  const { colors } = BRAND;

  // Base card background
  doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(colors.white);

  // Right panel (blue)
  doc.rect(LEFT_WIDTH, 0, PANEL_WIDTH, CARD_HEIGHT).fill(colors.blue);

  // ---------------- LEFT SECTION ----------------
  const padLeft = 48;
  const padTop = 40;
  const contentWidth = LEFT_WIDTH - padLeft - 40;

  // Header: logo + wordmark
  const logoHeight = 58;
  const hasLogo = safeImage(doc, BRAND.logoPath, padLeft, padTop, { height: logoHeight });
  const textX = hasLogo ? padLeft + logoHeight * 1.4 + 18 : padLeft;

  doc.font('Helvetica-Bold').fontSize(25).fillColor(colors.navy)
    .text(BRAND.companyName, textX, padTop + 6, { lineBreak: false });

  doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.grayDark)
    .text(BRAND.cardTitle, textX, padTop + 6 + 27, {
      characterSpacing: 0.8,
      lineBreak: false,
    });

  // Identity block
  const identityY = padTop + logoHeight + 38;
  doc.font('Helvetica-Bold').fontSize(48).fillColor(colors.navy)
    .text(fullName, padLeft, identityY, { width: contentWidth, lineBreak: false });

  const roleY = identityY + 60;
  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.blue)
    .text(role.toUpperCase(), padLeft, roleY, { characterSpacing: 0.4, lineBreak: false });

  // Info table
  const rows = [
    ['INTERN ID', internId],
    ['ROLE', role],
    ['JOINING DATE', joiningDate],
    ['STATUS', status],
  ];

  const labelColWidth = 172;
  let rowY = roleY + 46;
  const rowGap = 42;

  rows.forEach(([label, value]) => {
    doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.gray)
      .text(label, padLeft, rowY, { characterSpacing: 0.5, lineBreak: false });
    doc.font('Helvetica-Bold').fontSize(19).fillColor(colors.navy)
      .text(String(value), padLeft + labelColWidth, rowY - 4, { lineBreak: false });
    rowY += rowGap;
  });

  // Footer: website (bottom-left) + HR stamp (bottom-right)
  doc.font('Helvetica-Bold').fontSize(14).fillColor(colors.grayDark)
    .text(BRAND.websiteLabel, padLeft, CARD_HEIGHT - 40 - 14, { lineBreak: false });

  const stampHeight = 88;
  const stampY = CARD_HEIGHT - 40 - stampHeight;
  const stampCenterX = LEFT_WIDTH - 40 - 90;

  doc.font('Helvetica-Bold').fontSize(11).fillColor(colors.grayLight)
    .text('HR DEPARTMENT', stampCenterX - 30, stampY - 20, {
      width: 180,
      align: 'center',
      characterSpacing: 0.8,
      lineBreak: false,
    });
  safeImage(doc, BRAND.stampPath, stampCenterX, stampY, { height: stampHeight });

  // ---------------- RIGHT PANEL ----------------
  const panelCenterX = LEFT_WIDTH + PANEL_WIDTH / 2;

  const qrFrameSize = 160;
  const qrFrameX = panelCenterX - qrFrameSize / 2;
  const qrFrameY = 100;
  doc.roundedRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 16).fill(colors.white);

  const qrImgSize = 130;
  doc.image(qrBuffer, panelCenterX - qrImgSize / 2, qrFrameY + (qrFrameSize - qrImgSize) / 2, {
    width: qrImgSize,
    height: qrImgSize,
  });

  const captionY = qrFrameY + qrFrameSize + 24;
  doc.font('Helvetica-Bold').fontSize(12).fillColor('#E5EDFF')
    .text('VERIFICATION QR', LEFT_WIDTH, captionY, {
      width: PANEL_WIDTH,
      align: 'center',
      characterSpacing: 1,
      lineBreak: false,
    });

  doc.font('Helvetica-Bold').fontSize(18).fillColor(colors.white)
    .text(internId, LEFT_WIDTH, captionY + 20, {
      width: PANEL_WIDTH,
      align: 'center',
      lineBreak: false,
    });

  const badgeText = 'VERIFIED';
  const badgeY = captionY + 56;
  const badgeWidth = 140;
  const badgeHeight = 32;
  doc.roundedRect(panelCenterX - badgeWidth / 2, badgeY, badgeWidth, badgeHeight, 16).fill(colors.white);
  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.blue)
    .text(badgeText, panelCenterX - badgeWidth / 2, badgeY + 10, {
      width: badgeWidth,
      align: 'center',
      characterSpacing: 1,
      lineBreak: false,
    });
}

module.exports = { generateIdCard };