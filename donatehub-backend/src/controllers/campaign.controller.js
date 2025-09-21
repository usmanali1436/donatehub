import { Campaign } from "../models/campaign.model.js";
import { Donation } from "../models/donation.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import asnycHandler from "../util/asnycHandler.js";
import mongoose from "mongoose";

const createCampaign = asnycHandler(async (req, res) => {
    const { title, description, category, goalAmount } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!title || !description || !category || !goalAmount) {
        throw new ApiError(400, "All fields (title, description, category, goalAmount) are required");
    }

    if (userRole !== "ngo") {
        throw new ApiError(403, "Only NGOs can create campaigns");
    }

    if (goalAmount <= 0) {
        throw new ApiError(400, "Goal amount must be greater than 0");
    }

    const campaign = await Campaign.create({
        title: title.trim(),
        description: description.trim(),
        category,
        goalAmount,
        createdBy: userId
    });

    if (!campaign) {
        throw new ApiError(500, "Failed to create campaign");
    }

    const populatedCampaign = await Campaign.findById(campaign._id)
        .populate("createdBy", "fullName username")
        .exec();

    return res.status(201).json(
        new ApiResponse(201, populatedCampaign, "Campaign created successfully")
    );
});

const getAllCampaigns = asnycHandler(async (req, res) => {
    const { 
        page = 1, 
        limit = 10, 
        category, 
        search, 
        status = "active",
        sortBy = "createdAt",
        sortOrder = "desc"
    } = req.query;

    const pipeline = [];

    const matchStage = { status };

    if (category && category !== "all") {
        matchStage.category = category;
    }

    if (search) {
        matchStage.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    pipeline.push({ $match: matchStage });

    pipeline.push({
        $lookup: {
            from: "users",
            localField: "createdBy",
            foreignField: "_id",
            as: "creator",
            pipeline: [{ $project: { fullName: 1, username: 1 } }]
        }
    });

    pipeline.push({
        $addFields: {
            creator: { $arrayElemAt: ["$creator", 0] },
            progressPercentage: {
                $cond: [
                    { $gt: ["$goalAmount", 0] },
                    { $multiply: [{ $divide: ["$raisedAmount", "$goalAmount"] }, 100] },
                    0
                ]
            },
            isGoalReached: { $gte: ["$raisedAmount", "$goalAmount"] }
        }
    });

    const sortOrderNum = sortOrder === "asc" ? 1 : -1;
    pipeline.push({ $sort: { [sortBy]: sortOrderNum } });

    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const campaigns = await Campaign.aggregate(pipeline);

    const totalCountPipeline = [{ $match: matchStage }, { $count: "total" }];
    const totalResult = await Campaign.aggregate(totalCountPipeline);
    const totalCampaigns = totalResult.length > 0 ? totalResult[0].total : 0;

    const totalPages = Math.ceil(totalCampaigns / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            campaigns,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCampaigns,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        }, "Campaigns fetched successfully")
    );
});

const getCampaignById = asnycHandler(async (req, res) => {
    const { campaignId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(400, "Invalid campaign ID");
    }

    const campaign = await Campaign.findById(campaignId)
        .populate("createdBy", "fullName username email")
        .exec();

    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    const donationsCount = await Donation.countDocuments({ campaignId });
    
    const campaignWithStats = {
        ...campaign.toObject(),
        progressPercentage: campaign.getProgressPercentage(),
        isGoalReached: campaign.isGoalReached(),
        donationsCount
    };

    return res.status(200).json(
        new ApiResponse(200, campaignWithStats, "Campaign fetched successfully")
    );
});

const updateCampaign = asnycHandler(async (req, res) => {
    const { campaignId } = req.params;
    const { title, description, category, goalAmount, status } = req.body;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(400, "Invalid campaign ID");
    }

    if (userRole !== "ngo") {
        throw new ApiError(403, "Only NGOs can update campaigns");
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only update your own campaigns");
    }

    const updateData = {};
    if (title) updateData.title = title.trim();
    if (description) updateData.description = description.trim();
    if (category) updateData.category = category;
    if (goalAmount !== undefined) {
        if (goalAmount <= 0) {
            throw new ApiError(400, "Goal amount must be greater than 0");
        }
        updateData.goalAmount = goalAmount;
    }
    if (status && ["active", "closed"].includes(status)) {
        updateData.status = status;
    }

    const updatedCampaign = await Campaign.findByIdAndUpdate(
        campaignId,
        { $set: updateData },
        { new: true, runValidators: true }
    ).populate("createdBy", "fullName username");

    return res.status(200).json(
        new ApiResponse(200, updatedCampaign, "Campaign updated successfully")
    );
});

