import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const productSchema = new Schema(
  {
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    original_price: {
      type: Number,
      required: true,
    },
    discountPercentage: {
      type: Number,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    inStock: {
      type: Boolean,
      required: true,
      default: true,
    },
    brand: {
      type: String,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    image: {
      type: String,
      required: true,
    },
    trending: {
      type: Boolean,
      required: true,
      default: false,
    },
  },
  { timestamps: true }
);

productSchema.plugin(mongooseAggregatePaginate);
productSchema.index({ title: "text", description: "text" });

export const Product = mongoose.model("Product", productSchema);
