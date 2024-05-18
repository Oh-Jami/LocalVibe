const express = require("express");
const app = express();
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const ErrorHandler = require("./middleware/error");
const Paymongo = require("paymongo-node");
app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true, limit: "50mb" }));
app.use(express.urlencoded({ limit: "50mb", extended: true }));

const paymongo = new Paymongo(process.env.PAYMONGO_SECRET_KEY);

app.post("/create-payment-intent", async (req, res) => {
  try {
    // Create a payment intent
    const paymentIntent = await paymongo.paymentIntents.create({
      amount: 10000, // Amount in the smallest unit of your currency (e.g., cent for USD)
      currency: "PHP", // Currency code
      payment_method_allowed: ["card"],
      payment_method_options: {
        card: {
          request_three_d_secure: "any",
        },
      },
      description: "Test Payment",
      statement_descriptor: "Test Payment Descriptor",
    });

    // Send the payment intent details back to the client
    res.json(paymentIntent);
  } catch (error) {
    console.error("Error creating payment intent:", error);
    res.status(500).json({ error: "Error creating payment intent" });
  }
});

// config
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({
    path: ".env",
  });
}

// Import the locationController
// const locationController = require("./controllers/location");

// Define a route for updating user location
// app.post("/api/v1/update-location", locationController.updateLocation);

app.post("/api/updateUserLocation", async (req, res) => {
  try {
    const { userId, location } = req.body;

    // Save the user's location to MongoDB
    await UserLocation.create({
      userId,
      location,
    });

    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Error updating user location:", error);
    res.status(500).json({ success: false, error: "Internal Server Error" });
  }
});

// Route imports
const user = require("./routes/user");
const post = require("./routes/Post");
const pin = require("./routes/pin");

app.use("/api/v1", user);
app.use("/api/v1", post);
app.use("/api/v1", pin);

// it's for errorHandeling
app.use(ErrorHandler);

module.exports = app;
