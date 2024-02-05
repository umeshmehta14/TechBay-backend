import mongoose, { isValidObjectId } from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Order } from "../models/order.model.js";

const addOrder = asyncHandler(async (req, res) => {
  const { paymentId, products, amount, address } = req.body;
  const userId = req.user?._id;

  if (products?.length === 0) {
    throw new ApiError(400, "Please add items to the order before placing it.");
  }

  if (
    [paymentId, amount, address].some((field) =>
      typeof field === "number" ? !field : field?.trim() === ""
    )
  ) {
    throw new ApiError(
      400,
      "All address fields are required and cannot be empty"
    );
  }

  const newOrder = {
    owner: userId,
    address: address,
    paymentId: paymentId,
    products: products.map((item) => ({
      product: item?.product,
      quantity: item?.quantity,
    })),
    amount: amount,
  };

  const createdOrder = await Order.create(newOrder);
  if (!createdOrder) {
    throw new ApiError(500, "order creation failed");
  }

  const orderResponse = await Order.findById(createdOrder._id).select("-owner");

  return res
    .status(201)
    .json(new ApiResponse(201, orderResponse, "Order placed successfully."));
});

const getOrder = asyncHandler(async (req, res) => {
  const userId = req.user?._id;

  const orders = await Order.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "addresses",
        localField: "address",
        foreignField: "_id",
        as: "address",
        pipeline: [
          {
            $project: {
              address: 1,
              city: 1,
              state: 1,
              alternatemobile: 1,
              mobile: 1,
              pincode: 1,
            },
          },
        ],
      },
    },
    {
      $set: {
        address: { $arrayElemAt: ["$address", 0] },
      },
    },
    {
      $unwind: "$products",
    },
    {
      $lookup: {
        from: "products",
        localField: "products.product",
        foreignField: "_id",
        as: "products.product",
        pipeline: [
          {
            $project: {
              _id: 1,
              image: 1,
              title: 1,
              price: 1,
            },
          },
        ],
      },
    },
    {
      $group: {
        _id: "$_id",
        createdAt: { $first: "$createdAt" },
        address: { $first: "$address" },
        paymentId: { $first: "$paymentId" },
        amount: { $first: "$amount" },
        products: {
          $push: {
            product: { $arrayElemAt: ["$products.product", 0] },
            quantity: "$products.quantity",
          },
        },
      },
    },
  ]);

  if (!orders) {
    throw new ApiError(404, "User not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, orders, "orders fetched successfully"));
});

const removeOrder = asyncHandler(async (req, res) => {
  const { orderId } = req.params;

  if (!orderId) {
    throw new ApiError(400, "Order Id required");
  }

  if (!isValidObjectId(orderId)) {
    throw new ApiError(400, "Invalid order id provided");
  }

  const deletedOrder = await Order.findByIdAndDelete(orderId);
  if (!deletedOrder) {
    throw new ApiError(500, "something went wrong while deleting order");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Order deleted successfully"));
});

export { getOrder, addOrder, removeOrder };
