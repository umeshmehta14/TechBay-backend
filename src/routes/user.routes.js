import { Router } from "express";
import { registerUser } from "../controllers/user.controller.js";

const userRouter = new Router();

userRouter.route("/register").post(registerUser);

export default userRouter;
