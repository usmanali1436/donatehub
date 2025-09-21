import mongoose, { Schema } from "mongoose";

const donationSchema = new Schema(
    {
        donorId: {
            type: Schema.Types.ObjectId,
            ref: "User",
            required: [true, "Donor ID is required"]
        },
        campaignId: {
            type: Schema.Types.ObjectId,
            ref: "Campaign",
            required: [true, "Campaign ID is required"]
        },
        amount: {
            type: Number,
            required: [true, "Donation amount is required"],
            min: [1, "Donation amount must be greater than 0"]
        },
        donatedAt: {
            type: Date,
            default: Date.now
        }
    },
    { 
        timestamps: true 
    }
);

donationSchema.index({ donorId: 1, campaignId: 1 });
donationSchema.index({ campaignId: 1 });
donationSchema.index({ donatedAt: -1 });

export const Donation = mongoose.model("Donation", donationSchema);