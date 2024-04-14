import { Channel } from "../models/channel.model.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import axios from "axios";
import fs from "fs";

export const generateLinkedInAccessToken = asyncHandler(async (req, res) => {
    try {
        const { authorizationCode } = req.body;
        if (!authorizationCode) throw new Error('Authorization code is required');
        const formData = new URLSearchParams();
        formData.append("Content-Type", "application/x-www-form-urlencoded")
        formData.append('grant_type', 'authorization_code');
        formData.append('code', authorizationCode);
        formData.append('client_id', process.env.LINKEDIN_CLIENT_ID);
        formData.append('client_secret', process.env.LINKEDIN_CLIENT_SECRET);
        formData.append('redirect_uri', process.env.LINKEDIN_REDIRECT_URI);

        const response = await axios.post('https://www.linkedin.com/oauth/v2/accessToken', formData, {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });

        // Forward the response from LinkedIn's API to the client
        console.log(response);

        if (response.status === 200)
            return res.status(200).json(new ApiResponse(200, response.data, 'Access token generated successfully'));
        else
            throw new ApiError(response.status, 'An error occurred while processing your request');
    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(error.response.status).json({ error: 'An error occurred while processing your request' });
    }
});


export const getUserInfo = asyncHandler(async (req, res) => {
    try {
        const { linkedInAccessToken } = req.body;
        if (!linkedInAccessToken) throw new Error('LinkedIn access token is required');
        const response = await axios.get(
            "https://api.linkedin.com/v2/userinfo",
            {
                headers: {
                    Authorization: `Bearer ${linkedInAccessToken}`,
                },
            }
        );

        if (response.status === 200) return res.status(200).json(new ApiResponse(200, response.data, 'User info fetched successfully'));
        else throw new ApiError(response.status, 'An error occurred while processing your request');

    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(error.response.status).json({ error: error.response.statusText });
    }
})

export const publishPostWithText = asyncHandler(async (req, res) => {
    try {
        const { content, visibility } = req.body;
        if (!content) throw new Error('Text is required');
        const channel = await Channel.findOne({ user: req.user._id });
        if (channel) {
            // Access the desired property from the matching subdocument
            const matchingChannel = channel.channels.find(ch => ch.channelName === "LinkedIn");
            const linkedInAccessToken = matchingChannel.accessToken;
            if (matchingChannel) {
                console.log('Found channel:', matchingChannel);
                const requestBody = {
                    author: `urn:li:person:${matchingChannel.sub}`,
                    lifecycleState: "PUBLISHED",
                    specificContent: {
                        "com.linkedin.ugc.ShareContent": {
                            shareCommentary: {
                                text: content
                            },
                            shareMediaCategory: "NONE"
                        }
                    },
                    visibility: {
                        "com.linkedin.ugc.MemberNetworkVisibility": visibility
                    }
                };
                const response = await axios.post(
                    "https://api.linkedin.com/v2/ugcPosts",
                    requestBody,
                    {
                        headers: {
                            Authorization: `Bearer ${linkedInAccessToken}`,
                            "X-Restli-Protocol-Version": "2.0.0"
                        }
                    }
                );
                if (response.status === 201) return res.status(200).json(new ApiResponse(200, response.data, 'Post published successfully'));
                else throw new ApiError(response.status, 'An error occurred while processing your request');
            } else {
                console.log('No subdocument found within the channel with the provided access token.');
                throw new ApiError(404, 'No sub document channel found with the provided access token.');
            }
        } else {
            console.log('No channel found with the provided access token.');
            throw new ApiError(404, 'No channel found with the provided access token.');
        }

    } catch (error) {
        console.error('Error proxying request:', error);
        res.status(error.response.status).json({ error: error.message });
    }
})

export const publishPostWithTextAndMedia = asyncHandler(async (req, res) => {
    try {
        const { content, visibility, mediaType } = req.body;
        const mediaPath = fs.readFileSync(req.file?.path)
        if (!content) throw new Error('Text is required');
        if (!mediaPath) throw new Error('Media is required');
        const channel = await Channel.findOne({ user: req.user._id });
        if (channel) {
            // Access the desired property from the matching subdocument
            const matchingChannel = channel.channels.find(ch => ch.channelName === "LinkedIn");
            if (matchingChannel) {
                console.log('Found channel:', matchingChannel);
                const linkedInAccessToken = matchingChannel.accessToken;
                const { uploadUrl, asset } = await registerMedia(mediaType, matchingChannel.sub, linkedInAccessToken);
                await uploadMedia(uploadUrl, mediaPath, req.file.mimetype, linkedInAccessToken);
                const response = await createMediaShare(mediaType, asset, matchingChannel.sub, content, visibility, linkedInAccessToken);
                console.log(response)
                if (response.status === 201) {
                    fs.unlinkSync(mediaPath);
                    return res.status(201).json(new ApiResponse(201, response.data, 'Post published successfully'));
                }
            } else {
                console.log('No subdocument found within the channel with the provided access token.');
                throw new ApiError(404, 'No sub document channel found with the provided access token.');
            }
        } else {
            console.log('No channel found with the provided access token.');
            throw new ApiError(404, 'No channel found with the provided access token.');
        }
    } catch (error) {
        console.error('Error proxying request:', error.message);
        res.status(500).json({ error: error.message });
    }
})

