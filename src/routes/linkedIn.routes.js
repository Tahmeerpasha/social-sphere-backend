import router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generateLinkedInAccessToken, getUserInfo, publishPostWithText, publishPostWithTextAndMedia, publishPostWithTextAndMediaServerless } from "../controllers/linkedIn.controller.js";
import { upload } from "../middlewares/multer.middleware.js";

const linkedInRouter = router.Router()

linkedInRouter.route("/generate-access-token").post(verifyJWT, generateLinkedInAccessToken);
linkedInRouter.route("/get-user-info").post(verifyJWT, getUserInfo);
linkedInRouter.route("/publish-textual-post").post(verifyJWT, publishPostWithText);
linkedInRouter.route("/publish-complete-post").post(verifyJWT, upload.single('media'), publishPostWithTextAndMedia);
linkedInRouter.route("/publish-complete-post-serverless").post(publishPostWithTextAndMediaServerless);
export default linkedInRouter