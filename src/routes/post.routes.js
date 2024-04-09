import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createPost, deletePost, getPostById, getPosts, getPostsByChannel, updatePost } from "../controllers/post.controller.js";

const router = Router();

router.route("/create-post").post(verifyJWT, createPost);
router.route("/get-posts").get(verifyJWT, getPosts);
router.route("/get-post").get(verifyJWT, getPostById);
router.route("/get-posts-by-channel").get(verifyJWT, getPostsByChannel);
router.route("/update-post").put(verifyJWT, updatePost);
router.route("/delete-post").delete(verifyJWT, deletePost);

export default router;