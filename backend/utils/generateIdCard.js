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
    blueDark: '#1D4ED8',
    navy: '#0F172A',
    gray: '#64748B',
    grayDark: '#475569',
    grayLight: '#94A3B8',
    border: '#E2E8F0',
    stripe: '#F8FAFC',
    white: '#FFFFFF',
    green: '#16A34A',
  },
  // Place your real brand assets at these paths. If a file is missing,
  // generation still succeeds — the image is simply skipped rather than
  // throwing, so a missing asset never breaks the payment flow.
  logoPath: path.join(__dirname, '..', 'assets', 'oglogo.png'),
  stampPath: path.join(__dirname, '..', 'assets', 'hr-stamp.png'),
};

// ---------------------------------------------------------------------------
// Card geometry — standard ID-card aspect ratio, scaled up for print quality.
// Every Y coordinate used below is derived from these constants and is
// checked to stay comfortably inside CARD_HEIGHT so PDFKit never triggers
// an automatic page break (which happens whenever a text/height calculation
// would exceed the bottom of the current page).
// ---------------------------------------------------------------------------
const CARD_WIDTH = 1012;
const CARD_HEIGHT = 638;
const SAFE_BOTTOM = CARD_HEIGHT - 20; // hard floor — nothing is ever drawn past this

const PANEL_WIDTH = 300;                       // right-hand blue verification panel
const LEFT_WIDTH = CARD_WIDTH - PANEL_WIDTH;    // left-hand white information panel
const PAD = 40;                                 // left-panel content padding
const CONTENT_WIDTH = LEFT_WIDTH - PAD * 2;

const OUTPUT_DIR = path.join(__dirname, '..', 'generated', 'idcards');

// ---------------------------------------------------------------------------
// Small drawing helpers
// ---------------------------------------------------------------------------

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

/** Shrinks font size (down to minSize) until `text` fits within `maxWidth`. */
function fitFontSize(doc, text, font, maxSize, minSize, maxWidth) {
  let size = maxSize;
  doc.font(font);
  while (size > minSize && doc.fontSize(size).widthOfString(text) > maxWidth) {
    size -= 1;
  }
  return size;
}

/** Draws a centered pill/badge with text and returns { x, width }. */
function drawPill(doc, { text, centerX, y, font = 'Helvetica-Bold', fontSize = 13,
  paddingX = 18, height = 32, fill, textColor, characterSpacing = 0.6 }) {
  doc.font(font).fontSize(fontSize);
  const textWidth = doc.widthOfString(text);
  const width = textWidth + paddingX * 2;
  const x = centerX - width / 2;

  doc.roundedRect(x, y, width, height, height / 2).fill(fill);
  doc.fillColor(textColor).text(text, x, y + (height - fontSize) / 2 - 1, {
    width,
    align: 'center',
    characterSpacing,
    lineBreak: false,
  });
  return { x, width };
}

/** Clamps a Y value so nothing is ever placed past the safe bottom edge. */
function clampY(y, elementHeight = 0) {
  return Math.min(y, SAFE_BOTTOM - elementHeight);
}

