import { Router } from "express";
import { verifyJwt } from "../middlewares/auth.middleware.js";
import {
  addOrder,
  getOrder,
  removeOrder,
} from "../controllers/order.controller.js";

const orderRouter = new Router();

orderRouter.use(verifyJwt);

orderRouter.route("/").post(addOrder).get(getOrder);
orderRouter.route("/:orderId").delete(removeOrder);

export default orderRouter;
