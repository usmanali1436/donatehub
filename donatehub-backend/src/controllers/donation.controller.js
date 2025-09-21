import { Donation } from "../models/donation.model.js";
import { Campaign } from "../models/campaign.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import asnycHandler from "../util/asnycHandler.js";
import mongoose from "mongoose";

const makeDonation = asnycHandler(async (req, res) => {
    const { campaignId, amount } = req.body;
    const donorId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== "donor") {
        throw new ApiError(403, "Only donors can make donations");
    }

    if (!campaignId || !amount) {
        throw new ApiError(400, "Campaign ID and donation amount are required");
    }

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(400, "Invalid campaign ID");
    }

    if (amount <= 0) {
        throw new ApiError(400, "Donation amount must be greater than 0");
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    if (campaign.status === "closed") {
        throw new ApiError(400, "Cannot donate to a closed campaign");
    }

    const session = await mongoose.startSession();
    session.startTransaction();

    try {
        const donation = await Donation.create([{
            donorId,
            campaignId,
            amount
        }], { session });

        await Campaign.findByIdAndUpdate(
            campaignId,
            { $inc: { raisedAmount: amount } },
            { session }
        );

        await session.commitTransaction();

        const populatedDonation = await Donation.findById(donation[0]._id)
            .populate("donorId", "fullName username")
            .populate("campaignId", "title description")
            .session(null);

        return res.status(201).json(
            new ApiResponse(201, populatedDonation, "Donation made successfully")
        );

    } catch (error) {
        await session.abortTransaction();
        throw new ApiError(500, "Failed to process donation");
    } finally {
        session.endSession();
    }
});

const getDonationHistory = asnycHandler(async (req, res) => {
    const donorId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, sortBy = "donatedAt", sortOrder = "desc" } = req.query;

    if (userRole !== "donor") {
        throw new ApiError(403, "Only donors can access donation history");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);
    const sortOrderNum = sortOrder === "asc" ? 1 : -1;

    const pipeline = [
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
        {
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign",
                pipeline: [
                    {
                        $project: {
                            title: 1,
                            description: 1,
                            category: 1,
                            goalAmount: 1,
                            raisedAmount: 1,
                            status: 1
                        }
                    }
                ]
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "campaign.createdBy",
                foreignField: "_id",
                as: "ngo",
                pipeline: [{ $project: { fullName: 1, username: 1 } }]
            }
        },
        {
            $addFields: {
                campaign: { $arrayElemAt: ["$campaign", 0] },
                ngo: { $arrayElemAt: ["$ngo", 0] }
            }
        },
        { $sort: { [sortBy]: sortOrderNum } },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ];

    const donations = await Donation.aggregate(pipeline);

    const totalDonations = await Donation.countDocuments({ donorId });
    const totalPages = Math.ceil(totalDonations / parseInt(limit));

    const donationStats = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
        {
            $group: {
                _id: null,
                totalDonated: { $sum: "$amount" },
                campaignsSupported: { $addToSet: "$campaignId" }
            }
        },
        {
            $project: {
                totalDonated: 1,
                campaignsSupported: { $size: "$campaignsSupported" }
            }
        }
    ]);

    const stats = donationStats[0] || { totalDonated: 0, campaignsSupported: 0 };

    return res.status(200).json(
        new ApiResponse(200, {
            donations,
            stats,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalDonations,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        }, "Donation history fetched successfully")
    );
});

