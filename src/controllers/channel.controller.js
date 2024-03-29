import { Channel } from '../models/channel.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'

const createChannel = asyncHandler(async (req, res) => {
    const { accessToken, channelName } = req.body;
    const user = req.user?._id;
    if (!user) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    const channel = { name: channelName, accessToken: accessToken };
    if (!channelName || !accessToken) {
        return res.status(400).json(new ApiResponse(400, null, "All fields are required"))
    }
    try {
        const userChannel = await Channel.findOne({ user: user });
        if (userChannel) {
            userChannel.channels.push(channel);
            await userChannel.save();
            return res.status(201).json(new ApiResponse(201, userChannel, "Channel created successfully"))
        }
        const newChannel = await Channel.create({
            user,
            channels: [channel]
        });
        if (!newChannel) {
            return res.status(500).json(new ApiResponse(500, null, "Error creating channel"))
        }
        return res.status(201).json(new ApiResponse(201, newChannel, "Channel created successfully"))
    } catch (err) {
        console.log("Error creating channel", err);
        res.status(500).json(new ApiResponse(500, err, "Error creating channel"))
    }
});

const getChannels = asyncHandler(async (req, res) => {
    const user = req.user?._id;
    try {
        const userChannels = await Channel.findById({ user });
        if (!userChannels) {
            return res.status(404).json(new ApiResponse(404, null, "No channels found"))
        }
        return res.status(200).json(new ApiResponse(200, userChannels, "Channels found successfully"))
    } catch (err) {
        console.log("Error getting channels", err);
    }
});

const updateChannels = asyncHandler(async (req, res) => {
    const { channelName, accessToken, refreshToken, sub } = req.body;
    const user = req.user?._id;
    const channel = {};
    if (channelName) channel.channelName = channelName;
    if (accessToken) channel.accessToken = accessToken;
    if (refreshToken) channel.refreshToken = refreshToken;
    if (sub) channel.sub = sub;
    if (!channelName && !accessToken && !refreshToken && !sub) {
        return res.status(400).json(new ApiResponse(400, null, "All fields are required"))
    }
    try {
        const userChannel = await Channel.findById({ user });
        if (!userChannel) {
            return res.status(404).json(new ApiResponse(404, null, "No channels found"))
        }
        const channelIndex = userChannel.channels.findIndex(ch => ch.channelName === channelName);
        if (channelIndex === -1) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found"))
        }
        userChannel.channels[channelIndex] = channel;
        await userChannel.save();
        return res.status(200).json(new ApiResponse(200, userChannel, "Channel updated successfully"))
    } catch (err) {
        console.log("Error updating channel", err);
    }
})

export { createChannel, getChannels, updateChannels }