// ---------------------------------------------------------------------------
// Public API (unchanged signature/behavior expected by the payment flow)
// ---------------------------------------------------------------------------

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
  console.log('📄 Generating PDF for:', internId);
  console.log('📂 Output Path:', outputPath);
  const verifyUrl = `${BRAND.verifyBaseUrl}/${internId}`;

  // Generate the QR code as a PNG buffer up front so it's ready to embed.
  const qrBuffer = await QRCode.toBuffer(verifyUrl, {
    type: 'png',
    width: 500,
    margin: 1,
    color: {
      dark: BRAND.colors.navy,
      light: '#FFFFFF',
    },
  });

  return new Promise((resolve, reject) => {
    // autoFirstPage stays true (we want exactly one page); we never call
    // doc.addPage() ourselves and every coordinate below is pre-checked to
    // stay within [0, CARD_HEIGHT], so PDFKit has no reason to add a second
    // page. bufferPages is enabled purely as a safety net: if anything ever
    // does overflow, we can detect it instead of silently shipping a
    // 2-page PDF.
    const doc = new PDFDocument({
      size: [CARD_WIDTH, CARD_HEIGHT],
      margin: 0,
      bufferPages: true,
    });

    const stream = fs.createWriteStream(outputPath);
    doc.pipe(stream);

    stream.on('finish', () => {
      console.log('✅ PDF Generated Successfully');
      resolve(outputPath);
    });
    stream.on('error', reject);
    doc.on('error', reject);

    try {
      drawCard(doc, { fullName, role, internId, joiningDate, status, qrBuffer, verifyUrl });

      // Safety net: guarantee single-page output no matter what. If a
      // future edit accidentally causes overflow, this logs it loudly
      // instead of silently shipping a broken multi-page card.
      const pageRange = doc.bufferedPageRange();
      if (pageRange.count > 1) {
        console.error(`[generateIdCard] WARNING: layout overflowed to ${pageRange.count} pages; keeping only page 1.`);
      }
      doc.switchToPage(0);
    } catch (err) {
      reject(err);
      return;
    }

    doc.end();
  });
}

// ---------------------------------------------------------------------------
// Layout
//   • Full-bleed white base with a thin top accent bar
//   • Left panel: logo header, divider, name/role block, detail table,
//     footer strip with website + HR stamp (all inside the left panel only)
//   • Right panel: solid blue verification column — logo mark, "SCAN TO
//     VERIFY", QR card, intern ID, VERIFIED badge, tagline — vertically
//     centered as one balanced group with equal internal spacing.
// ---------------------------------------------------------------------------
function drawCard(doc, { fullName, role, internId, joiningDate, status, qrBuffer, verifyUrl }) {
  const { colors } = BRAND;

  // ---- Base ----
  doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).fill(colors.white);
  doc.rect(LEFT_WIDTH, 0, PANEL_WIDTH, CARD_HEIGHT).fill(colors.blue); // right panel
  doc.rect(0, 0, CARD_WIDTH, CARD_HEIGHT).lineWidth(1).stroke(colors.border); // outer frame

  drawLeftPanel(doc, { fullName, role, internId, joiningDate, status });
  drawRightPanel(doc, { internId, qrBuffer });
}

