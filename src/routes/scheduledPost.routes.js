import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createScheduledPost, deleteScheduledPost, getScheduledPostById, getScheduledPosts, getScheduledPostsByChannel, updateScheduledPost } from "../controllers/scheduledPost.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

router.route("/create-scheduled-post").post(verifyJWT, upload.array("media"), createScheduledPost);
router.route("/get-scheduled-posts").get(verifyJWT, getScheduledPosts);
router.route("/get-post-by-id").get(verifyJWT, getScheduledPostById);
router.route("/get-posts-by-channel").get(verifyJWT, getScheduledPostsByChannel);
router.route("/update-scheduled-post").put(verifyJWT, updateScheduledPost);
router.route("/delete-scheduled-post").delete(verifyJWT, deleteScheduledPost);

export default router;