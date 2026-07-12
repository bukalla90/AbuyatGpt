import {
    createConversationService,
    getConversationRows,
} from "../service/chat.service.js";



export async function createConversationController(
    req,
    res,
    next
) {

    try {

        const { question, chatId, userId } = req.body;

        const result =
            await createConversationService(question, chatId, userId);

        res.status(201).json({
            success: true,
            message: "Conversation created successfully",
            data: result,
        });

    } catch (error) {

        next(error);

    }
}



export async function getConversationController(
    req,
    res,
    next
) {

    try {

        const result =
            await getConversationRows(
                req.query.chatId,
                req.query.userId,
                100
            );

        res.status(200).json({
            success: true,
            message: "Conversations fetched successfully",
            data: result,
        });

    } catch (error) {

        next(error);

    }
}
