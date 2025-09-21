import { Router } from "express";
import {
    makeDonation,
    getDonationHistory,
    getCampaignDonations,
    getSupportedCampaigns,
    getDonationById
} from "../controllers/donation.controller.js";
import { verifyJWT } from "../middleware/auth.middleware.js";

const router = new Router();

router.route("/donate").post(verifyJWT, makeDonation);
router.route("/history").get(verifyJWT, getDonationHistory);
router.route("/supported-campaigns").get(verifyJWT, getSupportedCampaigns);
router.route("/campaign/:campaignId").get(verifyJWT, getCampaignDonations);
router.route("/:donationId").get(verifyJWT, getDonationById);

export default router;