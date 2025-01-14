import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

const app = express();

// ------------------------------------------------------------------------------------------------------------------------
//                                                          Middleware
// ------------------------------------------------------------------------------------------------------------------------
app.use(cors({
    origin : process.env.CORS_ORIGIN,   
    credentials : true
}));

// Handles the incoming request with JSON payload
app.use(express.json({limit : "16kb"}));


// Handles the incoming request with URL encoded payload
app.use(express.urlencoded({extended : true, limit : "16kb"}));
// extended : true allows to parse the nested object

// Serve static files
app.use(express.static("public"))
// public is the folder where we store the static files like images, css, pdf, js etc.


// Handles the incoming request with cookies
app.use(cookieParser());

// ------------------------------------------------------------------------------------------------------------------------

//routes import
import userRouter from './src/routes/user.router.js';

app.use("/api/v1/users", userRouter)


// http://localhost:8000/api/v1/users/register
export default app; 