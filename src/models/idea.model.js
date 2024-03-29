import mongoose from 'mongoose';

const ideaSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true,
        trim: true
    },
    image: {
        type: String,
        required: true
    },
}, { timestamps: true })

export const Idea = mongoose.model('Idea', ideaSchema);