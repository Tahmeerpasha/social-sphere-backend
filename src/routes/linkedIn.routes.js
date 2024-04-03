import router from "express"
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { generateLinkedInAccessToken, getUserInfo } from "../controllers/linkedIn.controller.js";

const linkedInRouter = router.Router()

linkedInRouter.route("/generate-access-token").post(verifyJWT, generateLinkedInAccessToken);
linkedInRouter.route("/get-user-info").post(verifyJWT, getUserInfo);

export default linkedInRouter