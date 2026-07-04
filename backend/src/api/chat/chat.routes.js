import express from "express";

import {
    createConversationController,
    getConversationController,
} from "./controllers/chat.controller.js";



const chatRouter = express.Router();



chatRouter.get(
    "/conversations",
    getConversationController
);

chatRouter.post(
    "/conversations",
    createConversationController
);



export default chatRouter;