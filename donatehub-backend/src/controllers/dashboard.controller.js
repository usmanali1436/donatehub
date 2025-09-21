import { Campaign } from "../models/campaign.model.js";
import { Donation } from "../models/donation.model.js";
import { User } from "../models/user.model.js";
import ApiError from "../util/ApiError.js";
import ApiResponse from "../util/ApiResponse.js";
import asnycHandler from "../util/asnycHandler.js";
import mongoose from "mongoose";

const getNGODashboard = asnycHandler(async (req, res) => {
    const ngoId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== "ngo") {
        throw new ApiError(403, "Only NGOs can access this dashboard");
    }

    const campaignStats = await Campaign.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(ngoId) } },
        {
            $group: {
                _id: null,
                totalCampaigns: { $sum: 1 },
                activeCampaigns: {
                    $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] }
                },
                closedCampaigns: {
                    $sum: { $cond: [{ $eq: ["$status", "closed"] }, 1, 0] }
                },
                totalGoalAmount: { $sum: "$goalAmount" },
                totalRaisedAmount: { $sum: "$raisedAmount" }
            }
        }
    ]);

    const donationStats = await Donation.aggregate([
        {
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign"
            }
        },
        {
            $match: {
                "campaign.createdBy": new mongoose.Types.ObjectId(ngoId)
            }
        },
        {
            $group: {
                _id: null,
                totalDonations: { $sum: 1 },
                totalDonationAmount: { $sum: "$amount" },
                uniqueDonors: { $addToSet: "$donorId" },
                avgDonation: { $avg: "$amount" }
            }
        },
        {
            $project: {
                totalDonations: 1,
                totalDonationAmount: 1,
                uniqueDonors: { $size: "$uniqueDonors" },
                avgDonation: { $round: ["$avgDonation", 2] }
            }
        }
    ]);

    const recentCampaigns = await Campaign.find({ createdBy: ngoId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select("title goalAmount raisedAmount status createdAt")
        .lean();

    const campaignPerformance = await Campaign.aggregate([
        { $match: { createdBy: new mongoose.Types.ObjectId(ngoId) } },
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
                }
            }
        },
        {
            $project: {
                title: 1,
                goalAmount: 1,
                raisedAmount: 1,
                donationsCount: 1,
                progressPercentage: { $round: ["$progressPercentage", 1] },
                status: 1,
                createdAt: 1
            }
        },
        { $sort: { raisedAmount: -1 } },
        { $limit: 10 }
    ]);

    const monthlyDonations = await Donation.aggregate([
        {
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign"
            }
        },
        {
            $match: {
                "campaign.createdBy": new mongoose.Types.ObjectId(ngoId),
                donatedAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$donatedAt" },
                    month: { $month: "$donatedAt" }
                },
                totalAmount: { $sum: "$amount" },
                totalDonations: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const stats = campaignStats[0] || {
        totalCampaigns: 0,
        activeCampaigns: 0,
        closedCampaigns: 0,
        totalGoalAmount: 0,
        totalRaisedAmount: 0
    };

    const donationStatsData = donationStats[0] || {
        totalDonations: 0,
        totalDonationAmount: 0,
        uniqueDonors: 0,
        avgDonation: 0
    };

    const overallStats = {
        ...stats,
        ...donationStatsData,
        progressPercentage: stats.totalGoalAmount > 0 
            ? Math.round((stats.totalRaisedAmount / stats.totalGoalAmount) * 100) 
            : 0
    };

    return res.status(200).json(
        new ApiResponse(200, {
            overallStats,
            recentCampaigns,
            campaignPerformance,
            monthlyDonations
        }, "NGO dashboard data fetched successfully")
    );
});

