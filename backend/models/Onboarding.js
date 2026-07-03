const mongoose = require("mongoose");

const onboardingSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  phone: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
  },

package: {
  type: String,
},

amount: {
  type: Number,
},

  paymentStatus: {
    type: String,
    default: "Pending",
  },

  paymentId: {
    type: String,
  },

  orderId: {
    type: String,
  },

  signature: {
  type: String,
},

  paymentDate: {
    type: Date,
  },

  onboardingStatus: {
    type: String,
    default: "Pending",
  },

  internId: {
    type: String,
  },

  idCardGenerated: {
    type: Boolean,
    default: false,
  },

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports = mongoose.model(
  "Onboarding",
  onboardingSchema
);