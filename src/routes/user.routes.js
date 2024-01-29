import { Router } from "express";
import {
  addProductToCart,
  addProductToWishlist,
  clearCart,
  clearWishlist,
  getCurrentUser,
  getUserCart,
  getUserWishlist,
  loginUser,
  logoutUser,
  registerUser,
  removeProductFromCart,
  removeProductFromWishlist,
  updateCartQuantity,
} from "../controllers/user.controller.js";
import { verifyJwt } from "../middlewares/auth.middleware.js";

const userRouter = new Router();

userRouter.route("/").get(verifyJwt, getCurrentUser);
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

userRouter.route("/cart").get(verifyJwt, getUserCart);
userRouter.route("/add/cart/:productId").patch(verifyJwt, addProductToCart);
userRouter
  .route("/remove/cart/:productId")
  .patch(verifyJwt, removeProductFromCart);
userRouter
  .route("/update-quantity/cart/:type/:productId")
  .patch(verifyJwt, updateCartQuantity);
userRouter.route("/clear/cart").patch(verifyJwt, clearCart);

export default userRouter;
