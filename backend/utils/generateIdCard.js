const fs = require("fs");
const path = require("path");
const QRCode = require("qrcode");
const puppeteer = require("puppeteer");

exports.generateIdCard = async (intern) => {

    console.log("Generating ID Card...");
    const qrData = `https://davinetechnologies.com/verify/${intern.internId}`;

const qrImage = await QRCode.toDataURL(qrData);
const logoPath = path.join(__dirname, "../assets/oglogo.png");
const stampPath = path.join(__dirname, "../assets/hr-stamp.png");

const logoBase64 =
  "data:image/png;base64," +
  fs.readFileSync(logoPath).toString("base64");

const stampBase64 =
  "data:image/png;base64," +
  fs.readFileSync(stampPath).toString("base64");

    const templatePath = path.join(
        __dirname,
        "../templates/id-card.html"
    );

    let html = fs.readFileSync(templatePath, "utf8");

html = html
    .replace(/{{FULL_NAME}}/g, intern.fullName)
    .replace(/{{ROLE}}/g, intern.role)
    .replace(/{{INTERN_ID}}/g, intern.internId)
    .replace(
        /{{JOINING_DATE}}/g,
        new Date(intern.paymentDate).toLocaleDateString("en-IN")
    )
    .replace(/{{QR_CODE}}/g, qrImage)
    .replace(/{{LOGO}}/g, logoBase64)
    .replace(/{{STAMP}}/g, stampBase64);

console.log(html);
    const browser = await puppeteer.launch({
    headless: true
});

const page = await browser.newPage();

await page.setViewport({
    width: 1012,
    height: 638,
    deviceScaleFactor: 2
});

await page.setContent(html, {
    waitUntil: "networkidle0"
});

const imagePath = path.join(
    __dirname,
    "../generated/idcards",
    `${intern.internId}.png`
);

await page.screenshot({
    path: imagePath,
    type: "png"
});

await browser.close();

console.log("ID Card PNG Generated:", imagePath);
    const outputPath = path.join(
    __dirname,
    "../generated/test.html"
);

fs.writeFileSync(outputPath, html);

console.log("HTML File Created Successfully");

};