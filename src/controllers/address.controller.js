import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Address } from "../models/Address.model.js";

const addUserAddress = asyncHandler(async (req, res) => {
  const { name, address, mobile, city, state, pincode, alternatemobile, type } =
    req.body;
  const userId = req.user?._id;

  if (
    [name, address, mobile, city, state, pincode, alternatemobile, type].some(
      (field) => (typeof field === "number" ? !field : field?.trim() === "")
    )
  ) {
    throw new ApiError(
      400,
      "All address fields are required and cannot be empty"
    );
  }
  const user = await Address.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const newAddress = {
    name,
    address,
    mobile,
    city,
    state,
    pincode,
    alternatemobile,
    type,
  };

  user.addresses.push(newAddress);
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user?.addresses, "Address added successfully"));
});

const removeUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const userId = req.user?._id;

  if (!addressId) {
    throw new ApiError(400, "address id is required");
  }

  if (!isValidObjectId(addressId)) {
    throw new ApiError(400, "address id is not valid");
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const deletedAddress = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        addresses: { _id: addressId },
      },
    },
    { new: true }
  );

  if (!deletedAddress) {
    throw new ApiError(500, "something went wrong while deleting address");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Address deleted successfully"));
});

const getUserAddress = asyncHandler(async (req, res) => {
  const { addresses } = req.user;
  return res
    .status(200)
    .json(
      new ApiResponse(200, addresses || [], "User Address fetched successfully")
    );
});

const updateAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;
  const { name, address, mobile, city, state, pincode, alternatemobile, type } =
    req.body;
  const userId = req.user?._id;

  if (!addressId) {
    throw new ApiError(400, "address id is required");
  }

  if (!isValidObjectId(addressId)) {
    throw new ApiError(400, "address id is not valid");
  }

  if (
    [name, address, mobile, city, state, pincode, alternatemobile, type].some(
      (field) => (typeof field === "number" ? !field : field?.trim() === "")
    )
  ) {
    throw new ApiError(
      400,
      "All address fields are required and cannot be empty"
    );
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new ApiError(404, "User not found");
  }

  const selectedAddress = user.addresses.find(
    (address) => address._id.toString() === addressId
  );

  if (!selectedAddress) {
    throw new ApiError(404, "Address not found");
  }

  selectedAddress.name = name;
  selectedAddress.address = address;
  selectedAddress.mobile = mobile;
  selectedAddress.city = city;
  selectedAddress.state = state;
  selectedAddress.pincode = pincode;
  selectedAddress.alternatemobile = alternatemobile;
  selectedAddress.type = type;

  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, user.addresses, "Address updated successfully"));
});

export { addUserAddress, getUserAddress, removeUserAddress, updateAddress };
