import { google } from "googleapis";
import fs from 'fs';
import asyncHandler from "../utils/asyncHandler.js";
import ApiResponse from "../utils/ApiResponse.js";

const getOAuth2Client = (index) => {
    return new Promise((resolve, reject) => {
        fs.readFile("src/utils/client_secrets.json", (err, content) => {
            if (err) {
                console.log("Cannot load client secret file:", err);
                reject(err);
                return;
            }
            const credentials = JSON.parse(content);
            const { client_secret, client_id, redirect_uris } = credentials.web;
            const oAuth2Client = new google.auth.OAuth2(
                client_id,
                client_secret,
                redirect_uris[index]
            );
            resolve(oAuth2Client);
        });
    });
};

async function getToken(oAuth2Client, code) {
    return new Promise((resolve, reject) => {
        oAuth2Client.getToken(code, (err, token) => {
            if (err) reject(err);
            resolve(token);
        });
    });
}

async function uploadVideo(oAuth2Client, fileName, title, description) {
    const youtube = google.youtube({ version: 'v3', auth: oAuth2Client });
    return youtube.videos.insert({
        part: ['snippet', 'status'],
        requestBody: {
            snippet: {
                title: title,
                description: description,
                // Other snippet properties (tags, categoryId) can be added here
            },
            status: {
                privacyStatus: 'public',
            },
        },
        media: {
            body: fs.createReadStream(fileName),
        },
    });
}

const uploadVideoToYoutube = asyncHandler(async (req, res) => {
    const { title, description, code } = req.body;
    const fileName = req.file?.path;
    console.log(title, description, code, fileName)
    if (!fileName) {
        return res.status(400).json(new ApiResponse(400, "Please provide a video file"));
    }

    try {
        const oAuth2Client = await getOAuth2Client(2);
        const token = await getToken(oAuth2Client, code);
        oAuth2Client.setCredentials(token);

        const uploadResponse = await uploadVideo(oAuth2Client, fileName, title, description);
        console.log('Video uploaded:', uploadResponse.data);
        if (uploadResponse.status === 200)
            fs.unlinkSync(fileName);
        return res.status(200).json(new ApiResponse(200, "Success", uploadResponse.data));
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

const generateYoutubeAuthorizeUrl = asyncHandler(async (req, res) => {
    const { scope, index } = req.body;
    if (!index)
        return res.status(400).json(new ApiResponse(400, "Please provide index of redirect uri"));
    try {
        const oAuth2Client = await getOAuth2Client(index);
        const authUrl = oAuth2Client.generateAuthUrl({
            access_type: "offline",
            scope: scope
        });
        res.status(200).json(new ApiResponse(200, "Use this url to authorize application with youtube", authUrl));
    } catch (error) {
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

const getYoutubeAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate, code } = req.body;
    console.log(startDate, endDate, code)
    if (!startDate || !endDate || !code) {
        return res.status(400).json(new ApiResponse(400, "Please provide all required fields"));
    }

    try {
        const oAuth2Client = await getOAuth2Client(3);
        const token = await getToken(oAuth2Client, code);
        oAuth2Client.setCredentials(token);

        const youtubeAnalytics = google.youtubeAnalytics({ version: "v2", auth: oAuth2Client });

        const data = await youtubeAnalytics.reports.query({
            endDate,
            ids: "channel==MINE",
            metrics: "views,comments,likes,dislikes,averageViewDuration,estimatedMinutesWatched,subscribersGained",
            startDate
        });

        console.log(data.data);
        res.status(200).json(new ApiResponse(200, "Success", data.data));
    } catch (error) {
        console.error("Error:", error);
        res.status(500).json(new ApiResponse(500, "Some error occurred", error));
    }
});

export { uploadVideoToYoutube, getYoutubeAnalytics, generateYoutubeAuthorizeUrl };
