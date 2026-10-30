const { generateIdCard } = require("../utils/generateIdCard");
const { sendIdCardEmail } = require("../utils/sendEmail");
const Razorpay = require("razorpay");
const crypto = require("crypto");
const mongoose = require("mongoose");
const Onboarding = require("../models/Onboarding");
const InternCounter = require("../models/InternCounter");

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET,
});

const PACKAGE_PRICES = {
  "Career Starter": 100,
  "Professional Plus": 289,
  "Mentorship Pro": 549,
  "Master Career Program": 999,
};

// CREATE RAZORPAY ORDER
exports.createOrder = async (req, res) => {
  try {
    const { packageName, onboardingId } = req.body;

    if (
      typeof packageName !== "string" ||
      !Object.prototype.hasOwnProperty.call(PACKAGE_PRICES, packageName) ||
      !mongoose.isValidObjectId(onboardingId)
    ) {
      return res.status(400).json({
        success: false,
        message: "Valid package and onboarding ID are required.",
      });
    }

    const onboarding = await Onboarding.findById(onboardingId);

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Onboarding record not found.",
      });
    }

    if (onboarding.paymentStatus === "Paid") {
      return res.status(409).json({
        success: false,
        message: "Payment is already completed.",
      });
    }

    if (onboarding.orderId) {
      return res.status(409).json({
        success: false,
        message: "A payment order already exists for this onboarding. Please restart the payment flow.",
      });
    }

    const amount = PACKAGE_PRICES[packageName];

    // Save the server-controlled package and amount
    onboarding.package = packageName;
    onboarding.amount = amount;
    await onboarding.save();

    const order = await razorpay.orders.create({
      amount: amount * 100,
      currency: "INR",
      receipt: `onboard_${onboarding._id}`,
      notes: {
        onboardingId: onboarding._id.toString(),
        packageName,
      },
    });

    onboarding.orderId = order.id;
    await onboarding.save();

    return res.json({
      success: true,
      order,
      key: process.env.RAZORPAY_KEY_ID,
    });
  } catch (error) {
    console.error("Razorpay order creation failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Failed to create payment order.",
    });
  }
};

// VERIFY RAZORPAY PAYMENT
exports.verifyPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (
      typeof razorpay_order_id !== "string" ||
      typeof razorpay_payment_id !== "string" ||
      typeof razorpay_signature !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message: "Required payment details are missing.",
      });
    }

    const onboarding = await Onboarding.findOne({
      orderId: razorpay_order_id,
    });

    if (!onboarding) {
      return res.status(404).json({
        success: false,
        message: "Matching onboarding/payment order not found.",
      });
    }

    if (onboarding.paymentStatus === "Paid") {
      return res.json({
        success: true,
        message: "Payment was already verified.",
        internId: onboarding.internId,
      });
    }

    // Check the saved package against the official price list
    if (
      !Object.prototype.hasOwnProperty.call(
        PACKAGE_PRICES,
        onboarding.package
      ) ||
      onboarding.amount !== PACKAGE_PRICES[onboarding.package]
    ) {
      return res.status(400).json({
        success: false,
        message: "Saved package or amount is invalid.",
      });
    }

    // Verify Razorpay signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest("hex");

    if (!/^[a-f0-9]{64}$/i.test(razorpay_signature)) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature.",
      });
    }

    const received = Buffer.from(razorpay_signature, "hex");
    const expected = Buffer.from(expectedSignature, "hex");

    if (
      received.length !== expected.length ||
      !crypto.timingSafeEqual(received, expected)
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment signature verification failed.",
      });
    }

    // Confirm payment directly with Razorpay
    const payment = await razorpay.payments.fetch(razorpay_payment_id);

    if (
      payment.order_id !== razorpay_order_id ||
      payment.status !== "captured" ||
      payment.currency !== "INR" ||
      payment.amount !== onboarding.amount * 100
    ) {
      return res.status(400).json({
        success: false,
        message: "Payment is not captured or payment details do not match.",
      });
    }

    // Start a MongoDB transaction to allocate an ID and mark payment paid
    const session = await mongoose.startSession();
    let updatedIntern;

    try {
      await session.withTransaction(async () => {
        const current = await Onboarding.findOne({
          _id: onboarding._id,
          orderId: razorpay_order_id,
          paymentStatus: "Pending",
        }).session(session);

        if (!current) {
          throw new Error("ONBOARDING_ALREADY_UPDATED");
        }

        // Initialize the counter from existing IDs if necessary.
        // The unique index on internId is an additional safeguard.
        const existingInterns = await Onboarding.find({
          internId: /^DT\d+$/,
        })
          .select("internId")
          .session(session)
          .lean();

        const highestExistingNumber = existingInterns.reduce(
          (highest, intern) => {
            const match = intern.internId.match(/^DT(\d+)$/);
            return match
              ? Math.max(highest, Number(match[1]))
              : highest;
          },
          0
        );

const counter = await InternCounter.findOneAndUpdate(
  { _id: "internId" },
  [
    {
      $set: {
        sequence: {
          $add: [
            {
              $max: [
                { $ifNull: ["$sequence", 0] },
                highestExistingNumber,
              ],
            },
            1,
          ],
        },
      },
    },
  ],
  {
    new: true,
    upsert: true,
    session,
    updatePipeline: true,
  }
);

        const internId =
          "DT" + String(counter.sequence).padStart(2, "0");

        updatedIntern = await Onboarding.findOneAndUpdate(
          {
            _id: current._id,
            orderId: razorpay_order_id,
            paymentStatus: "Pending",
          },
          {
            $set: {
              paymentStatus: "Paid",
              onboardingStatus: "Completed",
              paymentId: razorpay_payment_id,
              signature: razorpay_signature,
              paymentDate: new Date(),
              internId,
            },
          },
          {
            new: true,
            session,
          }
        );

        if (!updatedIntern) {
          throw new Error("ONBOARDING_ALREADY_UPDATED");
        }
      });
    } catch (error) {
      if (error.message === "ONBOARDING_ALREADY_UPDATED") {
        const latest = await Onboarding.findById(onboarding._id);

        if (latest && latest.paymentStatus === "Paid") {
          return res.json({
            success: true,
            message: "Payment was already verified.",
            internId: latest.internId,
          });
        }

        return res.status(409).json({
          success: false,
          message: "Payment record changed. Please contact support.",
        });
      }

      throw error;
    } finally {
      await session.endSession();
    }

    // Generate and email the ID card after payment is saved
    try {
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
  packageName: updatedIntern.package,
});


      await sendIdCardEmail({
        toEmail: updatedIntern.email,
        toName: updatedIntern.fullName,
        internId: updatedIntern.internId,
        pdfPath,
      });

      await Onboarding.findByIdAndUpdate(updatedIntern._id, {
        idCardGenerated: true,
      });
    } catch (error) {
      console.error("ID card generation/email failed:", error.message);
    }

    return res.json({
      success: true,
      message: "Payment verified successfully.",
      internId: updatedIntern.internId,
    });
  } catch (error) {
    console.error("Payment verification failed:", error.message);

    return res.status(500).json({
      success: false,
      message: "Unable to verify payment at this time.",
    });
  }
};
