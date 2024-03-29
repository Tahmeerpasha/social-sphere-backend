import { Router } from "express";
import { createChannel, getChannels, updateChannels } from "../controllers/channel.controller";
import { verifyJWT } from "../middlewares/auth.middleware";

const router = Router();

router.route("/create-channel").post(verifyJWT, createChannel);
router.route("/get-channels").post(verifyJWT, getChannels);
router.route("/update-channel").post(verifyJWT, updateChannels);

export default router;