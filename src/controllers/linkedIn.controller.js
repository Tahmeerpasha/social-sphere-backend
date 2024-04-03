import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import axios from "axios";

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