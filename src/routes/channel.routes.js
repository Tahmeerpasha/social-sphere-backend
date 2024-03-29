import { Router } from "express";
import { createChannel, getChannels, updateChannels } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-channel").post(verifyJWT, createChannel);
router.route("/get-channels").get(verifyJWT, getChannels);
router.route("/update-channel").post(verifyJWT, updateChannels);

export default router;