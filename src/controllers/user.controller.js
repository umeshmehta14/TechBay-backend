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

export { registerUser, loginUser, logoutUser };
