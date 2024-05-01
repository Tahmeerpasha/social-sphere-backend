import { google } from "googleapis";
import fs from 'fs';
import readline from "readline"
import asyncHandler from "../utils/asyncHandler.js";

const uploadVideoToYoutube = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const fileName = req.file?.path;
    const fileSize = fileName ? fs.statSync(fileName).size : null;
    const SCOPES = ['https://www.googleapis.com/auth/youtube.upload'];
    const TOKEN_PATH = 'src/utils/token.json';
    const CLIENT_SECRET = "src/utils/client_secrets.json"



    // Check if fileName is undefined (no file uploaded)
    if (!fileName) {
        // Return a 400 Bad Request response
        return res.status(400).json({ message: "No file provided for upload." });
    }

    try {


        // Load client secrets from a local file
        fs.readFile(CLIENT_SECRET, (err, content) => {
            if (err) {
                console.error('Error loading client secret file:', err);
                return res.status(500).json({ message: "Internal server error." });
            }
            // Authorize a client with credentials, then call the YouTube API
            authorize(JSON.parse(content), uploadVideo);
        });

        function authorize(credentials, callback) {
            const { client_secret, client_id, redirect_uris } = credentials.web;
            console.log(client_id)
            console.log(client_secret)
            console.log(redirect_uris[0])
            const oAuth2Client = new google.auth.OAuth2(
                client_id, client_secret, redirect_uris[0]);

            // Check if we have previously stored a token.
            fs.readFile(TOKEN_PATH, (err, token) => {
                if (err) return getAccessToken(oAuth2Client, callback);
                oAuth2Client.setCredentials(JSON.parse(token));
                callback(oAuth2Client);
            });
        }
        function getAccessToken(oAuth2Client, callback) {
            const authUrl = oAuth2Client.generateAuthUrl({
                access_type: 'offline',
                scope: SCOPES,
            });
            console.log('Authorize this app by visiting this url:', authUrl);
            const rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout,
            });
            rl.question('Enter the code from that page here: ', (code) => {
                rl.close();
                oAuth2Client.getToken(code, (err, token) => {
                    if (err) return console.error('Error retrieving access token', err);
                    oAuth2Client.setCredentials(token);
                    // Store the token to disk for later program executions
                    fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                        if (err) return console.error(err);
                        console.log('Token stored to', TOKEN_PATH);
                    });
                    callback(oAuth2Client);
                });
            });
        }

        function uploadVideo(auth) {
            const youtube = google.youtube({ version: 'v3', auth });
            youtube.videos.insert({
                part: ['snippet', 'status'],
                requestBody: {
                    snippet: {
                        title: title, // Specify your video title
                        description: description, // Specify your video description
                        tags: ['keyword1', 'keyword2'], // Specify your video tags
                        categoryId: '22', // Specify the category ID (see: https://developers.google.com/youtube/v3/docs/videoCategories/list)
                    },
                    status: {
                        privacyStatus: 'public', // Specify your video privacy status (public, private, unlisted)
                    },
                },
                media: {
                    body: fs.createReadStream(fileName),
                },
            }, {
                // Use the contentLength option to indicate the size of the file being uploaded
                // This is required when the chunkSize option is set to a value other than -1
                // Set it to the size of the file being uploaded
                maxContentLength: fileSize
            }, (err, res) => {
                if (err) {
                    console.error('Error uploading video:', err);
                    return;
                }
                console.log('Video uploaded:', res.data);
            });
        }
    } catch (error) {
        // Handle any errors that occur during file processing or API calls
        console.error("Error:", error);
        return res.status(500).json({ message: "Internal server error." });
    }
});

export { uploadVideoToYoutube };