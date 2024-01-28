import { Router } from "express";
import { getAllCategory } from "../controllers/category.controller.js";

const categoryRouter = new Router();

categoryRouter.route("/").get(getAllCategory);

export default categoryRouter;
