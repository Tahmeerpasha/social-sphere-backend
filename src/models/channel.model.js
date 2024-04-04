import mongoose from "mongoose"

const channelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    channels: {
        type: [{
            channelName: {
                type: String,
                enum: ["Facebook", "Twitter", "Instagram", "LinkedIn"],
                required: true
            },
            userName: {
                type: String
            },
            userEmail: {
                type: String
            },
            profilePicture: {
                type: String
            },
            accessToken: {
                type: String,
                required: true,
            },
            refreshToken: {
                type: String,
            },
            sub: {
                type: String,
            },
        }],
        require: true,
        trim: true
    }
}, { timestamps: true })

export const Channel = mongoose.model('Channel', channelSchema)