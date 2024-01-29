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
        { createdUser, accessToken },
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

  const cart = await User.findByIdAndUpdate(
    req.user?._id,
    {
      $pull: {
        cart: { product: productId },
      },
    },
    { new: true }
  );

  if (!cart) {
    throw new ApiError(500, "something went wrong while removing product");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "product removed successfully"));
});

const updateCartQuantity = asyncHandler(async (req, res) => {
  const { productId, type } = req.params;

  if (!productId) {
    throw new ApiError(400, "Product id is required");
  }

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "Product id is not valid");
  }

  if (!["increment", "decrement"].includes(type.toString())) {
    throw new ApiError(
      400,
      "Sorted type must be one of increment or decrement"
    );
  }

  const user = await User.findById(req.user?._id);

  const inCart = user?.cart?.find(
    ({ product }) => product.toString() === productId
  );
  if (!inCart) {
    throw new ApiError(400, "product not found");
  }

  if (type === "increment") {
    if (inCart.quantity === 10) {
      throw new ApiError(
        400,
        "Maximum allowed quantity for this product is 10"
      );
    }
    inCart.quantity += 1;
  } else {
    if (inCart.quantity === 1) {
      throw new ApiError(400, "quantity cannot be negative");
    }
    inCart.quantity -= 1;
  }

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
    .json(new ApiResponse(200, {}, "cart cleared successfully"));
});

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
  const user = await User.findById(userId);

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

const addOrder = asyncHandler(async (req, res) => {
  const { id, orderList, amount, address } = req.body;
  const userId = req.user?._id;

  if (orderList?.length === 0) {
    throw new ApiError(400, "Please add items to the order before placing it.");
  }

  if (
    [id, amount, address].some((field) =>
      typeof field === "number" ? !field : field?.trim() === ""
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

  const newOrder = {
    address: address,
    paymentId: id,
    products: orderList,
    amount: amount,
  };

  user.orders.push(newOrder);

  await user.save({ validateBeforeSave: false });

  return res
    .status(201)
    .json(new ApiResponse(201, newOrder, "Order placed successfully."));
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
  addUserAddress,
  getUserAddress,
  removeUserAddress,
  updateAddress,
  addOrder,
};
