import { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { isValidEmail } from "../utils/isValidEmail.js";
import jwt from "jsonwebtoken";

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
    return res.status(400).json(new ApiError(400, {}, "Invalid credentials"));
  }

  if (!isValidEmail(email)) {
    return res.status(400).json(new ApiError(400, {}, "Invalid email address"));
  }

  if (password?.length < 8) {
    return res
      .status(400)
      .json(new ApiError(400, {}, "Password must be at least 8 characters"));
  }

  if (password !== confirmPassword) {
    return res
      .status(400)
      .json(
        new ApiError(400, {}, "Password and confirm password do not match")
      );
  }

  const user = await User.create({
    username,
    email,
    password,
  });
  if (!user) {
    return res
      .status(400)
      .json(
        new ApiError(500, {}, "something went wrong while creating a new user")
      );
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
        { createdUser, accessToken, refreshToken },
        "user created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  if (!email) {
    return res.status(400).json(new ApiError(400, {}, "Email is required"));
  }

  if (!isValidEmail(email)) {
    return res.status(400).json(new ApiError(400, {}, "Invalid email address"));
  }

  const user = await User.findOne({ email });
  if (!user) {
    return res.status(400).json(new ApiError(400, {}, "User not found"));
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    return res
      .status(401)
      .json(new ApiError(401, {}, "Invalid user credentials"));
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
    req.user?._id,
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

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;

  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized access");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);

    if (!user) {
      throw new ApiError(401, "invalid refresh token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(401, "Refresh token is expired or used");
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user?._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, refreshToken, user },
          "Access Token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid refresh token");
  }
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
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

  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        wishlist: productId,
      },
    },
    { new: true }
  ).populate("wishlist");

  if (!user) {
    throw new ApiError(500, "something went wrong while removing product");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { wishlist: user.wishlist },
        "product removed successfully"
      )
    );
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
    .json(new ApiResponse(200, [], "wishlist cleared successfully"));
});

const getUserCart = asyncHandler(async (req, res) => {
  const user = await User.findById(req.user?._id).populate("cart.product");

  if (!user) {
    throw new ApiError(500, "something went wrong while fetching cart");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { cart: user.cart }, "cart fetched successfully")
    );
});

const addProductToCart = asyncHandler(async (req, res) => {
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
        cart: { product: productId },
      },
    },
    { new: true }
  ).populate("cart.product");

  if (!user) {
    throw new ApiError(
      500,
      "something went wrong while adding product to cart"
    );
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { cart: user.cart }, "product inserted successfully")
    );
});

const removeProductFromCart = asyncHandler(async (req, res) => {
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
      $pull: {
        cart: { product: productId },
      },
    },
    { new: true }
  ).populate("cart.product");

  if (!user) {
    throw new ApiError(500, "something went wrong while removing product");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(200, { cart: user.cart }, "product removed successfully")
    );
});

const updateCartQuantity = asyncHandler(async (req, res) => {
  const { productId, quantity } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product id is required");
  }

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Product id is not valid");
  }

  if (!quantity) {
    throw new ApiError(400, "Product id is not valid");
  }

  if (Number(quantity) > 10) {
    throw new ApiError(400, "Maximum allowed quantity for this product is 10");
  }

  const user = await User.findById(req.user?._id);

  const inCart = user?.cart?.find(
    ({ product }) => product.toString() === productId
  );
  if (!inCart) {
    throw new ApiError(400, "product not found");
  }

  inCart.quantity = Number(quantity);

  await user.save({ validateBeforeSave: false });

  await user.populate("cart.product");

  return res
    .status(200)
    .json(
      new ApiResponse(200, user?.cart, "Cart quantity updated successfully")
    );
});

const clearCart = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $set: {
        cart: [],
      },
    },
    {
      new: true,
    }
  );
  if (!user) {
    throw new ApiError(500, "something went wrong while clearing cart");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, [], "cart cleared successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  addProductToWishlist,
  getUserWishlist,
  removeProductFromWishlist,
  clearWishlist,
  getUserCart,
  addProductToCart,
  updateCartQuantity,
  removeProductFromCart,
  clearCart,
  refreshAccessToken,
};
