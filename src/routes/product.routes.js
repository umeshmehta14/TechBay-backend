import { Router } from "express";
import { getAllProducts } from "../controllers/product.controller.js";

const productRouter = new Router();

productRouter.route("/").get(getAllProducts);

export default productRouter;
