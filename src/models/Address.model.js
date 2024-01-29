import mongoose, { Schema } from "mongoose";
import { statesData } from "../constants.js";

const addressSchema = new Schema(
  {
    owner: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    name: {
      type: String,
      required: true,
    },
    address: {
      type: String,
      required: true,
    },
    mobile: {
      type: Number,
      required: true,
    },
    alternatemobile: {
      type: Number,
      required: true,
    },
    city: {
      type: String,
      required: true,
    },
    state: {
      type: String,
      required: true,
      enum: statesData,
    },
    pincode: {
      type: Number,
      required: true,
    },
    type: {
      type: String,
      required: true,
      enum: ["Home", "Office"],
      default: "Home",
    },
  },
  { timestamps: true }
);

export const Address = mongoose.model("Address", addressSchema);
