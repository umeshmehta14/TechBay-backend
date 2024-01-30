import { Router } from "express";
import {
  filteredProducts,
  getFeaturedProducts,
  getProductById,
} from "../controllers/product.controller.js";
const productRouter = new Router();

productRouter.route("/filter").get(filteredProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/:productId").get(getProductById);

export default productRouter;
