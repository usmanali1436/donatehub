import { Router } from "express";
import {
    getNGODashboard,
    getDonorDashboard,
    getGeneralStats
} from "../controllers/dashboard.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";
import { checkNGO, checkDonor } from "../middleware/role.middleware.js";

const router = new Router();

router.route("/ngo").get(verifyJWT, checkNGO, getNGODashboard);
router.route("/donor").get(verifyJWT, checkDonor, getDonorDashboard);
router.route("/stats").get(getGeneralStats);

export default router;