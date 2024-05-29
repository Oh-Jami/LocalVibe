const User = require("../models/UserModel");
const Post = require("../models/PostModel");
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
  console.log("Received data:", req.body);

  try {
    const userId = req.user.id;
    const { postId, score } = req.body;

    // Validate input data
    if (!userId || !postId || !score) {
      console.error("Missing required fields");
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user || !post) {
      console.error("User or Post not found");
      return res.status(404).json({
        success: false,
        message: "User or Post not found",
      });
    }

    const existingInteractionIndex = user.interactions.findIndex(
      (interaction) => interaction.post_id.toString() === postId
    );

    if (existingInteractionIndex !== -1) {
      const existingInteraction = user.interactions[existingInteractionIndex];

      if (existingInteraction.score > 0) {
        existingInteraction.score -= score;
        console.log("Updated interaction score:", existingInteraction.score);

        if (existingInteraction.score <= 0) {
          user.interactions.splice(existingInteractionIndex, 1);
          console.log("Removed interaction:", postId);
        }
      } else {
        console.error("Score cannot be less than zero");
        return res.status(400).json({
          success: false,
          message: "Score cannot be less than zero",
        });
      }
    } else {
      console.error("Interaction not found");
      return res.status(404).json({
        success: false,
        message: "Interaction not found",
      });
    }

    const postInteractionIndex = post.userInteractions.findIndex(
      (interaction) => interaction.userId.toString() === userId
    );

    if (postInteractionIndex !== -1) {
      const postInteraction = post.userInteractions[postInteractionIndex];

      if (postInteraction.score > 0) {
        postInteraction.score -= score;
        console.log("Updated post interaction score:", postInteraction.score);

        if (postInteraction.score <= 0) {
          post.userInteractions.splice(postInteractionIndex, 1);
          console.log("Removed post interaction for user:", userId);
        }
      }
    }

    // Save the updated user and post documents first
    await user.save();
    await post.save();
    console.log("Saved updated user and post documents.");

    // Update similarity scores based on remaining interactions
    user.similarUsers = []; // Reset similar users
    console.log("Reset similar users.");

    for (const interaction of user.interactions) {
      const userPost = await Post.findById(interaction.post_id);
      console.log("Processing post:", interaction.post_id);

      userPost.userInteractions.forEach((userPostInteraction) => {
        const otherUserId = userPostInteraction.userId.toString();

        if (otherUserId !== userId.toString()) {
          const similarUserIndex = user.similarUsers.findIndex(
            (similarUser) => similarUser.userId.toString() === otherUserId
          );

          if (similarUserIndex !== -1) {
            user.similarUsers[similarUserIndex].similarityScore += 1;
            console.log("Updated similarity score for user:", otherUserId);
          } else {
            user.similarUsers.push({ userId: otherUserId, similarityScore: 1 });
            console.log("Added new similar user:", otherUserId);
          }
        }
      });
    }

    // Save the updated user document with the updated similarity scores
    await user.save();
    console.log("Saved user with updated similarity scores.");

    res.status(200).json({
      success: true,
      message: "Interaction removed successfully",
      interactions: user.interactions,
    });
  } catch (error) {
    console.error("Error removing interactions:", error);
    return next(new ErrorHandler(error.message, 400));
  }
});

exports.updateInteractions = catchAsyncErrors(async (req, res, next) => {
  try {
    console.log("Received data from client:", req.body); // Logging the request body received from the client

    const userId = req.user.id;
    const { postId, score } = req.body;

    console.log("User ID:", userId);
    console.log("Post ID:", postId);
    console.log("Score:", score);

    // Find the user and post by their IDs
    const user = await User.findById(userId);
    const post = await Post.findById(postId);

    if (!user || !post) {
      console.error("User or Post not found");
      return next(new ErrorHandler("User or Post not found", 404));
    }

    // Find or create the interaction by postId for the user
    let existingInteraction = user.interactions.find(
      (interaction) => interaction.post_id.toString() === postId
    );

    if (existingInteraction) {
      existingInteraction.score += score;
      console.log(
        "Updated existing interaction score:",
        existingInteraction.score
      );
    } else {
      user.interactions.push({ post_id: postId, score });
      console.log("Added new interaction with score:", score);
    }

    // Find or create the interaction by userId for the post
    let postInteraction = post.userInteractions.find(
      (interaction) => interaction.userId.toString() === userId
    );

    if (postInteraction) {
      postInteraction.score += score;
      console.log(
        "Updated existing post interaction score:",
        postInteraction.score
      );
    } else {
      post.userInteractions.push({ userId, score });
      console.log("Added new post interaction with score:", score);
    }

    // Save the updated user and post documents first
    await user.save();
    await post.save();
    console.log("Saved user and post with updated interactions.");

    // Update similarity scores based on user interactions
    user.similarUsers = []; // Reset similar users
    console.log("Reset similar users.");

    for (const interaction of user.interactions) {
      const userPost = await Post.findById(interaction.post_id);
      console.log("Processing post:", interaction.post_id);

      userPost.userInteractions.forEach((userPostInteraction) => {
        const otherUserId = userPostInteraction.userId.toString();

        if (otherUserId !== userId.toString()) {
          const similarUserIndex = user.similarUsers.findIndex(
            (similarUser) => similarUser.userId.toString() === otherUserId
          );

          if (similarUserIndex !== -1) {
            user.similarUsers[similarUserIndex].similarityScore += 1;
            console.log("Updated similarity score for user:", otherUserId);
          } else {
            user.similarUsers.push({ userId: otherUserId, similarityScore: 1 });
            console.log("Added new similar user:", otherUserId);
          }
        }
      });
    }

    // Save the updated user document with the updated similarity scores
    await user.save();
    console.log("Saved user with updated similarity scores.");

    res.status(200).json({
      success: true,
      message: "Interactions and similarity scores updated successfully",
    });
  } catch (error) {
    console.error("Error updating interactions:", error);
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
