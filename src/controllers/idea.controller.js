import mongoose from 'mongoose'
import { Idea } from '../models/idea.model.js'
import ApiError from '../utils/ApiError.js'
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from '../utils/asyncHandler.js'
import uploadAssetsOnCloudinary from '../utils/cloudinary.js'

const createIdea = asyncHandler(async (req, res) => {
    try {
        const { ideaContent } = req.body
        const ideaImagePath = req.file?.path
        if (!ideaImagePath)
            throw new ApiError(400, "Image is required")

        if ([ideaContent, ideaImagePath].some((field) => field?.trim() === "")) {
            throw new ApiError(400, "All fields are required")
        }
        const ideaImage = await uploadAssetsOnCloudinary(ideaImagePath)
        const idea = await Idea.create({
            user: req.user?._id,
            content: ideaContent,
            image: ideaImage?.url
        })

        if (!idea)
            throw new ApiError(500, "Error creating idea in the database")

        return res.status(201).json(
            new ApiResponse(201, idea, "Idea created successfully")
        )
    } catch (error) {
        console.log("Error occured in creating idea", error);
        if (error.message === "Image is required")
            return res.status(400).json(
                new ApiResponse(400, null, "Image is required")
            )
        else if (error.message === "All fields are required")
            return res.status(400).json(
                new ApiResponse(400, null, "All fields are required")
            )
        else
            return res.status(500).json(
                new ApiResponse(500, null, "Internal Server Error occured in creating idea")
            )
    }
});

const getIdeasByUserId = asyncHandler(async (req, res) => {
    try {
        // Get user id from the request
        const userId = req.user?._id;

        // Validate the user Id
        if (!mongoose.Types.ObjectId.isValid(userId)) {
            throw new ApiError(400, "User id is not valid");
        }
        // Get all ideas by the user id
        const ideas = await Idea.find({ user: userId }).sort({ createdAt: -1 });
        if (!ideas)
            throw new ApiError(404, "No ideas found for the user");
        // Return the ideas
        return res.status(200).json(
            new ApiResponse(200, ideas, "Ideas retrieved successfully")
        )
    } catch (error) {
        console.log("Error occured in getting ideas by user id", error);
        if (error.message === "No ideas found for the user")
            return res.status(404).json(
                new ApiResponse(404, null, "No ideas found for the user")
            )
        else if (error.message === "User id is not valid")
            return res.status(400).json(
                new ApiResponse(400, null, "User id is not valid")
            )
        else
            return res.status(500).json(
                new ApiResponse(500, null, "Error occured in getting ideas by user id")
            )
    }
});

const getIdeaById = asyncHandler(async (req, res) => {
    try {
        // Get the idea id from the request
        const ideaId = req.query.ideaId;
        // Validate the idea Id
        if (!mongoose.Types.ObjectId.isValid(ideaId)) {
            throw new ApiError(400, "Idea id is not valid");
        }
        // Get the idea by the idea id
        const ideas = await Idea.findById(ideaId);
        if (!ideas) {
            throw new ApiError(404, "No idea found with the given Idea ID");
        }
        // Return the idea
        return res.status(200).json(
            new ApiResponse(200, ideas, "Idea retrieved successfully")
        )
    } catch (error) {
        console.log("Error occured in getting idea by id", error)
        if (error.message === "No idea found with the given Idea ID")
            return res.status(404).json(
                new ApiResponse(404, null, "No idea found with the given Idea ID")
            )
        else if (error.message === "Idea id is not valid")
            return res.status(400).json(
                new ApiResponse(400, null, "Idea id is not valid")
            )
        else
            return res.status(500).json(
                new ApiResponse(500, null, "Error occured in getting idea by id")
            )
    }
});

const updateIdeaById = asyncHandler(async (req, res) => {
    try {
        // Get the idea id from the request
        const ideaId = req.query.ideaId;
        if (!mongoose.Types.ObjectId.isValid(ideaId))
            throw new ApiError(400, "Idea ID is required");

        // Get the content and image whichever is needed to be updated.
        const { ideaContent } = req.body;
        const ideaImagePath = req.file?.path

        // Validate whether the image or content is received.
        if (!ideaContent && !ideaImagePath)
            throw new ApiError(400, "Either content or image is required to update");

        // If both are received then update both, if either one is received the update only that field.
        if (ideaContent && ideaImagePath) {
            const ideaImage = await uploadAssetsOnCloudinary(ideaImagePath)
            const updatedIdea = await Idea.findByIdAndUpdate(ideaId, {
                content: ideaContent,
                image: ideaImage?.url
            }, { new: true })
            if (!updatedIdea)
                throw new ApiError(500, "Error updating idea in the database")
            return res.status(200).json(
                new ApiResponse(200, updatedIdea, "Idea updated successfully with image and content")
            );
        } else if (ideaContent) {
            const updatedIdea = await Idea.findByIdAndUpdate(ideaId, {
                content: ideaContent
            }, { new: true })
            if (!updatedIdea)
                throw new ApiError(500, "Error updating idea in the database")
            return res.status(200).json(
                new ApiResponse(200, updatedIdea, "Idea updated successfully with content")
            );
        } else if (ideaImagePath) {
            const ideaImage = await uploadAssetsOnCloudinary(ideaImagePath)
            const updatedIdea = await Idea.findByIdAndUpdate(ideaId, {
                image: ideaImage?.url
            }, { new: true })
            if (!updatedIdea)
                throw new ApiError(500, "Error updating idea in the database")
            return res.status(200).json(
                new ApiResponse(200, updatedIdea, "Idea updated successfully with image")
            );
        }
    } catch (error) {
        console.log("Error occured updating Idea", error)
        if (error.message === "Idea ID is required")
            return res.status(400).json(
                new ApiResponse(400, null, "Idea ID is required")
            )
        else if (error.message === "Either content or image is required to update")
            return res.status(400).json(
                new ApiResponse(400, null, "Either content or image is required to update")
            )
        else
            return res.status(500).json(
                new ApiResponse(500, null, "Error updating idea in the database")
            )

    }
});

const deleteIdeaById = asyncHandler(async (req, res) => {
    try {
        // Get the idea id from the request
        const ideaId = req.query.ideaId;
        if (!mongoose.Types.ObjectId.isValid(ideaId))
            throw new ApiError(400, "Idea ID is required");

        // Delete the idea by the idea id
        const deletedIdea = await Idea.findByIdAndDelete(ideaId);
        if (!deletedIdea)
            throw new ApiError(500, "Error deleting idea in the database");
        return res.status(200).json(
            new ApiResponse(200, deletedIdea, "Idea deleted successfully")
        );
    } catch (error) {
        console.log("Error occured deleting Idea", error)
        if (error.message === "Idea ID is required")
            return res.status(400).json(
                new ApiResponse(400, null, "Idea ID is required")
            )
        else
            return res.status(500).json(
                new ApiResponse(500, null, "Error deleting idea in the database")
            )
    }
})

export {
    createIdea,
    getIdeasByUserId,
    getIdeaById,
    updateIdeaById,
    deleteIdeaById
}