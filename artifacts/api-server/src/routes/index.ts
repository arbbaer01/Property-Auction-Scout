import { Router, type IRouter } from "express";
import healthRouter from "./health";
import authRouter from "./auth";
import auctionsRouter from "./auctions";
import propertiesRouter from "./properties";
import spreadsheetsRouter from "./spreadsheets";
import spiderRouter from "./spider";
import monitoringRouter from "./monitoring";
import excessProceedsRouter from "./excess-proceeds";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(auctionsRouter);
router.use(propertiesRouter);
router.use(spreadsheetsRouter);
router.use(spiderRouter);
router.use(monitoringRouter);
router.use(excessProceedsRouter);

export default router;
