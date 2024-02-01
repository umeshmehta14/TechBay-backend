import mongoose, { isValidObjectId } from "mongoose";
import { Product } from "../models/product.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

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

  if (!products) {
    throw new ApiError(500, "Internal Error");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, products, "products fetched successfully"));
});

const getFeaturedProducts = asyncHandler(async (_, res) => {
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

const filteredProducts = asyncHandler(async (req, res) => {
  const {
    rating,
    category,
    brand,
    price,
    trending,
    includeOutStock,
    arrangeType,
    searchValue,
    page = 1,
    limit = 8,
  } = req.query;

  if (arrangeType && !["LTH", "HTL"].includes(arrangeType?.toString())) {
    throw new ApiError(400, "arrangeType must be one of LTH or HTL");
  }

  if (
    price &&
    !["500", "1000", "2000", "3000", "4000"].includes(price?.toString())
  ) {
    throw new ApiError(
      400,
      "price must be one of 500, 1000, 2000, 3000 or 4000"
    );
  }

  if (rating && Number(rating) > 5) {
    throw new ApiError(400, "rating must be less than 5");
  }

  let filter = {};
  if (!includeOutStock) {
    filter.inStock = true;
  }

  if (trending) {
    filter.trending = true;
  }

  if (rating) {
    filter.rating = { $lte: parseFloat(rating) };
  }

  if (price) {
    filter.price = { $lte: parseFloat(price) };
  }

  if (category) {
    filter.category = { $in: category.split(",") };
  }

  if (brand) {
    filter.brand = { $in: brand.split(",") };
  }

  if (searchValue) {
    filter.$or = [
      { title: { $regex: searchValue, $options: "i" } },
      { description: { $regex: searchValue, $options: "i" } },
      { brand: { $regex: searchValue, $options: "i" } },
      { category: { $regex: searchValue, $options: "i" } },
    ];
  }

  const sortOptions = {};
  if (arrangeType) {
    if (arrangeType === "LTH") {
      sortOptions.price = 1;
    } else {
      sortOptions.price = -1;
    }
  }

  const skip = (page - 1) * limit;

  const products = await Product.find(filter);

  if (!products) {
    throw new ApiError(500, "internal server error");
  }

  const totalPage = Math.ceil(products?.length / Number(limit));

  const paginatedProducts = await Product.find(filter)
    .sort(sortOptions)
    .skip(skip)
    .limit(parseInt(limit));

  if (!paginatedProducts) {
    throw new ApiError(500, "internal server error");
  }

  if (totalPage < page) {
    page = 1;
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        products: paginatedProducts,
        totalPage,
        currentPage: page,
        productFetched: products?.length,
      },
      "products fetched successfully"
    )
  );
});

const getBrandsName = asyncHandler(async (_, res) => {
  const uniqueBrands = await Product.distinct("brand");
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { brands: uniqueBrands },
        "All Brands Name fetched successfully"
      )
    );
});

export {
  getProductById,
  getFeaturedProducts,
  filteredProducts,
  getBrandsName,
  getSearchedProducts,
};
