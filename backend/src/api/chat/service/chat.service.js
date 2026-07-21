
import { GoogleGenAI } from "@google/genai";
import db from "../../../../db/db.config.js";
import { randomUUID } from "node:crypto";



const GEMINI_MODEL =
    process.env.GEMINI_MODEL || "gemini-3.0-flash";



const geminiClient = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});



// get conversations
const UUID_PATTERN =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const assertUuid = (value, fieldName) => {
    if (!value || !UUID_PATTERN.test(value)) {
        const error = new Error(`${fieldName} must be a valid UUID`);
        error.statusCode = 400;
        throw error;
    }
};

const ensureChatSession = async (chatId, userId) => {
    assertUuid(chatId, "chatId");
    assertUuid(userId, "userId");

    const { rows } = await db.query(
        `
        INSERT INTO chat_sessions (id, user_id)
        VALUES ($1, $2)
        ON CONFLICT (id) DO UPDATE SET id = chat_sessions.id
        RETURNING id, user_id
        `,
        [chatId, userId]
    );

    if (rows[0].user_id !== userId) {
        const error = new Error("This chat belongs to another user");
        error.statusCode = 403;
        throw error;
    }
};

// get messages for one chat only
export async function getConversationRows(chatId, userId, limit = 50) {

    try {

        // normalize limit
        let normalizedLimit = Number(limit);

        if (isNaN(normalizedLimit) || normalizedLimit <= 0) {
            normalizedLimit = 5;
        }

        if (normalizedLimit > 100) {
            normalizedLimit = 100;
        }

        const query = `
            SELECT c.id, c.role, c.content, c.token_count, c.created_at
            FROM conversations
            c
            INNER JOIN chat_sessions s ON s.id = c.chat_id
            WHERE c.chat_id = $1 AND s.user_id = $2
            ORDER BY c.created_at ASC, c.id ASC
            LIMIT $3
        `;

        assertUuid(chatId, "chatId");
        assertUuid(userId, "userId");

        const { rows } = await db.query(query, [chatId, userId, normalizedLimit]);

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
       const SYSTEM_PROMPT = `
You are a helpfull doctor assistant.

Rules:
- Answer clearly.
- Be concise.
- If you don't know something, say so.
-if you are asked other than health related say i do not know it
- Use Markdown formatting.
`;

const chat = geminiClient.chats.create({
    model: GEMINI_MODEL,
    history: formattedHistory,
    config: {
        systemInstruction: SYSTEM_PROMPT,
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
export async function createConversationService(question, chatId, userId) {

    try {

        // validation
        if (typeof question !== 'string' || !question.trim()) {

            const error = new Error("Question is required");

            error.statusCode = 400;

            throw error;
        }

        if (question.length > 10000) {
            const error = new Error("Question is too long");
            error.statusCode = 413;
            throw error;
        }



        const trimmedQuestion = question.trim();
        const resolvedChatId = chatId || randomUUID();

        await ensureChatSession(resolvedChatId, userId);



        // get previous history
        const historyRows = await getConversationRows(resolvedChatId, userId, 50);



        // save user message
        const userMessageResult = await db.query(
            `
            INSERT INTO conversations
            (chat_id, role, content)
            VALUES ($1, $2, $3)
            RETURNING id
            `,
            [resolvedChatId, "user", trimmedQuestion]
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
            (chat_id, role, content, token_count)
            VALUES ($1, $2, $3, $4)
            RETURNING id
            `,
            [
                resolvedChatId,
                "assistant",
                assistantAnswer.text,
                assistantAnswer.totalToken,
            ]
        );



        // return final response
        return {
            chatId: resolvedChatId,
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

export async function getMessageById(messageId, chatId, userId) {

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
            FROM conversations c
            INNER JOIN chat_sessions s ON s.id = c.chat_id
            WHERE c.id = $1 AND c.chat_id = $2 AND s.user_id = $3
            LIMIT 1
        `;

        assertUuid(chatId, "chatId");
        assertUuid(userId, "userId");

        const { rows } = await db.query(query, [normalizedId, chatId, userId]);



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
