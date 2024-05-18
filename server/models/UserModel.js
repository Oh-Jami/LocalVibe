const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ObjectId = require("mongodb").ObjectId;

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Please enter your Name"],
    },
    userName: {
      type: String,
    },
    bio: {
      type: String,
    },
    email: {
      type: String,
      required: [true, "Please enter your email"],
    },
    accountType: {
      type: String,
      enum: ["admin", "personal", "business"],
      default: "personal",
      required: [true, "Please specify the account type"],
    },
    password: {
      type: String,
      required: [true, "Please enter your password"],
    },
    latitude: {
      type: Number,
      default: null,
    },
    longitude: {
      type: Number,
      default: null,
    },
    avatar: {
      public_id: {
        type: String,
        required: [true, "Please upload one profile picture!"],
      },
      url: {
        type: String,
        required: [true, "Please upload one profile picture!"],
      },
    },
    friends: [
      {
        userId: {
          type: String,
        },
      },
    ],
    followers: [
      {
        userId: {
          type: String,
        },
      },
    ],
    following: [
      {
        userId: {
          type: String,
        },
      },
    ],
  },
  { timestamps: true }
);

// Hash password
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model("User", userSchema);
