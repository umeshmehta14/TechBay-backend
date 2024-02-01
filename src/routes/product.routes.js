import { Router } from "express";
import {
  filteredProducts,
  getBrandsName,
  getFeaturedProducts,
  getProductById,
  getSearchedProducts,
} from "../controllers/product.controller.js";
const productRouter = new Router();

productRouter.route("/filter").get(filteredProducts);
productRouter.route("/featured").get(getFeaturedProducts);
productRouter.route("/brands").get(getBrandsName);
productRouter.route("/search/:query").get(getSearchedProducts);
productRouter.route("/:productId").get(getProductById);

export default productRouter;
