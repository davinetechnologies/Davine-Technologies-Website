const { generateIdCard } = require("../utils/generateIdCard");
const sendEmail = require("../utils/sendEmail");
const fs = require("fs");
const path = require("path");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const Application = require("../models/Application");
const Onboarding = require("../models/Onboarding");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

exports.createOrder = async (req, res) => {
  try {
    const options = {
      amount: 9900, // ₹99 (amount is in paise)
      currency: "INR",
      receipt: `receipt_${Date.now()}`
    };

    const order = await razorpay.orders.create(options);

console.log("========== RAZORPAY ORDER ==========");
console.log(order);
console.log("====================================");

    res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      success: false,
      message: "Failed to create order"
    });
  }
};
exports.verifyPayment = async (req, res) => {

const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    email
} = req.body;

    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
const body = razorpay_order_id + "|" + razorpay_payment_id;

const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

if (expectedSignature === razorpay_signature) {
const lastIntern = await Onboarding
  .findOne({ internId: { $exists: true } })
  .sort({ createdAt: -1 });

let nextNumber = 1;

if (lastIntern && lastIntern.internId) {

  const lastNumber = parseInt(
    lastIntern.internId.replace("DT", "")
  );

  if (!isNaN(lastNumber)) {
    nextNumber = lastNumber + 1;
  }

}

const internId =
  "DT" + String(nextNumber).padStart(2, "0");

const updatedIntern = await Onboarding.findOneAndUpdate(
  {
     email,
  paymentStatus: "Pending"
  },
  {
    paymentStatus: "Paid",
    onboardingStatus: "Completed",
    paymentId: razorpay_payment_id,
    orderId: razorpay_order_id,
    signature: razorpay_signature,
    paymentDate: new Date(),
    internId: internId
  },
  {
    new: true
  }
);
if (!updatedIntern) {
    return res.status(404).json({
        success: false,
        message: "Onboarding record not found."
    });
}
await generateIdCard(updatedIntern);

const imagePath = path.join(
    __dirname,
    "../generated/idcards",
    `${updatedIntern.internId}.png`
);

const imageBase64 = fs
  .readFileSync(imagePath)
  .toString("base64");
  try {
await sendEmail({
  to: updatedIntern.email,

  subject: "Welcome to Davine Technologies | Internship Registration Confirmed",

  htmlContent: `
    <h2>Welcome to Davine Technologies 🎉</h2>

    <p>Dear <strong>${updatedIntern.fullName}</strong>,</p>

    <p>Your onboarding payment has been successfully verified.</p>

    <p>Your Internship Registration has been confirmed.</p>

    <p><strong>Intern ID:</strong> ${updatedIntern.internId}</p>

    <p>Your Internship Identity Card is attached with this email.</p>

    <br>

    <p>Regards,<br>
    HR Department<br>
    Davine Technologies</p>
  `,

  attachment: {
    name: `${updatedIntern.internId}.png`,
    content: imageBase64,
  },
});
} catch (error) {
    console.error("Email sending failed:", error);
}

console.log("✅ Payment status updated successfully.");

return res.json({
    success: true,
    message: "Payment Verified Successfully ✅",
    internId: internId
});

} else {

    return res.status(400).json({
        success: false,
        message: "Payment Verification Failed ❌"
    });

}

};

