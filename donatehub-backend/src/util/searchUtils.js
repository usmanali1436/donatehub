import mongoose from "mongoose";

const buildSearchQuery = (searchTerm) => {
    if (!searchTerm || searchTerm.trim() === "") {
        return {};
    }

    const searchRegex = { $regex: searchTerm.trim(), $options: "i" };
    
    return {
        $or: [
            { title: searchRegex },
            { description: searchRegex }
        ]
    };
};

const buildCategoryFilter = (category) => {
    if (!category || category === "all") {
        return {};
    }

    const validCategories = ["health", "education", "disaster", "others"];
    if (!validCategories.includes(category)) {
        return {};
    }

    return { category };
};

const buildStatusFilter = (status) => {
    if (!status || status === "all") {
        return {};
    }

    const validStatuses = ["active", "closed"];
    if (!validStatuses.includes(status)) {
        return { status: "active" }; // default to active
    }

    return { status };
};

const buildDateRangeFilter = (startDate, endDate, field = "createdAt") => {
    const dateFilter = {};

    if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
            dateFilter.$gte = start;
        }
    }

    if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
            end.setHours(23, 59, 59, 999); // Include the entire end date
            dateFilter.$lte = end;
        }
    }

    return Object.keys(dateFilter).length > 0 ? { [field]: dateFilter } : {};
};

const buildAmountRangeFilter = (minAmount, maxAmount, field = "goalAmount") => {
    const amountFilter = {};

    if (minAmount !== undefined && minAmount !== null && minAmount >= 0) {
        amountFilter.$gte = parseFloat(minAmount);
    }

    if (maxAmount !== undefined && maxAmount !== null && maxAmount >= 0) {
        amountFilter.$lte = parseFloat(maxAmount);
    }

    return Object.keys(amountFilter).length > 0 ? { [field]: amountFilter } : {};
};

const buildSortOptions = (sortBy = "createdAt", sortOrder = "desc") => {
    const validSortFields = [
        "createdAt", "updatedAt", "title", "goalAmount", 
        "raisedAmount", "donatedAt", "amount"
    ];

    const sortField = validSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortOrder === "asc" ? 1 : -1;

    return { [sortField]: sortDirection };
};

const buildPaginationOptions = (page = 1, limit = 10) => {
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, Math.min(100, parseInt(limit) || 10)); // Max 100 per page
    const skip = (pageNumber - 1) * limitNumber;

    return {
        page: pageNumber,
        limit: limitNumber,
        skip
    };
};

const buildMatchStage = (filters) => {
    const matchConditions = [];

    Object.keys(filters).forEach(key => {
        const condition = filters[key];
        if (condition && Object.keys(condition).length > 0) {
            matchConditions.push(condition);
        }
    });

    if (matchConditions.length === 0) {
        return {};
    }

    return matchConditions.length === 1 ? matchConditions[0] : { $and: matchConditions };
};

const addProgressPercentageField = () => {
    return {
        progressPercentage: {
            $cond: [
                { $gt: ["$goalAmount", 0] },
                { 
                    $round: [
                        { $multiply: [{ $divide: ["$raisedAmount", "$goalAmount"] }, 100] }, 
                        1 
                    ] 
                },
                0
            ]
        },
        isGoalReached: { $gte: ["$raisedAmount", "$goalAmount"] }
    };
};

const buildCampaignSearchPipeline = ({
    search,
    category,
    status = "active",
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = "createdAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    includeCreator = true
}) => {
    const pipeline = [];

    // Build match stage
    const matchFilters = {
        search: buildSearchQuery(search),
        category: buildCategoryFilter(category),
        status: buildStatusFilter(status),
        goalAmount: buildAmountRangeFilter(minAmount, maxAmount, "goalAmount"),
        dateRange: buildDateRangeFilter(startDate, endDate, "createdAt")
    };

    const matchStage = buildMatchStage(matchFilters);
    if (Object.keys(matchStage).length > 0) {
        pipeline.push({ $match: matchStage });
    }

    // Add creator information if requested
    if (includeCreator) {
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "createdBy",
                foreignField: "_id",
                as: "creator",
                pipeline: [{ $project: { fullName: 1, username: 1, role: 1 } }]
            }
        });
    }

    // Add calculated fields
    pipeline.push({
        $addFields: {
            ...(includeCreator && { creator: { $arrayElemAt: ["$creator", 0] } }),
            ...addProgressPercentageField()
        }
    });

    // Add sorting
    const sortOptions = buildSortOptions(sortBy, sortOrder);
    pipeline.push({ $sort: sortOptions });

    // Add pagination
    const paginationOptions = buildPaginationOptions(page, limit);
    pipeline.push({ $skip: paginationOptions.skip });
    pipeline.push({ $limit: paginationOptions.limit });

    return {
        pipeline,
        paginationOptions,
        matchStage
    };
};

