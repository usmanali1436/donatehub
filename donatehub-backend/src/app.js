import express, { json } from "express"
import cookieParser from  "cookie-parser"
import cors from 'cors';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN
}))
app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));
app.use(express.static("public"));
app.use(cookieParser());


// Import routes
import userRouter from "./routes/user.routes.js"
import campaignRouter from "./routes/campaign.routes.js"
import donationRouter from "./routes/donation.routes.js"
import dashboardRouter from "./routes/dashboard.routes.js"
// routes
app.use("/api/v1/users", userRouter)
app.use("/api/v1/campaigns", campaignRouter)
app.use("/api/v1/donations", donationRouter)
app.use("/api/v1/dashboard", dashboardRouter)

app.use("/api/v1/health-check", (req,res,next)=>{
    return res.status(200).json({statusCode: 200,success: true, message: "App Working fine."})
})

export {app}