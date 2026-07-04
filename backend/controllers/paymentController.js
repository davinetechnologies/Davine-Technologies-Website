const { generateIdCard } = require("../utils/generateIdCard");
const { sendIdCardEmail } = require("../utils/sendEmail");
const Razorpay = require("razorpay");
const crypto = require("crypto");
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
const joiningDate = new Date(updatedIntern.paymentDate)
  .toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

const pdfPath = await generateIdCard({
  fullName: updatedIntern.fullName,
  role: updatedIntern.role,
  internId: updatedIntern.internId,
  joiningDate,
});

try {

  await sendIdCardEmail({
    toEmail: updatedIntern.email,
    toName: updatedIntern.fullName,
    internId: updatedIntern.internId,
    pdfPath,
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