export const publishPostWithTextAndMediaServerless = asyncHandler(async (req, res) => {
    try {
        const { post, userId } = req.body;
        const content = post.content;
        const visibility = "PUBLIC";
        const media = post.media[0];
        const mediaPath = fs.readFileSync(media.url);
        const mediaType = media.alt.split('.').pop();

        console.log("Post contents", mediaType, mediaPath, content, visibility, userId, post);

        if (!content) throw new Error('Text is required');
        if (!mediaPath) throw new Error('Media is required');

        const channel = await Channel.findOne({ user: userId });

        if (channel) {
            // Access the desired property from the matching subdocument
            const matchingChannel = channel.channels.find(ch => ch.channelName === "LinkedIn");
            if (matchingChannel) {
                console.log('Found channel:', matchingChannel);
                const linkedInAccessToken = matchingChannel.accessToken;
                const { uploadUrl, asset } = await registerMedia("IMAGE", matchingChannel.sub, linkedInAccessToken);
                await uploadMedia(uploadUrl, mediaPath, mediaType, linkedInAccessToken);
                const response = await createMediaShare("IMAGE", asset, matchingChannel.sub, content, visibility, linkedInAccessToken);
                const data = await response.data;
                console.log(data);
                console.log("================================================================")
                if (response.status === 201) {
                    fs.unlinkSync(mediaPath);
                    return res.status(201).json(new ApiResponse(201, data, 'Post published successfully'));
                }
                else return res.status(response.status).json(new ApiResponse(response.status, response.data, 'An error occurred while processing your request'));
            } else {
                console.log('No subdocument found within the channel with the provided access token.');
                throw new ApiError(404, 'No sub document channel found with the provided access token.');
            }
        } else {
            console.log('No channel found with the provided access token.');
            throw new ApiError(404, 'No channel found with the provided access token.');
        }
    } catch (error) {
        console.error('Error proxying request:', error.message);
        res.status(500).json({ error: error.message });
    }
})



const registerMedia = async (mediaType, author, accessToken) => {
    try {
        const registerUploadRequest = {
            recipes: [mediaType === "image" ? "urn:li:digitalmediaRecipe:feedshare-image" : "urn:li:digitalmediaRecipe:feedshare-video"],
            owner: `urn:li:person:${author}`,
            serviceRelationships: [
                {
                    relationshipType: "OWNER",
                    identifier: "urn:li:userGeneratedContent"
                }
            ]
        };

        const response = await axios.post(
            "https://api.linkedin.com/v2/assets?action=registerUpload",
            { registerUploadRequest },
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`
                }
            }
        );
        console.log(response.data)
        const uploadUrl = response.data.value.uploadMechanism["com.linkedin.digitalmedia.uploading.MediaUploadHttpRequest"].uploadUrl;
        const asset = response.data.value.asset;
        return { uploadUrl, asset };
    } catch (error) {
        console.error("Error registering media:", error);
        throw error;
    }
};


const uploadMedia = async (uploadUrl, file, fileType, accessToken) => {
    try {
        await axios.post(uploadUrl, file, {
            headers: {
                "Content-Type": fileType,
                Authorization: `Bearer ${accessToken}`

            }
        });
    } catch (error) {
        console.error("Error uploading media:", error);
        throw error;
    }
};

const createMediaShare = async (mediaType, asset, author, content, visibility, accessToken) => {
    try {

        const requestBody = {
            author: `urn:li:person:${author}`,
            lifecycleState: "PUBLISHED",
            specificContent: {
                "com.linkedin.ugc.ShareContent": {
                    shareCommentary: {
                        text: content
                    },
                    shareMediaCategory: mediaType.toUpperCase(),
                    media: [
                        {
                            status: "READY",
                            media: asset,

                        }
                    ]
                }
            },
            visibility: {
                "com.linkedin.ugc.MemberNetworkVisibility": visibility.toUpperCase()
            }
        };

        const response = await axios.post(
            "https://api.linkedin.com/v2/ugcPosts",
            requestBody,
            {
                headers: {
                    Authorization: `Bearer ${accessToken}`,
                    "X-Restli-Protocol-Version": "2.0.0"
                }
            }
        );

        console.log("Media share created:", response.data);
        return response;
    } catch (error) {
        console.error("Error creating media share:", error);
    }
};



