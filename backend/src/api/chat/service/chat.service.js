
import { GoogleGenAI } from "@google/genai";
import db from "../../../../db/db.config.js";



const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.0-flash";



const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});



// get conversations
export async function getConversationRows(limit = 5) {

    try {

        // normalize limit
        let normalizedLimit = Number(limit);

        if (isNaN(normalizedLimit) || normalizedLimit <= 0) {
            normalizedLimit = 5;
        }

        if (normalizedLimit > 20) {
            normalizedLimit = 20;
        }

        const query = `
            SELECT id, role, content, token_count, created_at
            FROM conversations
            ORDER BY created_at ASC
            LIMIT $1
        `;

        const { rows } = await db.query(query, [normalizedLimit]);

        return rows;

    } catch (error) {

        throw error;

    }
}



// generate assistant answer
const generateAssistantAnswer = async ({
    historyRows,
    question,
}) => {

    try {

        // format history for gemini
        const formattedHistory = historyRows.map((row) => ({
            role: row.role === "assistant" ? "model" : "user",

            parts: [
                {
                    text: row.content,
                },
            ],
        }));



        // create chat
        const chat = geminiClient.chats.create({
            model: GEMINI_MODEL,

            history: formattedHistory,

            config: {
                maxOutputTokens: 100,
            },
        });



        // send message
        const result = await chat.sendMessage({
            message: question,
        });



        return {
            text: result.text,

            totalToken:
                result.usageMetadata?.totalTokenCount || 0,
        };

    } catch (error) {

        throw error;

    }
};



// create conversation
export async function createConversationService(question) {

    try {

        // validation
        if (!question || !question.trim()) {

            const error = new Error("Question is required");

            error.statusCode = 400;

            throw error;
        }



        const trimmedQuestion = question.trim();



        // get previous history
        const historyRows = await getConversationRows(50);



        // save user message
        const userMessageResult = await db.query(
            `
            INSERT INTO conversations
            (role, content)
            VALUES ($1, $2)
            RETURNING id
            `,
            ["user", trimmedQuestion]
        );



        // generate ai response
        const assistantAnswer =
            await generateAssistantAnswer({
                historyRows,
                question: trimmedQuestion,
            });



        // save assistant message
        const assistantMessageResult = await db.query(
            `
            INSERT INTO conversations
            (role, content, token_count)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [
                "assistant",
                assistantAnswer.text,
                assistantAnswer.totalToken,
            ]
        );



        // return final response
        return {
            userMessage: {
                id: userMessageResult.rows[0].id,
                role: "user",
                content: trimmedQuestion,
            },

            assistantMessage: {
                id: assistantMessageResult.rows[0].id,
                role: "assistant",
                content: assistantAnswer.text,
                tokenCount: assistantAnswer.totalToken,
            },
        };

    } catch (error) {

        throw error;

    }
}

export async function getMessageById(messageId) {

    try {

        const normalizedId = Number(messageId);

        if (isNaN(normalizedId) || normalizedId <= 0) {

            const error = new Error("Invalid message id");

            error.statusCode = 400;

            throw error;
        }

        const query = `
            SELECT
                id,
                role,
                content,
                token_count,
                created_at
            FROM conversations
            WHERE id = $1
            LIMIT 1
        `;

        const { rows } = await db.query(query, [normalizedId]);



        if (!rows[0]) {

            const error = new Error("Message not found");

            error.statusCode = 404;

            throw error;
        }



        return {
            id: rows[0].id,
            role: rows[0].role,
            content: rows[0].content,
            tokenCount: Number(rows[0].token_count || 0),
            createdAt: rows[0].created_at,
        };

    } catch (error) {

        throw error;

    }
}
