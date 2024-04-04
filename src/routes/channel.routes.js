import { Router } from "express";
import { createChannel, getChannels, updateChannels, getChannel } from "../controllers/channel.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/create-channel").post(verifyJWT, createChannel);
router.route("/get-all-channels").get(verifyJWT, getChannels);
router.route("/get-channel").get(verifyJWT, getChannel);
router.route("/update-channel").put(verifyJWT, updateChannels);

export default router;