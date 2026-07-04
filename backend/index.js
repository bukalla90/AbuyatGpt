import express from "express";

import dotenv from "dotenv";

import db from "./db/db.config.js";

import mainRouter from "./src/api/main.routes.js";

import { errorHandler } from "./src/middleware/error-handler.js";

import cors from "cors";



dotenv.config();



const app = express();

app.use(cors())



// middleware
app.use(express.json());





// routes
app.use("/api", mainRouter);



// error middleware
app.use(errorHandler);



// start server
async function startServer() {

    try {

        // test database connection
        const connection =
            await db.connect();

        console.log("Database connected");

        connection.release();



        const PORT =
            process.env.PORT || 3000;



        app.listen(PORT, () => {

            console.log(
                `Server is running on port ${PORT}`
            );

        });

    } 
   catch (error) {
    console.error("Error starting server:");
    console.error(error);
}
}



startServer();
