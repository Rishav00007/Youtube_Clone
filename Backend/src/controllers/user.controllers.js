import { asyncHandler } from "../utils/asyncHandler.js"; //it is a higher order function to wrap the given function into try catch and async await
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from  "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshTokens = async(userId) => {
    try {
        const user = await User.findById(userId);
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();

        //access token is given to user but refresh token is stored in db also along with giving to user
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false}); //saving it in db

        return {accessToken, refreshToken};

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating refresh and access tokens")
    }
}


const registerUser = asyncHandler( async (req, res) => {
    // res.status(200).json({ //200 is http status code here
    //     message: "Chai aur code"
    // }) //this is an example

    //Now we write code for register
    //Steps:-
    //Get user details from frontend 
    //Put validation for details - for eg:- not empty details
    //check if user already exists: username, email
    //check for images and avatar
    //upload them to cloudinary and again check whether our avatar is uploaded by multer or not
    //create user object - create (user) in db
    //remove password and refresh token field from response
    //check for user creation
    //return res (Respond)


    //Getting user details from frontend. since initially we dont have a frontend so we use postman to send raw data and check the response of backend with respect to it
    const {fullName, email, username, password} = req.body
    console.log("email: ", email); //keep checking postman after every changes

    //We cant handle files directly using postman, for file handling we need to use a middleware (multer) and routing

    //Put validation for details - for eg:- not empty details
    // if(fileName === ""){
    //     throw new ApiError(400, "fulname is required")
    // }
    //either you can write one by one for every data field or use an array inside if condition like this:-

    if(
        [fullName, email, username, password].some((field) => field?.trim() === "") //if these fields are empty it gives true
    ){
        throw new ApiError(400, "All fields are required");
    }


    //check if user already exists: username, email
    const existedUser = await User.findOne({
        $or: [{ username }, { email }] //to check all fields at once, we use $or
    })

    if(existedUser){
        throw new ApiError(409, "User with same email or username already exists.")
    }

    console.log(req.files);
    //check for images and avatar (using multer)
    const avatarLocalPath = req.files?.avatar[0]?.path; //to store file location present in local server (not cloudinary) and get a reference to it 
    //const coverImageLocalPath = req.files?.coverImage[0]?.path;
    //or to handle 0 error when no cover image is given, we can use if-else since there is no checking on coverImage 
    let coverImageLocalPath;
    if(req.files && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = req.files?.coverImage[0]?.path;
    }

    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar file is required")
    }


    //upload them to cloudinary and again check whether our avatar is uploaded by multer or not
    //uploadOnCloudinary is already defined

    const avatar = await uploadOnCloudinary(avatarLocalPath); //no need to put async as it is already put over the main function registerUser
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!avatar){
        throw new ApiError(400, "Avatar file is required")
    }
    //Note:- Async await is only put on those task which took some time to be completed as above uploadOnCloudinary must take some time on server


    //create user object - create (user) in db
    const user = await User.create({
        fullName,
        avatar: avatar.url, //as we are only storing url on the database
        coverImage: coverImage?.url || "", //if present then only take the coverImage, otherwise keep it empty
        email,
        password,
        username: username.toLowerCase() //store username in lowercase in db
    });

    //To check user is empty or null or  not, we can user the unique id given by MONGODB to each and every data fields assosiated with it
    //remove password and refresh token field from response
     //check for user creation
    const createdUser = await User.findById(user._id).select( //if ._id se user mil gaya database me matlab wo create hua hai and .select() se hm wo methods pata lagate hai jo ki hme nahi chahiye
        "-password -refreshToken"
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user.")
    }

    //return res (Respond)
    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered Succesfully")
    )


});

