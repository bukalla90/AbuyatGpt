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

        const { question } = req.body;

        const result =
            await createConversationService(question);

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
            await getConversationRows(100);

        res.status(200).json({
            success: true,
            message: "Conversations fetched successfully",
            data: result,
        });

    } catch (error) {

        next(error);

    }
}