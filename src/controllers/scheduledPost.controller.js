import { Channel } from '../models/channel.model.js';
import { ScheduledPost } from '../models/scheduledPost.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'


function createUTCTime(input) {
    // Convert input to lowercase for case-insensitive comparison
    input = input.toLowerCase();

    // Get current date
    const currentDate = new Date();

    // Initialize hours and minutes
    let hours, minutes;

    // Determine if input is AM or PM
    if (input.includes("am")) {
        hours = 0; // 12am is equivalent to 00:00
        minutes = 0;
    } else if (input.includes("pm")) {
        hours = 12; // 12pm is equivalent to 12:00
        minutes = 0;
    } else {
        throw new Error("Invalid input. Please provide either '12am' or '12pm'.");
    }

    // Set hours and minutes to current date
    currentDate.setUTCHours(hours);
    currentDate.setUTCMinutes(minutes);

    // Return the date in UTC format
    return currentDate.toISOString();
}

const createScheduledPost = asyncHandler(async (req, res) => {
    try {
        const { content, channelName, scheduledAt } = req.body;
        const user = req.user?._id;
        const media = req.files.map(file => ({ url: file.path, alt: file.originalname }));
        const channel = await Channel.findOne({ user, "channels.channelName": channelName });

        if ([content, channelName, scheduledAt].includes(undefined))
            return res.status(400).json(new ApiResponse(400, "All fields are required", null));

        if (!channel)
            return res.status(404).json(new ApiResponse(404, "Channel not found", null));

        if (!media.length)
            return res.status(400).json(new ApiResponse(400, "Media is required", null));

        // Check if user already has scheduled posts
        let scheduledPost = await ScheduledPost.findOne({ user });

        if (!scheduledPost) {
            // If no scheduled posts exist, create a new scheduledPost document
            scheduledPost = await ScheduledPost.create({ user, posts: [] });
        }

        // Add the new post to the existing array or newly created array
        const scheduledAtUTC = createUTCTime(scheduledAt);
        scheduledPost.posts.push({
            channel: channel._id,
            content,
            media,
            scheduledAtUTC
        });

        // Save the updated scheduledPost document
        await scheduledPost.save();

        return res.status(201).json(new ApiResponse(201, scheduledPost, "Scheduled post created successfully"));
    } catch (error) {
        console.error("Error creating scheduled post", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

const getScheduledPosts = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const scheduledPosts = await ScheduledPost.find({ user: userId });
        if (!scheduledPosts.length) {
            return res.status(404).json(new ApiResponse(404, "No scheduled posts found", null))
        }
        return res.status(200).json(new ApiResponse(200, "Scheduled posts found successfully", scheduledPosts))
    } catch (error) {
        console.error("Error getting scheduled posts", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

const getScheduledPostsByChannel = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const { channelName } = req.query;

        if (!channelName) {
            return res.status(400).json(new ApiResponse(400, "Channel name is required", null));
        }

        // Find the channel associated with the specified name for the user
        const channel = await Channel.findOne({ user: userId, "channels.channelName": channelName });

        if (!channel) {
            return res.status(404).json(new ApiResponse(404, "Channel not found", null));
        }

        // Find the scheduled posts for the user
        let scheduledPosts = await ScheduledPost.findOne({ user: userId });

        if (!scheduledPosts) {
            // If no scheduled posts exist, return empty array
            return res.status(200).json(new ApiResponse(200, "No scheduled posts found", []));
        } else {
            // If scheduled posts exist, filter posts by channel
            scheduledPosts = scheduledPosts.posts.filter(post => post.channel.toString() === channel._id.toString());
        }

        return res.status(200).json(new ApiResponse(200, "Scheduled posts found successfully", scheduledPosts));
    } catch (error) {
        console.error("Error getting scheduled posts by channel", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

const getScheduledPostById = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.query;

        // Find the scheduled posts for the user
        let scheduledPosts = await ScheduledPost.findOne({ user: userId });

        if (!scheduledPosts) {
            return res.status(404).json(new ApiResponse(404, "Scheduled posts not found", null));
        }

        // Find the post by id within the scheduled posts
        const post = scheduledPosts.posts.find(post => post._id.toString() === id);

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Scheduled post not found", null));
        }

        return res.status(200).json(new ApiResponse(200, "Scheduled post found successfully", post));
    } catch (error) {
        console.error("Error getting scheduled post by id", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

const deleteScheduledPost = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const postId = req.query.id;
        const scheduledPost = await ScheduledPost.findOne({ user: userId });

        if (!scheduledPost) {
            return res.status(404).json(new ApiResponse(404, "Scheduled post not found", null))
        }

        const postIndex = scheduledPost.posts.findIndex(post => post._id.toString() === postId);
        if (postIndex === -1) {
            return res.status(404).json(new ApiResponse(404, "Scheduled post not found", null))
        }

        // Remove the post from the array
        scheduledPost.posts.splice(postIndex, 1);
        await scheduledPost.save(); // Save the updated scheduledPost document

        return res.status(200).json(new ApiResponse(200, "Scheduled post deleted successfully", null));
    } catch (error) {
        console.error("Error deleting scheduled post", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

const updateScheduledPost = asyncHandler(async (req, res) => {
    try {
        const userId = req.user?._id;
        const { id } = req.params;
        const { content, channelName, scheduledAt } = req.body;
        const media = req.files.map(file => ({ url: file.path, alt: file.originalname }));

        const channel = await Channel.findOne({ user: userId, "channels.channelName": channelName });
        if (!channel)
            return res.status(404).json(new ApiResponse(404, "Channel not found", null));
        if (!media.length)
            return res.status(400).json(new ApiResponse(400, "Media is required", null));

        const scheduledPost = await ScheduledPost.findOne({ user: userId, _id: id });
        if (!scheduledPost)
            return res.status(404).json(new ApiResponse(404, "Scheduled post not found", null));

        // Find the correct post in the array and update its properties
        const postToUpdate = scheduledPost.posts.find(post => post._id.toString() === id);
        if (!postToUpdate)
            return res.status(404).json(new ApiResponse(404, "Scheduled post not found", null));

        //TODO: Delete previous media files if present in server


        // Update the post with the new values
        postToUpdate.scheduledAt = scheduledAt || postToUpdate.scheduledAt;
        postToUpdate.content = content || postToUpdate.content;
        postToUpdate.media = media || postToUpdate.media;
        postToUpdate.channel = channel._id;

        await scheduledPost.save();
        return res.status(200).json(new ApiResponse(200, "Scheduled post updated successfully", scheduledPost));
    } catch (error) {
        console.error("Error updating scheduled post", error);
        res.status(500).json(new ApiResponse(500, error.message, null));
    }
});

export { createScheduledPost, getScheduledPosts, getScheduledPostById, getScheduledPostsByChannel, updateScheduledPost, deleteScheduledPost };
