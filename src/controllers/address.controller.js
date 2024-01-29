import mongoose, { isValidObjectId } from "mongoose";
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
  const addedAddress = await Address.create({
    owner: userId,
    name,
    address,
    mobile,
    city,
    state,
    pincode,
    alternatemobile,
    type,
  });

  if (!addedAddress) {
    throw new ApiError(500, "something went wrong while adding a new address");
  }

  const existingAddress = await Address.findById(addedAddress?._id).select(
    "-owner"
  );

  return res
    .status(201)
    .json(
      new ApiResponse(201, existingAddress, "Address created successfully")
    );
});

const removeUserAddress = asyncHandler(async (req, res) => {
  const { addressId } = req.params;

  if (!addressId) {
    throw new ApiError(400, "address id is required");
  }

  if (!isValidObjectId(addressId)) {
    throw new ApiError(400, "address id is not valid");
  }

  const deletedAddress = await Address.findByIdAndDelete(addressId);

  if (!deletedAddress) {
    throw new ApiError(500, "something went wrong while deleting address");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Address deleted successfully"));
});

const getUserAddress = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const addresses = await Address.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $project: {
        name: 1,
        address: 1,
        mobile: 1,
        city: 1,
        state: 1,
        pincode: 1,
        alternatemobile: 1,
        type: 1,
      },
    },
  ]);
  if (!addresses) {
    throw new ApiError("something went wrong while getting addresses");
  }
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

  const updatedAddress = await Address.findByIdAndUpdate(
    addressId,
    {
      $set: {
        name,
        address,
        mobile,
        city,
        state,
        pincode,
        alternatemobile,
        type,
      },
    },
    { new: true }
  ).select("-owner");

  if (!updatedAddress) {
    throw new ApiError(500, "something went wrong while updating address");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedAddress, "Address updated successfully"));
});

export { addUserAddress, getUserAddress, removeUserAddress, updateAddress };
