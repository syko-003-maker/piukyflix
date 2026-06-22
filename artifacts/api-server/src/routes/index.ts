import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import categoriesRouter from "./categories";
import contentRouter from "./content";
import seasonsRouter from "./seasons";
import userContentRouter from "./userContent";
import searchRouter from "./search";
import adminRouter from "./admin";
import storageRouter from "./storage";
import tmdbRouter from "./tmdb";
import uploadRouter from "./upload";
import adsRouter from "./ads";
import requestsRouter from "./requests";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(categoriesRouter);
router.use(contentRouter);
router.use(seasonsRouter);
router.use(userContentRouter);
router.use(searchRouter);
router.use(adminRouter);
router.use(storageRouter);
router.use(tmdbRouter);
router.use(uploadRouter);
router.use(adsRouter);
router.use(requestsRouter);

export default router;
