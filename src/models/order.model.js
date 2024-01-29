import mongoose, { Schema } from "mongoose";

const orderSchema = new Schema(
  {
    owner: { type: Schema.Types.ObjectId, ref: "User" },
    address: { type: Schema.Types.ObjectId, ref: "Address" },
    paymentId: {
      type: String,
      required: true,
    },
    products: [
      {
        product: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: {
          type: Number,
          min: 1,
          max: 10,
          default: 1,
          required: true,
        },
      },
    ],
    amount: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

export const Order = mongoose.model("Order", orderSchema);
