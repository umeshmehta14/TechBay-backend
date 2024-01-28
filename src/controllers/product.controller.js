import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getAllProducts = asyncHandler(async (_, res) => {
  const products = await Product.find();

  if (!products) {
    throw new ApiError(500, "something went wrong while fetching products");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "All products fetched successfully"));
});

export { getAllProducts };
