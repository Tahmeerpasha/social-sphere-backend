import { Channel } from '../models/channel.model.js';
import ApiResponse from '../utils/ApiResponse.js';
import asyncHandler from '../utils/asyncHandler.js'

const createChannel = asyncHandler(async (req, res) => {
    const channelNames = ["Facebook", "Twitter", "Instagram", "LinkedIn", "YouTube"];
    const { accessToken, channelName } = req.body;
    const user = req.user?._id;

    if (!user) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    if (!channelNames.includes(channelName)) return res.status(400).json(new ApiResponse(400, null, "Invalid channel name"));

    const channel = { channelName, accessToken };
    if (!channelName || !accessToken) {
        return res.status(400).json(new ApiResponse(400, null, "All fields are required"));
    }

    try {
        let existingChannel;

        // Check if user already has channels
        existingChannel = await Channel.findOne({ user });

        if (existingChannel) {
            // Update access token if channel with the same name exists
            const existingChannelIndex = existingChannel.channels.findIndex(ch => ch.channelName === channelName);
            if (existingChannelIndex !== -1) {
                existingChannel.channels[existingChannelIndex].accessToken = accessToken;
                await existingChannel.save();
                return res.status(200).json(new ApiResponse(200, existingChannel, `${channelName} channel access token updated successfully`));
            } else {
                // Add new channel if user has channels but not the same channel
                existingChannel.channels.push(channel);
                await existingChannel.save();
                return res.status(201).json(new ApiResponse(201, existingChannel, "New Channel added successfully to user channels"));
            }
        } else {
            // Create a new channel if user doesn't have any channels
            existingChannel = await Channel.create({ user, channels: [channel] });
            await existingChannel.save();
            return res.status(201).json(new ApiResponse(201, existingChannel, "New Channel created successfully"));
        }
    } catch (err) {
        console.error("Error creating channel", err);
        res.status(500).json(new ApiResponse(500, null, "Error creating channel"));
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
    const { channelName, userName, userEmail, profilePicture, accessToken, refreshToken, sub } = req.body;
    const user = req.user?._id;
    if (!user) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    console.log(channelName, userName, userEmail, profilePicture, accessToken, refreshToken, sub)
    try {
        const channelToUpdate = await Channel.findOne({ user });
        console.log(channelToUpdate)
        if (!channelToUpdate) {
            return res.status(404).json(new ApiResponse(404, null, "User not found"));
        }

        const channelIndex = channelToUpdate.channels.findIndex(ch => ch.channelName === channelName);
        if (channelIndex === -1) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found"));
        }
        const updateData = {}
        if (userName) updateData["channels.$.userName"] = userName;
        if (userEmail) updateData["channels.$.userEmail"] = userEmail;
        if (profilePicture) updateData["channels.$.profilePicture"] = profilePicture;
        if (accessToken) updateData["channels.$.accessToken"] = accessToken;
        if (refreshToken) updateData["channels.$.refreshToken"] = refreshToken;
        if (sub) updateData["channels.$.sub"] = sub;


        const updatedChannel = await Channel.findOneAndUpdate(
            { user, "channels.channelName": channelName },
            { $set: updateData },
            { new: true }
        );
        console.log(updatedChannel)
        if (!updatedChannel) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found"));
        }

        return res.status(200).json(new ApiResponse(200, updatedChannel, "Channel updated successfully"));
    } catch (err) {
        console.error("Error updating channel", err);
        res.status(500).json(new ApiResponse(500, null, "Error updating channel"));
    }
});

const getChannel = asyncHandler(async (req, res) => {
    const userId = req.user?._id;
    const channelName = req.query.channelName;
    if (!userId) return res.status(401).json(new ApiResponse(401, null, "Unauthorized"));
    if (!channelName) return res.status(400).json(new ApiResponse(400, null, "Channel name is required"));
    try {
        const userChannel = await Channel.findOne
            ({
                user: userId,
                "channels.channelName": channelName
            });
        if (!userChannel) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found"))
        }
        // Find the matching channel within the channels array
        const channel = userChannel.channels.find(ch => ch.channelName === channelName);

        if (!channel) {
            return res.status(404).json(new ApiResponse(404, null, "Channel not found within user channels"));
        }

        return res.status(200).json(new ApiResponse(200, channel, "Channel found successfully"))
    } catch (err) {
        console.log("Error getting channel", err);
        res.status(500).json(new ApiResponse(500, err, "Error getting channel"))
    }
}
);



export { createChannel, getChannels, updateChannels, getChannel }