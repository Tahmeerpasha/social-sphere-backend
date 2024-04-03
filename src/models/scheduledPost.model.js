import mongoose from "mongoose"

const scheduledPostSchema = new mongoose.Schema({
    body: {
        type: String,
        required: true,
        trim: true,
        // maxlength: 500
    },
    media: [{
        url: {
            type: String,
            required: true
        },
        alt: { type: String }
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
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