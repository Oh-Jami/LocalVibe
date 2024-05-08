const Message = require("../models/MessageModel");

// endpoint to post messages
exports.postMessage = catchAsyncErrors(async (req, res, next) => {
  try {
    const { senderId, recipientId, messageType, messageText } = req.body;

    const newMessage = new Message({
      senderId,
      recipientId,
      messageType,
      message: messageText,
      timestamp: new Date(),
      imageUrl: messageType === "image" ? req.file.path : null,
    });

    await newMessage.save();
    res.status(200).json({ success: true, message: "Message sent successfully" });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to get user details for the chat room header
exports.getUserDetails = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const recipient = await User.findById(userId);
    res.json(recipient);
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to fetch messages between two users in the chat room
exports.getMessages = catchAsyncErrors(async (req, res, next) => {
  try {
    const { senderId, recipientId } = req.params;

    const messages = await Message.find({
      $or: [
        { senderId: senderId, recipientId: recipientId },
        { senderId: recipientId, recipientId: senderId },
      ],
    }).populate("senderId", "_id name");

    res.json(messages);
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to delete messages
exports.deleteMessages = catchAsyncErrors(async (req, res, next) => {
  try {
    const { messages } = req.body;

    if (!Array.isArray(messages) || messages.length === 0) {
      return res.status(400).json({ success: false, message: "Invalid request body" });
    }

    await Message.deleteMany({ _id: { $in: messages } });

    res.json({ success: true, message: "Messages deleted successfully" });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});