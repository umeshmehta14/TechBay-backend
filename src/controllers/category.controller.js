import { Category } from "../models/category.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllCategory = asyncHandler(async (req, res) => {
  const categories = await Category.find();
  if (!categories)
    throw new ApiError(500, "something went wrong while fetching categories");

  return res
    .status(200)
    .json(new ApiResponse(200, categories, "categories fetched successfully"));
});

export { getAllCategory };