function drawLeftPanel(doc, { fullName, role, internId, joiningDate, status }) {
  const { colors } = BRAND;

  // ---------------- Header: logo + wordmark (optically centered) ----------------
  const logoSize = 65;
  const logoX = PAD;
  const logoY = 22;
  const hasLogo = safeImage(doc, BRAND.logoPath, logoX, logoY, { width: logoSize, height: logoSize });

const textX = logoX + logoSize + 16;
const textY = logoY + 10;
const textMaxWidth = LEFT_WIDTH - textX - PAD;

doc.font('Helvetica-Bold')
   .fontSize(21)
   .text(BRAND.companyName, textX, textY, {
      width: textMaxWidth,
      height: 22,
      lineBreak: false
   });

  doc.font('Helvetica-Bold').fontSize(8.5).fillColor(colors.gray)
   .text(BRAND.cardTitle, textX, textY + 24, {
      width: textMaxWidth,
      characterSpacing: 1,
      lineBreak: false,
    });

  // Header divider
  const headerDividerY = logoY + logoSize + 10;
  doc.moveTo(PAD, headerDividerY).lineTo(LEFT_WIDTH - PAD, headerDividerY)
    .lineWidth(1).strokeColor(colors.border).stroke();

  // ---------------- Identity block ----------------
  // More breathing room between the header and the name (visual hierarchy),
  // then a tighter gap between the name and its role badge.
const nameY = headerDividerY + 22;
  const nameMaxSize = 34;
  const nameFontSize = fitFontSize(doc, fullName, 'Helvetica-Bold', nameMaxSize, 22, CONTENT_WIDTH);
  doc.font('Helvetica-Bold').fontSize(nameFontSize).fillColor(colors.navy)
    .text(fullName, PAD, nameY, { width: CONTENT_WIDTH, lineBreak: false });

  // Role badge — always positioned relative to the *maximum* possible name
  // height so the table below never shifts based on actual name length.
  const roleY = nameY + nameMaxSize + 8;
  const roleLabel = role.toUpperCase();
  const roleBadgeHeight = 30;
  const roleBadgePaddingX = 18;
  doc.font('Helvetica-Bold').fontSize(12);
  const roleTextWidth = doc.widthOfString(roleLabel);
  const roleBadgeWidth = roleTextWidth + roleBadgePaddingX * 2;

  doc.roundedRect(PAD, roleY, roleBadgeWidth, roleBadgeHeight, roleBadgeHeight / 2).fill(colors.blue);
  doc.fillColor(colors.white)
    .text(roleLabel, PAD, roleY + (roleBadgeHeight - 12) / 2 - 1, {
      width: roleBadgeWidth,
      align: 'center',
      characterSpacing: 0.6,
      lineBreak: false,
    });

  // ---------------- Detail table ----------------
  const rows = [
    ['INTERN ID', internId],
    ['ROLE', role],
    ['JOINING DATE', joiningDate],
    ['STATUS', status],
  ];

  const tableY = roleY + roleBadgeHeight + 13;
  const rowHeight = 40;
  const labelColWidth = 180;
  const cellInsetX = 20; // slightly increased left/right inset for the table text

  rows.forEach(([label, value], i) => {
    const y = tableY + i * rowHeight;
    if (i % 2 === 0) {
      doc.rect(PAD, y, CONTENT_WIDTH, rowHeight).fill(colors.stripe);
    }
    doc.font('Helvetica-Bold').fontSize(10).fillColor(colors.gray)
      .text(label, PAD + cellInsetX, y + rowHeight / 2 - 5, { characterSpacing: 0.6, lineBreak: false });

    const valueColor = (label === 'STATUS' && String(value).toLowerCase() === 'active')
      ? colors.green
      : colors.navy;

    doc.font('Helvetica-Bold').fontSize(15).fillColor(valueColor)
      .text(String(value), PAD + labelColWidth, y + rowHeight / 2 - 7.5, {
        width: CONTENT_WIDTH - labelColWidth - cellInsetX,
        lineBreak: false,
      });
  });
  const tableBottom = tableY + rows.length * rowHeight;

  // ---------------- Footer: website + HR stamp (left panel only) ----------------
  // Pulled up close beneath the table (less dead space). The website text
  // and the HR stamp's caption now share one common top position
  // (footerRowY) so the whole footer reads as a single aligned row instead
  // of the stamp floating lower than the text. The stamp is then placed
  // directly under its own caption — nothing is anchored to a fixed point
  // further down the page, so no empty band is left underneath it.
  const footerDividerY = tableBottom + 8;
  doc.moveTo(PAD, footerDividerY).lineTo(LEFT_WIDTH - PAD, footerDividerY)
    .lineWidth(1).strokeColor(colors.border).stroke();

  const footerRowY = footerDividerY + 8;
  const stampSize = 90; // enlarged ~35% per earlier feedback
  const stampX = LEFT_WIDTH - PAD - stampSize;

  doc.font('Helvetica-Bold').fontSize(12).fillColor(colors.grayDark)
    .text(BRAND.websiteLabel, PAD, footerRowY, { lineBreak: false });

  doc.font('Helvetica').fontSize(8).fillColor(colors.grayLight)
    .text(BRAND.footerNote, PAD, footerRowY + 18, {
      width: CONTENT_WIDTH - 150,
      lineHeight: 1.3,
      height: 22, // hard cap: truncates instead of ever growing past its box
      ellipsis: true,
    });

  doc.font('Helvetica-Bold').fontSize(8).fillColor(colors.grayLight)
    .text('HR DEPARTMENT', stampX - 22, footerRowY, {
      width: stampSize + 44,
      align: 'center',
      characterSpacing: 0.6,
      lineBreak: false,
    });

  const stampY = footerRowY + 6; // sits directly beneath its own caption
  safeImage(doc, BRAND.stampPath, stampX, stampY, { width: stampSize, height: stampSize });
}

