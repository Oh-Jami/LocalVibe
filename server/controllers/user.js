const User = require("../models/UserModel");
const ErrorHandler = require("../utils/ErrorHandler.js");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken.js");
const cloudinary = require("cloudinary");
const Notification = require("../models/NotificationModel");
const express = require("express");

exports.updateUserCoor = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    user.latitude = req.body.latitude;
    user.longitude = req.body.longitude;

    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// Register user
exports.createUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const { name, email, password, avatar, accountType } = req.body;

    let user = await User.findOne({ email });
    if (user) {
      return res
        .status(400)
        .json({ success: false, message: "User already exists" });
    }

    let myCloud;

    if (avatar) {
      myCloud = await cloudinary.v2.uploader.upload(avatar, {
        folder: "avatars",
      });
    }

    const userNameWithoutSpace = name.replace(/\s/g, "");
    const uniqueNumber = Math.floor(Math.random() * 1000);

    user = await User.create({
      name,
      email,
      password,
      accountType,
      userName: userNameWithoutSpace + " #" + uniqueNumber,
      avatar: avatar
        ? { public_id: myCloud.public_id, url: myCloud.secure_url }
        : null,
    });

    sendToken(user, 201, res);
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

// Login User
exports.loginUser = catchAsyncErrors(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new ErrorHandler("Please enter the email & password", 400));
  }

  const user = await User.findOne({ email }).select("+password");

  if (!user) {
    return next(
      new ErrorHandler("User is not find with this email & password", 401)
    );
  }
  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return next(
      new ErrorHandler("User is not find with this email & password", 401)
    );
  }

  sendToken(user, 201, res);
});

//  Log out user
exports.logoutUser = catchAsyncErrors(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
    sameSite: "none",
    secure: true,
  });

  res.status(200).json({
    success: true,
    message: "Log out success",
  });
});

//  Get user Details
exports.userDetails = catchAsyncErrors(async (req, res, next) => {
  const user = await User.findById(req.user.id);
  res.status(200).json({
    success: true,
    user,
  });
});

// get all users
exports.getAllUsers = catchAsyncErrors(async (req, res, next) => {
  const loggedInuser = req.user.id;
  const users = await User.find({ _id: { $ne: loggedInuser } }).sort({
    createdAt: -1,
  });

  res.status(201).json({
    success: true,
    users,
  });
});

