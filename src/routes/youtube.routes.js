import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { uploadVideoToYoutube } from "../controllers/youtube.controller.js";

const router = Router();

router.route("/").post(verifyJWT, upload.single("video"), uploadVideoToYoutube);

export default router;