import { Router, type IRouter } from "express";
import healthRouter from "./health";
import registreRouter from "./registre";

const router: IRouter = Router();

router.use(healthRouter);
router.use(registreRouter);

export default router;