exports.removeInteractions = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    // Find the user and post by ID
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    // Find the interaction by postId
    const existingInteractionIndex = user.interactions.findIndex(
      (interaction) => interaction.post_id.toString() === postId
    );

    if (existingInteractionIndex !== -1) {
      const existingInteraction = user.interactions[existingInteractionIndex];

      // Decrement the score
      if (existingInteraction.score > 0) {
        existingInteraction.score -= 1;

        // Remove the interaction if the score reaches zero
        if (existingInteraction.score === 0) {
          user.interactions.splice(existingInteractionIndex, 1);
        }
      } else {
        return res.status(400).json({
          success: false,
          message: "Score cannot be less than zero",
        });
      }
    } else {
      return res.status(404).json({
        success: false,
        message: "Interaction not found",
      });
    }

    // Update post userInteractions
    const postInteractionIndex = post.userInteractions.findIndex(
      (interaction) => interaction.userId.toString() === userId
    );

    if (postInteractionIndex !== -1) {
      const postInteraction = post.userInteractions[postInteractionIndex];

      // Decrement the score
      if (postInteraction.score > 0) {
        postInteraction.score -= 1;

        // Remove the interaction if the score reaches zero
        if (postInteraction.score === 0) {
          post.userInteractions.splice(postInteractionIndex, 1);
        }
      }
    }

    // Save the updated documents
    await user.save();
    await post.save();

    res.status(200).json({
      success: true,
      message: "Interaction removed successfully",
      interactions: user.interactions,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.updateInteractions = catchAsyncErrors(async (req, res, next) => {
  try {
    const userId = req.user.id;
    const { postId } = req.body;

    // Find the user and post by ID
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    // Find the interaction by postId
    let existingInteraction = user.interactions.find(
      (interaction) => interaction.post_id.toString() === postId
    );

    // If the post ID already exists in the user's interactions array, update the score
    if (existingInteraction) {
      existingInteraction.score += 1;
    } else {
      // If the post ID doesn't exist, add a new interaction object
      user.interactions.push({ post_id: postId, score: 1 });
    }

    // Update post userInteractions
    let postInteraction = post.userInteractions.find(
      (interaction) => interaction.userId.toString() === userId
    );

    if (postInteraction) {
      postInteraction.score += 1;
    } else {
      post.userInteractions.push({ userId, score: 1 });
    }

    // Save the updated documents
    await user.save();
    await post.save();

    res.status(200).json({
      success: true,
      message: "Interactions updated successfully",
      interactions: user.interactions,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 400));
  }
});

// Follow and unfollow user
exports.followUnfollowUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const loggedInUser = req.user;
    const { followUserId } = req.body;

    const isFollowedBefore = loggedInUser.following.find(
      (item) => item.userId === followUserId
    );
    const loggedInUserId = loggedInUser._id;

    if (isFollowedBefore) {
      await User.updateOne(
        { _id: followUserId },
        { $pull: { followers: { userId: loggedInUserId } } }
      );

      await User.updateOne(
        { _id: loggedInUserId },
        { $pull: { following: { userId: followUserId } } }
      );

      await Notification.deleteOne({
        "creator._id": loggedInUserId,
        userId: followUserId,
        type: "Follow",
      });

      res.status(200).json({
        success: true,
        message: "User unfollowed successfully",
      });
    } else {
      await User.updateOne(
        { _id: followUserId },
        { $push: { followers: { userId: loggedInUserId } } }
      );

      await User.updateOne(
        { _id: loggedInUserId },
        { $push: { following: { userId: followUserId } } }
      );

      await Notification.create({
        creator: req.user,
        type: "Follow",
        title: "Followed you",
        userId: followUserId,
      });

      res.status(200).json({
        success: true,
        message: "User followed successfully",
      });
    }
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// get user notification
exports.getNotification = catchAsyncErrors(async (req, res, next) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort(
      { createdAt: -1 }
    );

    res.status(201).json({
      success: true,
      notifications,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// get signle user
exports.getUser = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);

    res.status(201).json({ success: true, user });
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// update user avatar
exports.updateUserAvatar = catchAsyncErrors(async (req, res, next) => {
  try {
    let existsUser = await User.findById(req.user.id);

    if (req.body.avatar !== "") {
      const imageId = existsUser.avatar.public_id;

      await cloudinary.v2.uploader.destroy(imageId);

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      existsUser.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }
    await existsUser.save();

    res.status(200).json({
      success: true,
      user: existsUser,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// update user info
exports.updateUserInfo = catchAsyncErrors(async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id);

    user.name = req.body.name;
    user.userName = req.body.userName;
    user.bio = req.body.bio;
    user.latitude = req.body.latitude;
    user.longitude = req.body.longitude;

    await user.save();

    res.status(201).json({
      success: true,
      user,
    });
  } catch (error) {
    return next(new ErrorHandler(error.message, 401));
  }
});

// endpoint to send a friend request
exports.sendFriendRequest = catchAsyncErrors(async (req, res, next) => {
  const { currentUserId, selectedUserId } = req.body;

  try {
    await User.findByIdAndUpdate(selectedUserId, {
      $push: { friendRequests: currentUserId },
    });

    await User.findByIdAndUpdate(currentUserId, {
      $push: { sentFriendRequests: selectedUserId },
    });

    res
      .status(200)
      .json({ success: true, message: "Friend request sent successfully" });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to get friend requests of a particular user
exports.getFriendRequests = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("friendRequests", "name email avatar")
      .lean();

    const friendRequests = user.friendRequests;

    res.json(friendRequests);
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to accept a friend request
exports.acceptFriendRequest = catchAsyncErrors(async (req, res, next) => {
  try {
    const { senderId, recipientId } = req.body;

    const sender = await User.findById(senderId);
    const recipient = await User.findById(recipientId);

    sender.friends.push(recipientId);
    recipient.friends.push(senderId);

    recipient.friendRequests = recipient.friendRequests.filter(
      (request) => request.toString() !== senderId.toString()
    );

    sender.sentFriendRequests = sender.sentFriendRequests.filter(
      (request) => request.toString() !== recipientId.toString()
    );

    await sender.save();
    await recipient.save();

    res
      .status(200)
      .json({ success: true, message: "Friend request accepted successfully" });
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to get all accepted friends of the logged-in user
exports.getAcceptedFriends = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId).populate(
      "friends",
      "name email avatar"
    );
    const acceptedFriends = user.friends;
    res.json(acceptedFriends);
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});

// endpoint to get sent friend requests of a particular user
exports.getSentFriendRequests = catchAsyncErrors(async (req, res, next) => {
  try {
    const { userId } = req.params;
    const user = await User.findById(userId)
      .populate("sentFriendRequests", "name email avatar")
      .lean();
    const sentFriendRequests = user.sentFriendRequests;
    res.json(sentFriendRequests);
  } catch (error) {
    next(new ErrorHandler(error.message, 500));
  }
});
