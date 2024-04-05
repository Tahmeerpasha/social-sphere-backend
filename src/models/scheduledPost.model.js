import mongoose from "mongoose"

const scheduledPostSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    body: {
        type: String,
        required: true,
        trim: true,
    },
    media: [{
        url: {
            type: String,
            required: true
        },
        alt: { type: String }
    }],
    socials: {
        type: [{
            social: {
                type: String,
                enum: ["Facebook", "Twitter", "Instagram", "LinkedIn"],
                required: true
            },
            accessToken: {
                type: String,
                required: true
            },
        }],
        required: true,
    },
    scheduledAt: {
        type: Date,
        required: true
    },
}, { timestamps: true })

export const ScheduledPost = mongoose.model('ScheduledPost', scheduledPostSchema)