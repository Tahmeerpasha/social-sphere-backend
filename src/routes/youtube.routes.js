import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { generateYoutubeAuthorizeUrl, getYoutubeAnalytics, uploadVideoToYoutube } from "../controllers/youtube.controller.js";

const router = Router();

router.route("/").post(verifyJWT, upload.single("video"), uploadVideoToYoutube);
router.route("/auth").post(verifyJWT, generateYoutubeAuthorizeUrl);
router.route("/analytics").post(verifyJWT, getYoutubeAnalytics);
export default router;