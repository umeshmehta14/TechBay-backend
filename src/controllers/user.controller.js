import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidEmail } from "../utils/isValidEmail.js";

const options = {
  httpOnly: true,
  secure: true,
};

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.getAccessToken();
    const refreshToken = await user.getRefreshToken();

    user.refreshToken = refreshToken;
    user.save({ validateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while generating access token and refresh token"
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  const { username, email, password, confirmPassword } = req.body;

  if (
    !(
      username?.trim() ||
      email?.trim() ||
      password?.trim() ||
      confirmPassword?.trim()
    )
  ) {
    throw new ApiError(400, "Invalid credentials");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "Invalid email address");
  }

  if (password?.length < 8) {
    throw new ApiError(400, "password must be at least 8 characters");
  }

  if (password !== confirmPassword) {
    throw new ApiError(400, "Password and confirm password do not match");
  }

  const user = await User.create({
    username,
    email,
    password,
  });
  if (!user) {
    throw new ApiError(400, "something went wrong while creating a new user");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user?._id
  );

  const createdUser = await User.findById(user?._id).select(
    "-password -refreshToken"
  );

  return res
    .status(201)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        201,
        createdUser,
        accessToken,
        "user created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    throw new ApiError(400, "email is required");
  }

  if (!isValidEmail(email)) {
    throw new ApiError(400, "invalid email address");
  }

  const user = await User.findOne({ email });
  if (!user) {
    throw new ApiError(404, "user not found");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid user credentials");
  }

  const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        { user: loggedInUser, refreshToken, accessToken },
        "User logged in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(
    req.user._id,
    {
      $unset: { refreshToken: 1 },
    },
    { new: true }
  );

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logout seccessfully"));
});

const getUserWishlist = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).populate("wishlist");

  if (!user) {
    throw new ApiError(500, "something went wrong while fetching wishlist");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { wishlist: user.wishlist },
        "wishlist fetched successfully"
      )
    );
});

const addProductToWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product id is required");
  }

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Product id is not valid");
  }

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $addToSet: {
        wishlist: productId,
      },
    },
    { new: true }
  ).populate("wishlist");

  if (!user) {
    throw new ApiError(
      500,
      "something went wrong while adding product to wishlist"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { wishlist: user.wishlist },
        "product inserted successfully"
      )
    );
});

const removeProductFromWishlist = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product id is required");
  }

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Product id is not valid");
  }

  const wishlist = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        wishlist: productId,
      },
    },
    { new: true }
  );

  if (!wishlist) {
    throw new ApiError(500, "something went wrong while removing product");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "product removed successfully"));
});

const clearWishlist = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        wishlist: [],
      },
    },
    {
      new: true,
    }
  );
  if (!user) {
    throw new ApiError(500, "something went wrong while clearing wishlist");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "wishlist cleared successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  addProductToWishlist,
  getUserWishlist,
  removeProductFromWishlist,
  clearWishlist,
};
