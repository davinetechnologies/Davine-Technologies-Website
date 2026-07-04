'use strict';

const fs = require('fs');
const axios = require('axios');

const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';

const SENDER = {
  name: process.env.BREVO_SENDER_NAME || 'Davine Technologies',
  email: process.env.BREVO_SENDER_EMAIL || 'davinetechnologies@gmail.com',
};

/**
 * Sends the internship ID card PDF to a candidate via the Brevo
 * transactional email API.
 *
 * @param {Object} params
 * @param {string} params.toEmail
 * @param {string} params.toName
 * @param {string} params.internId
 * @param {string} params.pdfPath - absolute path to the generated PDF file
 */
async function sendIdCardEmail({ toEmail, toName, internId, pdfPath }) {
  if (!toEmail) {
    throw new Error('sendIdCardEmail: toEmail is required');
  }
  if (!process.env.BREVO_API_KEY) {
    throw new Error('sendIdCardEmail: BREVO_API_KEY environment variable is not set');
  }
  if (!fs.existsSync(pdfPath)) {
    throw new Error(`sendIdCardEmail: PDF not found at ${pdfPath}`);
  }

  const pdfBuffer = fs.readFileSync(pdfPath);
  const pdfBase64 = pdfBuffer.toString('base64');

  const payload = {
    sender: SENDER,
    to: [{ email: toEmail, name: toName || undefined }],
    subject: `Welcome to Davine Technologies — Your Internship ID Card (${internId})`,
    htmlContent: buildEmailHtml({ toName, internId }),
    attachment: [
      {
        content: pdfBase64,
        name: `${internId}.pdf`,
      },
    ],
  };

  await axios.post(BREVO_API_URL, payload, {
    headers: {
      'api-key': process.env.BREVO_API_KEY,
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
  });
}

function buildEmailHtml({ toName, internId }) {
  const name = toName || 'there';
  return `
    <div style="font-family:Arial,Helvetica,sans-serif;max-width:520px;margin:0 auto;color:#0F172A;">
      <h2 style="color:#0F172A;margin-bottom:12px;">Welcome to Davine Technologies, ${name}!</h2>
      <p style="color:#475569;line-height:1.6;">
        Your onboarding payment has been received and your internship registration is confirmed.
        Your official Digital Internship ID Card (Intern ID: <strong>${internId}</strong>) is attached
        to this email as a PDF.
      </p>
      <p style="color:#475569;line-height:1.6;">
        Please keep this ID card for your records. Further onboarding instructions will follow shortly
        by email.
      </p>
      <p style="color:#475569;line-height:1.6;margin-top:24px;">— Davine Technologies HR Team</p>
    </div>
  `;
}

module.exports = { sendIdCardEmail };