const axios = require("axios");

const sendEmail = async ({
  to,
  subject,
  htmlContent,
}) => {
  try {
    await axios.post(
      "https://api.brevo.com/v3/smtp/email",

      {
        sender: {
          name: "Davine Technologies",
          email: process.env.EMAIL_USER,
        },

        to: [
          {
            email: to,
          },
        ],

        subject,

        htmlContent,
      },

      {
        headers: {
          "api-key": process.env.BREVO_API_KEY,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("Email Sent To:", to);

  } catch (error) {

    console.log("Email Error:", error.message);

  }
};

module.exports = sendEmail;