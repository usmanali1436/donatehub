import mongoose, { Schema } from "mongoose";

const campaignSchema = new Schema(
    {
        title: {
            type: String,
            required: [true, "Campaign title is required"],
            trim: true,
        },
        description: {
            type: String,
            required: [true, "Campaign description is required"],
            trim: true,
        },
        category: {
            type: String,
            required: [true, "Campaign category is required"],
            enum: {
                values: ["health", "education", "disaster", "others"],
                message: "Category must be one of: health, education, disaster, others"
            }
        },
        goalAmount: {
            type: Number,
            required: [true, "Goal amount is required"],
            min: [1, "Goal amount must be greater than 0"]
        },
        raisedAmount: {
            type: Number,
            default: 0,
            min: [0, "Raised amount cannot be negative"]
        },
        createdBy: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Campaign creator is required"]
        },
        status: {
            type: String,
            enum: {
                values: ["active", "closed"],
                message: "Status must be either active or closed"
            },
            default: "active"
        }
    },
    { 
        timestamps: true 
    }
);

campaignSchema.methods.getProgressPercentage = function () {
    return this.goalAmount > 0 ? Math.round((this.raisedAmount / this.goalAmount) * 100) : 0;
};

campaignSchema.methods.isGoalReached = function () {
    return this.raisedAmount >= this.goalAmount;
};

export const Campaign = mongoose.model("Campaign", campaignSchema);