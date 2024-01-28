import { Router } from "express";
import {
  addProductToWishlist,
  clearWishlist,
  getUserWishlist,
  loginUser,
  logoutUser,
  registerUser,
  removeProductFromWishlist,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = new Router();

userRouter.route("/register").post(registerUser);
userRouter.route("/login").post(loginUser);
userRouter.route("/logout").get(verifyJwt, logoutUser);

userRouter.route("/wishlist").get(verifyJwt, getUserWishlist);
userRouter
  .route("/add/wishlist/:productId")
  .patch(verifyJwt, addProductToWishlist);
userRouter
  .route("/remove/wishlist/:productId")
  .patch(verifyJwt, removeProductFromWishlist);
userRouter.route("/clear/wishlist").patch(verifyJwt, clearWishlist);

export default userRouter;