const getDonorDashboard = asnycHandler(async (req, res) => {
    const donorId = req.user._id;
    const userRole = req.user.role;

    if (userRole !== "donor") {
        throw new ApiError(403, "Only donors can access this dashboard");
    }

    const donationStats = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
        {
            $group: {
                _id: null,
                totalDonations: { $sum: 1 },
                totalDonated: { $sum: "$amount" },
                avgDonation: { $avg: "$amount" },
                campaignsSupported: { $addToSet: "$campaignId" }
            }
        },
        {
            $project: {
                totalDonations: 1,
                totalDonated: 1,
                avgDonation: { $round: ["$avgDonation", 2] },
                campaignsSupported: { $size: "$campaignsSupported" }
            }
        }
    ]);

    const recentDonations = await Donation.find({ donorId })
        .populate("campaignId", "title description category status")
        .sort({ donatedAt: -1 })
        .limit(5)
        .lean();

    const supportedCampaigns = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
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
        },
        { $sort: { totalDonated: -1 } },
        { $limit: 10 }
    ]);

    const donationsByCategory = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
        {
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign"
            }
        },
        { $unwind: "$campaign" },
        {
            $group: {
                _id: "$campaign.category",
                totalDonated: { $sum: "$amount" },
                donationCount: { $sum: 1 }
            }
        },
        { $sort: { totalDonated: -1 } }
    ]);

    const monthlyDonations = await Donation.aggregate([
        {
            $match: {
                donorId: new mongoose.Types.ObjectId(donorId),
                donatedAt: {
                    $gte: new Date(new Date().getFullYear(), new Date().getMonth() - 11, 1)
                }
            }
        },
        {
            $group: {
                _id: {
                    year: { $year: "$donatedAt" },
                    month: { $month: "$donatedAt" }
                },
                totalAmount: { $sum: "$amount" },
                totalDonations: { $sum: 1 }
            }
        },
        { $sort: { "_id.year": 1, "_id.month": 1 } }
    ]);

    const impactStats = await Donation.aggregate([
        { $match: { donorId: new mongoose.Types.ObjectId(donorId) } },
        {
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign"
            }
        },
        { $unwind: "$campaign" },
        {
            $group: {
                _id: null,
                campaignsHelpedComplete: {
                    $sum: {
                        $cond: [
                            { $gte: ["$campaign.raisedAmount", "$campaign.goalAmount"] },
                            1,
                            0
                        ]
                    }
                },
                activeCampaignsSupported: {
                    $sum: {
                        $cond: [
                            { $eq: ["$campaign.status", "active"] },
                            1,
                            0
                        ]
                    }
                }
            }
        }
    ]);

    const stats = donationStats[0] || {
        totalDonations: 0,
        totalDonated: 0,
        avgDonation: 0,
        campaignsSupported: 0
    };

    const impact = impactStats[0] || {
        campaignsHelpedComplete: 0,
        activeCampaignsSupported: 0
    };

    return res.status(200).json(
        new ApiResponse(200, {
            stats: { ...stats, ...impact },
            recentDonations,
            supportedCampaigns,
            donationsByCategory,
            monthlyDonations
        }, "Donor dashboard data fetched successfully")
    );
});

const getGeneralStats = asnycHandler(async (req, res) => {
    const totalUsers = await User.countDocuments();
    const totalNGOs = await User.countDocuments({ role: "ngo" });
    const totalDonors = await User.countDocuments({ role: "donor" });

    const totalCampaigns = await Campaign.countDocuments();
    const activeCampaigns = await Campaign.countDocuments({ status: "active" });

    const totalDonations = await Donation.countDocuments();
    
    const donationStats = await Donation.aggregate([
        {
            $group: {
                _id: null,
                totalDonated: { $sum: "$amount" },
                avgDonation: { $avg: "$amount" }
            }
        }
    ]);

    const campaignStats = await Campaign.aggregate([
        {
            $group: {
                _id: null,
                totalGoalAmount: { $sum: "$goalAmount" },
                totalRaisedAmount: { $sum: "$raisedAmount" }
            }
        }
    ]);

    const categoryStats = await Campaign.aggregate([
        {
            $group: {
                _id: "$category",
                count: { $sum: 1 },
                totalRaised: { $sum: "$raisedAmount" },
                totalGoal: { $sum: "$goalAmount" }
            }
        },
        { $sort: { count: -1 } }
    ]);

    const donationStatsData = donationStats[0] || { totalDonated: 0, avgDonation: 0 };
    const campaignStatsData = campaignStats[0] || { totalGoalAmount: 0, totalRaisedAmount: 0 };

    return res.status(200).json(
        new ApiResponse(200, {
            users: {
                total: totalUsers,
                ngos: totalNGOs,
                donors: totalDonors
            },
            campaigns: {
                total: totalCampaigns,
                active: activeCampaigns,
                closed: totalCampaigns - activeCampaigns,
                totalGoal: campaignStatsData.totalGoalAmount,
                totalRaised: campaignStatsData.totalRaisedAmount
            },
            donations: {
                total: totalDonations,
                totalAmount: donationStatsData.totalDonated,
                avgAmount: Math.round(donationStatsData.avgDonation || 0)
            },
            categories: categoryStats
        }, "General statistics fetched successfully")
    );
});

export {
    getNGODashboard,
    getDonorDashboard,
    getGeneralStats
};