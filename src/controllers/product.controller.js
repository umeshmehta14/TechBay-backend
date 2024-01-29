import mongoose, { isValidObjectId } from "mongoose";
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

const getProductById = asyncHandler(async (req, res) => {
  const { productId } = req.params;

  if (!productId) {
    throw new ApiError(400, "productId is required");
  }

  if (!isValidObjectId(productId)) {
    throw new ApiError(400, "productId is invalid");
  }

  const product = await Product.findById(productId);

  if (!product) {
    throw new ApiError(400, "product is not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, product, "product fetched successfully"));
});

const getSearchedProducts = asyncHandler(async (req, res) => {
  const { query } = req.params;

  if (!query?.trim()) {
    throw new ApiError(400, "Invalid query");
  }

  const products = await Product.aggregate([
    {
      $match: {
        $or: [
          { title: { $regex: query, $options: "i" } },
          { description: { $regex: query, $options: "i" } },
          { brand: { $regex: query, $options: "i" } },
          { category: { $regex: query, $options: "i" } },
          {
            $expr: {
              $lt: [
                { $toDouble: "$price" },
                {
                  $cond: {
                    if: {
                      $regexMatch: { input: query, regex: /^\d+(\.\d+)?$/ },
                    },
                    then: parseFloat(query),
                    else: 0,
                  },
                },
              ],
            },
          },
          {
            $expr: {
              $lt: [
                { $toDouble: "$rating" },
                {
                  $cond: {
                    if: {
                      $regexMatch: { input: query, regex: /^\d+(\.\d+)?$/ },
                    },
                    then: parseFloat(query),
                    else: 0,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  if (products?.length === 0) {
    throw new ApiError(400, "No products found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "products fetched successfully"));
});

const getFeaturedProducts = asyncHandler(async (req, res) => {
  const featuredProductsList = [
    "65b7f8c11c6e62280db158ed",
    "65b54e16a39a3ffd12fd2c42",
    "65b54e14a39a3ffd12fd2c0c",
    "65b54e15a39a3ffd12fd2c3e",
  ];

  const featuredProducts = await Product.find({
    _id: {
      $in: featuredProductsList.map((id) => new mongoose.Types.ObjectId(id)),
    },
  });

  if (!featuredProducts || featuredProducts.length === 0) {
    throw new ApiError(404, "Featured products not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        featuredProducts,
        "Featured products fetched successfully"
      )
    );
});

export {
  getAllProducts,
  getProductById,
  getSearchedProducts,
  getFeaturedProducts,
};
