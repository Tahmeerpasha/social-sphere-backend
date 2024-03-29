import mongoose from "mongoose"

const accountSchema = new mongoose.Schema({
    name: {
        type: string,
        required: true,
    },
    accessToken: {
        type: string,
        required: true,
    },
    refreshToken: {
        type: string,
    },
    sub: {
        type: string,
    },
})

const channelSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        require: true
    },
    channels: {
        type: accountSchema,
        require: true,
        trim: true
    }
}, { timestamps: true })

export const Channel = mongoose.model('Channel', channelSchema)