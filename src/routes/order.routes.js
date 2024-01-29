import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import { addOrder, getOrder } from "../controllers/order.controller.js";

const orderRouter = new Router();

orderRouter.use(verifyJwt);

orderRouter.route("/").post(verifyJwt, addOrder).get(verifyJwt, getOrder);

export default orderRouter;
