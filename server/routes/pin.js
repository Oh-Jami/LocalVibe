const express = require("express");
const {
  createPin,
  getAllPins,
  getPinById,
  updatePinById,
  deletePinById,
} = require("../controllers/pin");

const { isAuthenticatedUser } = require("../middleware/auth");

const router = express.Router();

router.route("/create-pin").post(isAuthenticatedUser, createPin);

router.route("/get-all-pins").get(isAuthenticatedUser, getAllPins);

router.route("/get-pin/:id").get(isAuthenticatedUser, getPinById);

router.route("/update-pin/:id").put(isAuthenticatedUser, updatePinById);

router.route("/delete-pin/:id").delete(isAuthenticatedUser, deletePinById);

module.exports = router;
