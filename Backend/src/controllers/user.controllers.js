import { asyncHandler } from "../utils/asyncHandler.js"; //it is a higher order function to wrap the given function into try catch and async await
import {ApiError} from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { uploadOnCloudinary } from  "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";


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
    if(!username || !email){
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
    .clearCookie("accessToken", options)
    .json(new ApiResponse(200, {}, "User logged Out"))//Empty response for mobile aplication

});

export { 
    registerUser,
    loginUser,
    logoutUser,
}