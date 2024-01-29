import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addUserAddress,
  getUserAddress,
  removeUserAddress,
  updateAddress,
} from "../controllers/address.controller.js";

const addressRouter = new Router();

addressRouter.use(verifyJwt);

addressRouter.route("/").get(getUserAddress);
addressRouter.route("/add").patch(addUserAddress);
addressRouter.route("/remove/:addressId").patch(removeUserAddress);
addressRouter.route("/update/:addressId").patch(updateAddress);

export default addressRouter;
