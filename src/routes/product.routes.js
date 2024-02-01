import { Router } from "express";
import {
  filteredProducts,
  getBrandsName,
  getFeaturedProducts,
  getProductById,
} from "../controllers/product.controller.js";
const productRouter = new Router();

productRouter.route("/filter").get(filteredProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/brands").get(getBrandsName);
productRouter.route("/:productId").get(getProductById);

export default productRouter;