const deleteCampaign = asnycHandler(async (req, res) => {
    const { campaignId } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    if (!mongoose.Types.ObjectId.isValid(campaignId)) {
        throw new ApiError(400, "Invalid campaign ID");
    }

    if (userRole !== "ngo") {
        throw new ApiError(403, "Only NGOs can delete campaigns");
    }

    const campaign = await Campaign.findById(campaignId);
    if (!campaign) {
        throw new ApiError(404, "Campaign not found");
    }

    if (campaign.createdBy.toString() !== userId.toString()) {
        throw new ApiError(403, "You can only delete your own campaigns");
    }

    const donationsCount = await Donation.countDocuments({ campaignId });
    if (donationsCount > 0) {
        throw new ApiError(400, "Cannot delete campaign that has received donations");
    }

    await Campaign.findByIdAndDelete(campaignId);

    return res.status(200).json(
        new ApiResponse(200, {}, "Campaign deleted successfully")
    );
});

const getMyCampaigns = asnycHandler(async (req, res) => {
    const userId = req.user._id;
    const userRole = req.user.role;
    const { page = 1, limit = 10, status } = req.query;

    if (userRole !== "ngo") {
        throw new ApiError(403, "Only NGOs can access this endpoint");
    }

    const matchStage = { createdBy: new mongoose.Types.ObjectId(userId) };
    if (status && ["active", "closed"].includes(status)) {
        matchStage.status = status;
    }

    const pipeline = [
        { $match: matchStage },
        {
            $lookup: {
                from: "donations",
                localField: "_id",
                foreignField: "campaignId",
                as: "donations"
            }
        },
        {
            $addFields: {
                donationsCount: { $size: "$donations" },
                progressPercentage: {
                    $cond: [
                        { $gt: ["$goalAmount", 0] },
                        { $multiply: [{ $divide: ["$raisedAmount", "$goalAmount"] }, 100] },
                        0
                    ]
                },
                isGoalReached: { $gte: ["$raisedAmount", "$goalAmount"] }
            }
        },
        { $project: { donations: 0 } },
        { $sort: { createdAt: -1 } }
    ];

    const skip = (parseInt(page) - 1) * parseInt(limit);
    pipeline.push({ $skip: skip });
    pipeline.push({ $limit: parseInt(limit) });

    const campaigns = await Campaign.aggregate(pipeline);

    const totalCampaigns = await Campaign.countDocuments(matchStage);
    const totalPages = Math.ceil(totalCampaigns / parseInt(limit));

    return res.status(200).json(
        new ApiResponse(200, {
            campaigns,
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalCampaigns,
                hasNext: parseInt(page) < totalPages,
                hasPrev: parseInt(page) > 1
            }
        }, "Your campaigns fetched successfully")
    );
});

const getCampaignCategories = asnycHandler(async (req, res) => {
    const categories = ["health", "education", "disaster", "others"];
    
    const categoryStats = await Campaign.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
                totalRaised: { $sum: "$raisedAmount" },
                totalGoal: { $sum: "$goalAmount" }
            }
        }
    ]);

    const categoriesWithStats = categories.map(category => {
        const stats = categoryStats.find(stat => stat._id === category) || {
            count: 0,
            totalRaised: 0,
            totalGoal: 0
        };
        
        return {
            name: category,
            ...stats,
            _id: undefined
        };
    });

    return res.status(200).json(
        new ApiResponse(200, categoriesWithStats, "Categories with statistics fetched successfully")
    );
});

export {
    createCampaign,
    getAllCampaigns,
    getCampaignById,
    updateCampaign,
    deleteCampaign,
    getMyCampaigns,
    getCampaignCategories
};