const loginUser = asyncHandler( async (req, res) => {
    //req body -> data fetch
    //username or email based access
    //find the user
    //password check
    //access and refresh token both generate and send to user (generated in user.models.js)
    //send this token in secure cookies



    //req body -> data fetch
    //username or email based access

    const {email, username, password} = req.body
    console.log(email);
    if(!username && !email){ //or if(!(username || email))
        throw new ApiError(400, "Username or Email is required")
    }

    //find the user
    const user = await User.findOne({
        $or: [{username}, {email}] //to find basis on both parameters
    })

    if(!user){
        throw new ApiError(404, "User does not exist")
    }

    //password check (using bcrypt)
    const isPasswordValid = await user.isPasswordCorrect(password) //not use User, use user here as we are applying our own created methods only on our own created user but User is created by MongoDb so can access only mongodb methods like findOne
    if(!isPasswordValid){ //isPasswordCorrect is defined in user.models.js
        throw new ApiError(401, "Invalid user credentials")
    }


    //access and refresh token both generate and send to user (generated in user.models.js)
    //Since we need to generate access and refresh token multiple times we make a separate method for them
    const {accessToken, refreshToken} = await generateAccessAndRefreshTokens(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");
    
    //send these 2 token in secure cookies of user (cookie-parser)
    //before sending we need to generate some options
    const options = {
        httpOnly: true,
        secure: true
    } //Initially your cookies can be modified by anyone but on doing so, our cookies remains modified only by server
    
    return res
    .status(200)
    .cookie("accessToken", accessToken, options) //method came from cookie-parser
    .cookie("refreshToken", refreshToken, options)
    .json( //we are setting json respond to tackle the cases when user itself wants to save access and refresh tokens in local storage or something for works like mobile application setting where there is no cookies 
        new ApiResponse(
            200,
            {
                user: loggedInUser, accessToken, refreshToken
            },
            "User logged in Successfully"
        )
    )


});

const logoutUser = asyncHandler( async(req, res) => {
    //first need to clear all cookies while logout and reset refreshtoken in object

    //To access user here without email or password or etc, we can use middlewares
    //for eg:- since we add app.use(cookieParser()) middleware in app.js, now we can access cookies of both req as well as res
    //So we design a middleware for authentication in the same way in auth.middlewares.js
    //and now due to middleware verifyJWT, we have access of req.user inside logoutUser method also in user.controllers.js
    //req.user._id is accessible now


    //reset refreshtoken in object
    await User.findByIdAndUpdate( //updating the fields on logout
        req.user._id,
        {
            $set: {
                refreshToken: undefined
            }
        },
        {
            new: true
        }

    )

    //clear all cookies
    const options = {
        httpOnly: true,
        secure: true
    } 
    return res
    .status(200)
    .clearCookie("accessToken", options) //method came from cookie-parser
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))//Empty response for mobile aplication

});

//so that user need not to login again and again
const refreshAccessToken = asyncHandler( async (req, res) => {
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken //for mobile apps

    if(!incomingRefreshToken){
        throw new ApiError(401, "Unauthorized request"); //this is proper response to an Api error which is we sending
    }

    try {
        //verify the token with token stored in our db
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
    
        //using mongodb query
        const user = await User.findById(decodedToken?._id)
    
        if(!user){
            throw new ApiError(401, "Invalid refresh token")
        }
    
        //Now matching both users
        if(incomingRefreshToken !== user?.refreshToken){ //matches with the refreshToken which we save above while generating these tokens
            throw new ApiError(401, "Refresh Token is expired or used") 
        }
    
        //now generate latest access and refresh token
        const options = {
            httpOnly: true,
            secure: true
        }
    
        const {accessToken, newRefreshToken} = await generateAccessAndRefreshTokens(user._id)
        return res
        .status(200)
        .cookie("accessToken", accessToken, options)
        .cookie("refreshToken", newRefreshToken, options)
        .json(
            new ApiResponse(
                200,
                {accessToken, refreshToken: newRefreshToken},
                "Access token refreshed"
            )
        )
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }

});

const changeCurrentPassword = asyncHandler( async(req, res) => {
    const {oldPassword, newPassword} = req.body //we can also take a confirm password  and put an if-else

    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword) //this isPasswordCorrect() method is done using bcrypt in user.models.js where are we are matching the oldPassword given by user first with the initial encrypted password, so that he can get access to change the password

    if (!isPasswordCorrect) { //old password not correct
        throw new ApiError(400, "Invalid old password")
    }

    //changing new password
    user.password = newPassword
    await user.save({validateBeforeSave: false}) //to save new password

    return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"))

});

const getCurrentUser = asyncHandler( async (req, res) => {
    return res //as we already run out middleware auth.middlewares.js
    .status(200)
    .json(new ApiResponse(200, req.user, "Current user fetched Successfully"))
});

