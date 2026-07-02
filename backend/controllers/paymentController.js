const Razorpay = require("razorpay");
const crypto = require("crypto");

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
        razorpay_signature
    } = req.body;

    console.log("Order ID:", razorpay_order_id);
    console.log("Payment ID:", razorpay_payment_id);
const body = razorpay_order_id + "|" + razorpay_payment_id;

const expectedSignature = crypto
    .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
    .update(body.toString())
    .digest("hex");

if (expectedSignature === razorpay_signature) {

    return res.json({
        success: true,
        message: "Payment Verified Successfully ✅"
    });

} else {

    return res.status(400).json({
        success: false,
        message: "Payment Verification Failed ❌"
    });

}

};