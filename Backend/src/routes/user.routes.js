import { Router } from "express";
import { registerUser } from "../controllers/user.controllers.js";

const router = Router();

router.route("/register").post(registerUser) //now on route /user we get redirect or give control to userRouter in user.routes.js then from there i can redirect to  registerUser using route /register

//the path would be http://localhost8000/users/register

//Similarly
//router.route("/login").post(loginUser)

export default router;