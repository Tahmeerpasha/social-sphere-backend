import { Channel } from "../models/channel.model.js";
import { Post } from "../models/post.model.js";
import ApiResponse from '../utils/ApiResponse.js'
import asyncHandler from "../utils/asyncHandler.js";
import mongoose from "mongoose"

const createPost = asyncHandler(async (req, res) => {
    try {
        const { urn, channelName } = req.body;
        if (!urn || !channelName)
            return res.status(400).json(new ApiResponse(400, "All fields are required", null));
        if (!req.user)
            return res.status(401).json(new ApiResponse(401, "Unauthorized", null));

        const channel = await Channel.findOne({ user: req.user._id, "channels.channelName": channelName });
        if (!channel)
            return res.status(404).json(new ApiResponse(404, "Channel not found for current user", null));

        let post;
        const posts = await Post.find({ user: req.user._id }).select("posts");

        if (posts.length > 0) {
            // If posts array exists for the current user then add the post to the array
            posts[0].posts.push({ urn, channel });
            await posts[0].save();
            post = posts[0];
        } else {
            // If posts array does not exist for the current user then create a new post
            post = await Post.create({
                user: req.user._id,
                posts: [{ urn, channel }]
            });
        }
        return res.status(201).json(new ApiResponse(201, "Post created successfully", post));
    } catch (error) {
        console.log("Error in createPost: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});


const getPosts = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const posts = await Post.find({ user: userId });
        if (!posts.length) {
            return res.status(404).json(new ApiResponse(404, "No posts found", null));
        }
        return res.status(200).json(new ApiResponse(200, "Posts found successfully", posts));
    } catch (error) {
        console.log("Error in getPosts: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});

const getPostsByChannel = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { channelName } = req.query;

        if (!channelName)
            return res.status(400).json(new ApiResponse(400, "Channel name is required", null));

        const channel = await Channel.findOne({ user: userId, "channels.channelName": channelName });
        if (!channel)
            return res.status(404).json(new ApiResponse(404, "Channel not found", null));

        const userPosts = await Post.find({ user: userId }).select("posts");
        if (!userPosts.length)
            return res.status(404).json(new ApiResponse(404, "No posts found", null));

        const posts = userPosts[0].posts.filter(p => p.channel.toString() === channel._id.toString());
        return res.status(200).json(new ApiResponse(200, "Posts found successfully", posts));
    } catch (error) {
        console.log("Error in getPostsByChannel: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});


const getPostById = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.query;
        if (!id) return res.status(400).json(new ApiResponse(400, "Post id is required", null));
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json(new ApiResponse(400, "Invalid post id", null));
        // Fetch user posts and populate the posts array
        const userPosts = await Post.findOne({ user: userId });

        if (!userPosts) {
            return res.status(404).json(new ApiResponse(404, "User has no posts", null));
        }

        // Find the post by id within the user's posts array
        const post = userPosts.posts.find(p => p._id.toString() === id);

        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found", null));
        }

        return res.status(200).json(new ApiResponse(200, "Post found successfully", post));
    } catch (error) {
        console.log("Error in getPostById: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});

const updatePost = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { id } = req.query;
        if (!id) return res.status(400).json(new ApiResponse(400, "Post id is required", null));
        if (!mongoose.Types.ObjectId.isValid(id)) return res.status(400).json(new ApiResponse(400, "Invalid post id", null));
        const userPosts = await Post.findOne({ user: userId }).select("posts");
        console.log(userPosts)
        if (!userPosts) {
            return res.status(404).json(new ApiResponse(404, "User Post not found", null));
        }
        const post = userPosts.posts.find(p => p._id.toString() === id);
        console.log(userPosts.posts)
        if (!post) {
            return res.status(404).json(new ApiResponse(404, "Post not found", null));
        }

        const { urn, channelName } = req.body;
        if ([urn, channelName].includes(undefined))
            return res.status(400).json(new ApiResponse(400, "All fields are required", null));
        const channel = await Channel.findOne({ user: userId, "channels.channelName": channelName });
        if (!channel)
            return res.status(404).json(new ApiResponse(404, "Channel not found", null));

        post.urn = urn;
        post.channel = channel;

        return res.status(200).json(new ApiResponse(200, "Post updated successfully", post));
    } catch (error) {
        console.log("Error in updatePost: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});

const deletePost = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const postId = req.query.id;
        const userPost = await Post.findOne({ user: userId });
        if (!userPost) {
            return res.status(404).json(new ApiResponse(404, "User has no posts", null));
        }
        const postIndex = userPost.posts.findIndex(p => p._id.toString() === postId);
        if (postIndex === -1) {
            return res.status(404).json(new ApiResponse(404, "Post not found", null));
        }
        userPost.posts.splice(postIndex, 1); // Remove the post from the array
        await userPost.save(); // Save the updated userPost document
        return res.status(200).json(new ApiResponse(200, "Post deleted successfully", null));
    } catch (error) {
        console.log("Error in deletePost: ", error);
        return res.status(500).json(new ApiResponse(500, "Internal server error", null));
    }
});


export { createPost, getPosts, getPostsByChannel, getPostById, updatePost, deletePost };