//text data update
const updateAccountDetails = asyncHandler( async(req, res) => {
    const {fullName, email} = req.body

    if(!fullName || !email){
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName, //or fullName: fullName
                email: email
            }
        },
        {new: true}
        
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))

});


//for any file (avatar or coverImage), update must keep an other separate endpoint/method and we use multer/middleware here
const updateUserAvatar = asyncHandler( async(req, res) => {
    const avatarLocalPath = req.file?.path; //no need to take .files here just req a file(avatar) to update
    
    if(!avatarLocalPath) {
        throw new ApiError(400, "Avatar is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if(!avatar.url){
        throw new ApiError(400, "Error while uploading on avatar")
    }

    //TODO:- delete old avatar image- assignment

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Avatar updated successfully"))

});

const updateUserCoverImage = asyncHandler( async(req, res) => {
    const coverImageLocalPath = req.file?.path; //no need to take .files here just req a file(avatar) to update
    
    if(!coverImageLocalPath) {
        throw new ApiError(400, "Cover Image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if(!coverImage.url){
        throw new ApiError(400, "Error while uploading on Cover Image")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password")

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Cover Image updated successfully"))

});


const getUserChannelProfile = asyncHandler( async(req, res) => {
    const {username} = req.params

    if(!username?.trim()){
        throw new ApiError(400, "Username is missing")
    }

    const channel = await User.aggregate([ //aggregation pipeline gives values as an array of objects
        {
            $match: {
                username: username?.toLowerCase() //to match username with given one and filter them out
            }
        },
        {
            $lookup: { //to find no. of subscribers of a channel
                from: "subscriptions", //as our Subscription in schema get stored in lower case and plural i.e, subscriptions
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: { //to find no. of subscribers of a channel
                from: "subscriptions", //as our Subscription in schema get stored in lower case and plural i.e, subscriptions
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            //adding the two fields in user model
            $addFields:{
                subscribersCount: {
                    $size: "$subscribers"
                },
                channelSubscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed: { //for button which show subscribed or subscribe on the frontend as we are sending a true/false value to the frontend
                    $cond: {
                        if: {$in: [req.user?._id, "$subscribers.subscriber"]},
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: { //to not project every value to the user, only project selected values
                fullName: 1,
                username: 1,
                subscribersCount: 1,
                channelSubscribedToCount: 1,
                isSubscribed: 1,
                avatar: 1,
                coverImage: 1,
                email: 1 

            }
        }

    ])

    if(!channel?.length){
        throw new ApiError(404, "Channel does not exists")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "User channel fetched successfully") //only giving first objct if channel as response
    )
});


//To show watch history of the user, we need nested lookups (nested aggregation pipelines/ sub aggregation pipelines)
//as we need one lookup to see video model from user model which contains watch History as videos get continuously added as a queue in watch history and then require another nested lookup from video to user to detect owner
const getWatchHistory = asyncHandler( async(req, res) => {
    //req.user._id //you may seems it generate a MongoDB id but it only generates a string and then mongoose converts into an object id of MongoDb like {_id: ObjectId('234fdvgfgdrg3242was12fcw4')}
    const user = await User.aggregate([
        {
            $match: { //but during aggregation pipeline mongoose is not able to convert the string into Object id, we need to do it manually like below:-
                _id: new mongoose.Types.ObjectId(req.user._id)
            }
            
        },
        {
            $lookup: {
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [ //creating a second sub pipeline for owner field in videos
                    {
                        $lookup: {
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [ //another sub pipeline as we only req to project some details of owner not all
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1,
                                        avatar: 1
                                    }
                                }

                            ]
                        }
                    },
                    {
                        $addFields: { //as in owner field due to sub pipeline, we get values as array of object, so we only want to give only the first element of the array
                            owner: { //not taking another value, overriding the owner value only
                                $first: "$owner"
                            }
                        }//we can do this also as wriiten or also we can give full array to owner (both are correct)
                    }
                ]
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(
            200, 
            user[0].watchHistory,
            "Watched history fetched successfully"
        )
    )

});


export { 
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage,
    getUserChannelProfile,
    getWatchHistory

}