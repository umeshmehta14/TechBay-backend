import { Router } from "express";
import {
  getAllProducts,
  getFeaturedProducts,
  getProductById,
  getSearchedProducts,
} from "../controllers/product.controller.js";
const productRouter = new Router();

productRouter.route("/").get(getAllProducts);
productRouter.route("/search/:query").get(getSearchedProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/:productId").get(getProductById);

export default productRouter;
