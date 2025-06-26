import { Router } from "express";
import { registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateUserAvatar, updateUserCoverImage, getUserChannelProfile, getWatchHistory} from "../controllers/user.controllers.js";
import { upload } from "../middlewares/multer.middlewares.js";
import { verifyJWT } from "../middlewares/auth.middlewares.js";
const router = Router();

router.route("/register").post( //putting a miidleware upload before registerUser
    upload.fields([ //as we need 2 things to upload here i.e, avatar and coverImage, we need an array of object
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
) //now on route /user we get redirect or give control to userRouter in user.routes.js then from there i can redirect to  registerUser using route /register
//we put a middleware before registerUser for file handling or uploading purpose using multer
//the path would be http://localhost8000/users/register

//Similarly
//router.route("/login").post(loginUser)
router.route("/login").post(loginUser)

//secured routes
router.route("/logout").post(verifyJWT, logoutUser) //before logout we are introducing a middleware i.e, verifyJWT and next() is written inside middleware verifyJWT to move on to logoutUser as per here
//In this way we can also use multiple middlewares
//and now due to middleware verifyJWT, we have access of req.user inside logoutUser method also in user.controllers.js


//making an endpoint to refresh access token in order to not login always
router.route("/refresh-token").post(refreshAccessToken)

router.route("/change-password").post(verifyJWT, changeCurrentPassword) //only verified people are able to do so thats why put verifyJWT

router.route("/current-user").get(verifyJWT, getCurrentUser) //as no data sharing is happening, so instead of making post route we can also make get route

router.route("/update-account").patch(verifyJWT, updateAccountDetails) //here must keep a patch route not post warna saari details update hojaayegi

router.route("/avatar").patch(verifyJWT, upload.single("avatar"), updateUserAvatar) //@nd middleware to update the avatar

router.route("/cover-image").patch(verifyJWT, upload.single("coverImage"), updateUserCoverImage)

router.route("/c/:username").get(verifyJWT, getUserChannelProfile) //since we are taking in data from .params here, we need to write the route as /c/:username

router.route("/history").get(verifyJWT, getWatchHistory)

export default router;