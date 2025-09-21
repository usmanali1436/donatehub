import { Router } from "express";
import {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    getMyCampaigns,
    getCampaignCategories
} from "../controllers/campaign.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = new Router();

router.route("/categories").get(getCampaignCategories);
router.route("/").get(getAllCampaigns);
router.route("/my-campaigns").get(verifyJWT, getMyCampaigns);
router.route("/create").post(verifyJWT, createCampaign);
router.route("/:campaignId").get(getCampaignById);
router.route("/:campaignId").put(verifyJWT, updateCampaign);
router.route("/:campaignId").delete(verifyJWT, deleteCampaign);

export default router;