const mongoose = require("mongoose");

const applicationSchema = new mongoose.Schema({

  fullName: {
    type: String,
    required: true,
  },

  email: {
    type: String,
    required: true,
  },

  role: {
    type: String,
    required: true,
  },

  resume: {
    type: String,
    required: true,
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

paymentDate: {
  type: Date,
},

  createdAt: {
    type: Date,
    default: Date.now,
  },

});

module.exports =
mongoose.model(
  "Application",
  applicationSchema
);