import { asyncHandler } from "../utils/asyncHandler";
import { ApiError } from "../utils/ApiError";
import jwt from "jsonwebtoken";
import { User } from "../models/user.models";

//Note since below res is of new use, so somewhere it is written like this also {....async(req, _, next)....}
export const verifyJWT = asyncHandler( async(req, res, next) => { //middleware to verify authentication
    try {
        //since we add app.use(cookieParser()) middleware in app.js, now we can access cookies of both req as well as res
        const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "") //we also check case where no cookies is their like mobile apps so we need their header also like Authorization from postman as {Authorization: Bearer <token>}
        //you need to replace the (Bearer ) part with empty string
    
        if(!token){
            throw new ApiError(401, "Unauthorized request")
        }
    
        //if token is present:- 
        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET) //need to verify this token
    
        //Why we do not use Refresh token here? (later on) (in frontend we req refresh token)
    
        const user = await User.findById(decodedToken?._id).select("-password -refreshToken")
    
        if(!user){
            //little bit discuss in next video about frontend
            throw new ApiError(401, "Invalid Access Token")
        }
    
        req.user = user;
        next()
    } 
    catch (error) {
        throw new ApiError(401, error?.message || "Invalid access token")
    }

}) 