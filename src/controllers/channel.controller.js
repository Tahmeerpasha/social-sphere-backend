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
    const userId = req.user?._id;
    try {
        const userChannels = await Channel.findOne({
            user: userId
        });
        if (!userChannels) {
            return res.status(404).json(new ApiResponse(404, null, "No channels found"))
        }
        return res.status(200).json(new ApiResponse(200, userChannels, "Channels found successfully"))
    } catch (err) {
        console.log("Error getting channels", err);
        res.status(500).json(new ApiResponse(500, err, "Error getting channels"))
    }
});

const updateChannels = asyncHandler(async (req, res) => {
    const channel = {};
    const { channelName, accessToken, refreshToken, sub } = req.body;
    if (channelName) channel.channelName = channelName;
    else res.status(400).json(new ApiResponse(400, null, "Channel name is required"))
    const userId = req.user?._id;
    if (!channelName && !accessToken && !refreshToken && !sub) {
        return res.status(400).json(new ApiResponse(400, null, "Atleast one field is required"))
    }
    try {
        const userChannel = await Channel.findOne({ user: userId });
        console.log(userChannel)
        if (!userChannel) {
            return res.status(404).json(new ApiResponse(404, null, "No channels found"))
        }
        const channelIndex = userChannel.channels.findIndex(ch => {
            console.log(ch.name, channelName)
            return ch.name === channelName
        });
        console.log(channelIndex)
        if (channelIndex === -1) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found"))
        }
        if (accessToken) userChannel.channels[channelIndex].accessToken = accessToken;
        if (refreshToken) userChannel.channels[channelIndex].refreshToken = refreshToken;
        if (sub) userChannel.channels[channelIndex].sub = sub;
        await userChannel.save();
        return res.status(200).json(new ApiResponse(200, userChannel, "Channel updated successfully"))
    } catch (err) {
        console.log("Error updating channel", err);
        res.status(500).json(new ApiResponse(500, err, "Error updating channel"))
    }
})

export { createChannel, getChannels, updateChannels }