const getCampaignDonations = asnycHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { page = 1, limit = 10 } = req.query;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(400, "Invalid campaign ID");
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    if (userRole === "ngo" && campaign.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only view donations for your own campaigns");
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        {
            $lookup: {
                from: "users",
                localField: "donorId",
                foreignField: "_id",
                as: "donor",
                pipeline: [{ $project: { fullName: 1, username: 1 } }]
            }
        },
        {
            $addFields: {
                donor: { $arrayElemAt: ["$donor", 0] }
            }
        },
        { $sort: { donatedAt: -1 } },
        { $skip: skip },
        { $limit: parseInt(limit) }
    ];

    const donations = await Donation.aggregate(pipeline);

    const totalDonations = await Donation.countDocuments({ campaignId });
    const totalPages = Math.ceil(totalDonations / parseInt(limit));

    const donationStats = await Donation.aggregate([
        { $match: { campaignId: new mongoose.Types.ObjectId(campaignId) } },
        {
            $group: {
                _id: null,
                totalAmount: { $sum: "$amount" },
                totalDonors: { $addToSet: "$donorId" },
                avgDonation: { $avg: "$amount" },
                minDonation: { $min: "$amount" },
                maxDonation: { $max: "$amount" }
            }
        },
        {
            $project: {
                totalAmount: 1,
                totalDonors: { $size: "$totalDonors" },
                avgDonation: { $round: ["$avgDonation", 2] },
                minDonation: 1,
                maxDonation: 1
            }
        }
    ]);

    const stats = donationStats[0] || {
        totalAmount: 0,
        totalDonors: 0,
        avgDonation: 0,
        minDonation: 0,
        maxDonation: 0
    };

    return res.status(200).json(
        new ApiResponse(200, {
            donations,
            stats,
            campaign: {
                title: campaign.title,
                goalAmount: campaign.goalAmount,
                raisedAmount: campaign.raisedAmount,
                progressPercentage: campaign.getProgressPercentage()
            },
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalDonations,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        }, "Campaign donations fetched successfully")
    );
});

const getSupportedCampaigns = asnycHandler(async (req, res) => {
    const donorId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status } = req.query;

    if (userRole !== "donor") {
        throw new ApiError(403, "Only donors can access supported campaigns");
    }

    const matchStage = { donorId: new mongoose.Types.ObjectId(donorId) };
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const pipeline = [
        { $match: matchStage },
        {
            $group: {
                _id: "$campaignId",
                totalDonated: { $sum: "$amount" },
                donationCount: { $sum: 1 },
                lastDonation: { $max: "$donatedAt" }
            }
        },
        {
            $lookup: {
                from: "campaigns",
                localField: "_id",
                foreignField: "_id",
                as: "campaign",
                pipeline: [
                    {
                        $lookup: {
                            from: "users",
                            localField: "createdBy",
                            foreignField: "_id",
                            as: "creator",
                            pipeline: [{ $project: { fullName: 1, username: 1 } }]
                        }
                    },
                    {
                        $addFields: {
                            creator: { $arrayElemAt: ["$creator", 0] },
                            progressPercentage: {
                                $cond: [
                                    { $gt: ["$goalAmount", 0] },
                                    { $multiply: [{ $divide: ["$raisedAmount", "$goalAmount"] }, 100] },
                                    0
                                ]
                            }
                        }
                    }
                ]
            }
        },
        {
            $addFields: {
                campaign: { $arrayElemAt: ["$campaign", 0] }
            }
        }
    ];

    // Only add status filter if status is provided and not "all"
    if (status && status !== "all") {
        pipeline.push({ $match: { "campaign.status": status } });
    }

    // Add sorting and pagination
    pipeline.push({ $sort: { lastDonation: -1 } });
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const supportedCampaigns = await Donation.aggregate(pipeline);

    const totalCountPipeline = [
        { $match: matchStage },
        { $group: { _id: "$campaignId" } },
        { $count: "total" }
    ];
    
    const totalResult = await Donation.aggregate(totalCountPipeline);
    const totalCampaigns = totalResult.length > 0 ? totalResult[0].total : 0;
    const totalPages = Math.ceil(totalCampaigns / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            supportedCampaigns,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCampaigns,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        }, "Supported campaigns fetched successfully")
    );
});

const getDonationById = asnycHandler(async (req, res) => {
    const { donationId } = req.params;
    const userId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(donationId)) {
        throw new ApiError(400, "Invalid donation ID");
    }

    const donation = await Donation.findById(donationId)
        .populate("donorId", "fullName username email")
        .populate({
            path: "campaignId",
            select: "title description category goalAmount raisedAmount status createdBy",
            populate: {
                path: "createdBy",
                select: "fullName username"
            }
        });

    if (!donation) {
        throw new ApiError(404, "Donation not found");
    }

    if (donation.donorId._id.toString() !== userId.toString() && 
        donation.campaignId.createdBy._id.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only view your own donations or donations to your campaigns");
    }

    return res.status(200).json(
        new ApiResponse(200, donation, "Donation details fetched successfully")
    );
});

export {
    makeDonation,
    getDonationHistory,
    getCampaignDonations,
    getSupportedCampaigns,
    getDonationById
};