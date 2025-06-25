import { Router } from "express";
import { registerUser, loginUser, logoutUser } from "../controllers/user.controllers.js";
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

export default router;