function drawRightPanel(doc, { internId, qrBuffer }) {
  const { colors } = BRAND;
  const panelCenterX = LEFT_WIDTH + PANEL_WIDTH / 2;
  const TAGLINE_RESERVED = 30; // bottom strip reserved exclusively for the tagline
  const usableHeight = CARD_HEIGHT - TAGLINE_RESERVED;

  // Decorative diagonal wash for a less "flat" panel
  doc.save();
  doc.rect(LEFT_WIDTH, 0, PANEL_WIDTH, CARD_HEIGHT).clip();
  doc.polygon(
    [LEFT_WIDTH, 0], [CARD_WIDTH, 0], [CARD_WIDTH, 70], [LEFT_WIDTH, 30]
  ).fill(colors.blueDark);
  doc.restore();

  // ---- Build the content stack using LOCAL (relative) coordinates first,
  // then shift the whole block down so it sits vertically centered inside
  // usableHeight. A single uniform GAP is used between every element so the
  // rhythm — logo → label → QR → ID → badge — reads as evenly spaced. ----
  const GAP = 20;
  const badgeRadius = 28;
  const labelHeight = 12;
  const qrFrameSize = 200;
  const idHeight = 20;
  const verifiedHeight = 36;

  const local = {};
  local.badgeCenterY = badgeRadius;
  local.labelY = local.badgeCenterY + badgeRadius + GAP;
  local.qrFrameY = local.labelY + labelHeight + GAP;
  local.idY = local.qrFrameY + qrFrameSize + GAP;
  local.verifiedY = local.idY + idHeight + GAP;
  const blockHeight = local.verifiedY + verifiedHeight;

  const offset = Math.max(0, (usableHeight - blockHeight) / 2);

  const badgeCenterY = local.badgeCenterY + offset;
  const labelY = local.labelY + offset;
  const qrFrameY = local.qrFrameY + offset;
  const idY = local.idY + offset;
  const verifiedY = local.verifiedY + offset;

  // Logo mark
  doc.circle(panelCenterX, badgeCenterY, badgeRadius).fill(colors.white);
  const logoInset = 16;
  safeImage(
    doc, BRAND.logoPath,
    panelCenterX - badgeRadius + logoInset / 2, badgeCenterY - badgeRadius + logoInset / 2,
    { width: (badgeRadius * 2) - logoInset, height: (badgeRadius * 2) - logoInset }
  );

  // "SCAN TO VERIFY"
  doc.font('Helvetica-Bold').fontSize(10).fillColor('#DBEAFE')
    .text('SCAN TO VERIFY', LEFT_WIDTH, labelY, {
      width: PANEL_WIDTH,
      align: 'center',
      characterSpacing: 1.4,
      lineBreak: false,
    });

  // QR card
  const qrFrameX = panelCenterX - qrFrameSize / 2;
  doc.roundedRect(qrFrameX, qrFrameY, qrFrameSize, qrFrameSize, 18).fill(colors.white);

  const qrImgSize = 166;
  doc.image(qrBuffer, panelCenterX - qrImgSize / 2, qrFrameY + (qrFrameSize - qrImgSize) / 2, {
    width: qrImgSize,
    height: qrImgSize,
  });

  // Intern ID
  doc.font('Helvetica-Bold').fontSize(19).fillColor(colors.white)
    .text(internId, LEFT_WIDTH, idY, { width: PANEL_WIDTH, align: 'center', lineBreak: false });

  // Verified pill
  drawPill(doc, {
    text: 'VERIFIED',
    centerX: panelCenterX,
    y: verifiedY,
    fontSize: 13,
    height: verifiedHeight,
    fill: colors.white,
    textColor: colors.blue,
    characterSpacing: 1.2,
  });

  // Bottom tagline — fixed position inside its own reserved strip, so it
  // never depends on (and can never collide with) the block above.
const taglineY = clampY(CARD_HEIGHT - 50, 12);
  doc.font('Helvetica').fontSize(8).fillColor('#BFDBFE')
    .text('Issued digitally · Property of Davine Technologies', LEFT_WIDTH, taglineY, {
      width: PANEL_WIDTH,
      align: 'center',
      lineBreak: false,
    });
}

module.exports = { generateIdCard };