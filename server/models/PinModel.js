const mongoose = require("mongoose");

const pinSchema = new mongoose.Schema(
  {
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    // Business name
    businessName: {
      type: String,
      required: true,
    },
    // Business description
    description: {
      type: String,
      required: true,
    },
    // Business category (e.g., restaurant, salon, store, etc.)
    category: {
      type: String,
      required: true,
    },
    // Latitude and longitude coordinates for the pin location
    latitude: {
      type: Number,
      default: null,
    },

    longitude: {
      type: Number,
      default: null,
    },
    // Business contact information (optional)
    contactInfo: {
      phone: String,
      email: String,
      website: String,
    },
    // Images of the business (optional)
    image: {
      public_id: {
        type: String,
      },
      url: {
        type: String,
      },
    },
    // Timestamps for when the pin was created and updated
  },
  { timestamps: true }
);

module.exports = mongoose.model("Pin", pinSchema);
