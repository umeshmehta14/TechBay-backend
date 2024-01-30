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

addressRouter.route("/").get(getUserAddress).post(addUserAddress);
addressRouter
  .route("/:addressId")
  .delete(removeUserAddress)
  .patch(updateAddress);

export default addressRouter;