const buildDonationSearchPipeline = ({
    donorId,
    campaignId,
    minAmount,
    maxAmount,
    startDate,
    endDate,
    sortBy = "donatedAt",
    sortOrder = "desc",
    page = 1,
    limit = 10,
    includeCampaign = true,
    includeDonor = false
}) => {
    const pipeline = [];

    // Build match conditions
    const matchConditions = {};

    if (donorId && mongoose.Types.ObjectId.isValid(donorId)) {
        matchConditions.donorId = new mongoose.Types.ObjectId(donorId);
    }

    if (campaignId && mongoose.Types.ObjectId.isValid(campaignId)) {
        matchConditions.campaignId = new mongoose.Types.ObjectId(campaignId);
    }

    // Amount range filter
    const amountFilter = buildAmountRangeFilter(minAmount, maxAmount, "amount");
    if (Object.keys(amountFilter).length > 0) {
        Object.assign(matchConditions, amountFilter);
    }

    // Date range filter
    const dateFilter = buildDateRangeFilter(startDate, endDate, "donatedAt");
    if (Object.keys(dateFilter).length > 0) {
        Object.assign(matchConditions, dateFilter);
    }

    if (Object.keys(matchConditions).length > 0) {
        pipeline.push({ $match: matchConditions });
    }

    // Add campaign information if requested
    if (includeCampaign) {
        pipeline.push({
            $lookup: {
                from: "campaigns",
                localField: "campaignId",
                foreignField: "_id",
                as: "campaign",
                pipeline: [{
                    $project: {
                        title: 1,
                        description: 1,
                        category: 1,
                        goalAmount: 1,
                        raisedAmount: 1,
                        status: 1,
                        createdBy: 1
                    }
                }]
            }
        });
    }

    // Add donor information if requested
    if (includeDonor) {
        pipeline.push({
            $lookup: {
                from: "users",
                localField: "donorId",
                foreignField: "_id",
                as: "donor",
                pipeline: [{ $project: { fullName: 1, username: 1 } }]
            }
        });
    }

    // Add calculated fields
    pipeline.push({
        $addFields: {
            ...(includeCampaign && { campaign: { $arrayElemAt: ["$campaign", 0] } }),
            ...(includeDonor && { donor: { $arrayElemAt: ["$donor", 0] } })
        }
    });

    // Add sorting
    const sortOptions = buildSortOptions(sortBy, sortOrder);
    pipeline.push({ $sort: sortOptions });

    // Add pagination
    const paginationOptions = buildPaginationOptions(page, limit);
    pipeline.push({ $skip: paginationOptions.skip });
    pipeline.push({ $limit: paginationOptions.limit });

    return {
        pipeline,
        paginationOptions,
        matchStage: matchConditions
    };
};

const getPaginationMetadata = (currentPage, totalItems, limit) => {
    const totalPages = Math.ceil(totalItems / limit);
    
    return {
        currentPage: parseInt(currentPage),
        totalPages,
        totalItems,
        itemsPerPage: parseInt(limit),
        hasNext: parseInt(currentPage) < totalPages,
        hasPrev: parseInt(currentPage) > 1,
        nextPage: parseInt(currentPage) < totalPages ? parseInt(currentPage) + 1 : null,
        prevPage: parseInt(currentPage) > 1 ? parseInt(currentPage) - 1 : null
    };
};

export {
    buildSearchQuery,
    buildCategoryFilter,
    buildStatusFilter,
    buildDateRangeFilter,
    buildAmountRangeFilter,
    buildSortOptions,
    buildPaginationOptions,
    buildMatchStage,
    addProgressPercentageField,
    buildCampaignSearchPipeline,
    buildDonationSearchPipeline,
    getPaginationMetadata
};