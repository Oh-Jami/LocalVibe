const mongoose = require("mongoose");

const messageSchema = new mongoose.Schema({
  senderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  recepientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  },
  messageType: {
    type: String,
    enum: ["text", "avatar"],
  },
  message: String,
  imageUrl: String,
  timeStamp: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Message',messageSchema);