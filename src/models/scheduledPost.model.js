import mongoose from "mongoose"

const scheduledPostSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    posts: {
        type: [{
            channel: {
                type: mongoose.Types.ObjectId,
                ref: "Channel",
                required: true,
            },
            content: {
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
            scheduledAt: {
                type: Date,
                required: true
            },
        }],
        required: true,
        default: []
    }
}, { timestamps: true })

export const ScheduledPost = mongoose.model('ScheduledPost', scheduledPostSchema)