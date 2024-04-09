import mongoose from "mongoose"

const postSchema = new mongoose.Schema({
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
            urn: {
                type: String,
                required: true,
                trim: true
            }
        }],
        required: true,
        timestamps: true
    }
}, { timestamps: true })

export const Post = mongoose.model('Post', postSchema)