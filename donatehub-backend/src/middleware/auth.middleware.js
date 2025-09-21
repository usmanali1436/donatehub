import jwt, { decode } from "jsonwebtoken";
import {User} from '../models/user.model.js';
import asnycHandler from '../util/asnycHandler.js';
import ApiError from "../util/ApiError.js";

const verifyJWT = asnycHandler(async(req, _, next)=>{
    const token = req.cookies?.accessToken || (req.header("Authorization")?.replace("Bearer ","") || null)
    if(!token){
        throw new ApiError(401, "Unauthorized access");
    }

    const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    if(!decodedToken){
        throw new ApiError(401, "Unauthorized access");
    }

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if(!user){
        throw new ApiError(400, "Invalid access token");
    }

    req.user = user;
    next();
})

export {verifyJWT}