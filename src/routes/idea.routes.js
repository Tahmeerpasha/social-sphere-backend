import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";
import { createIdea, deleteIdeaById, getIdeaById, getIdeasByUserId, updateIdeaById } from "../controllers/idea.controller.js";

const router = Router()

// Getting ideas by user ID
router.route("/get-ideas").get(verifyJWT, getIdeasByUserId)

router.route("/create-idea").post(verifyJWT, upload.single('ideaImage'), createIdea)
router.route("/get-idea-by-id").get(verifyJWT, getIdeaById)
router.route("/update-idea-by-id").patch(verifyJWT, upload.single('ideaImage'), updateIdeaById)
router.route("/delete-idea-by-id").delete(verifyJWT, deleteIdeaById)

export default router