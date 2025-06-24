import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"; //from my server, we can access and set the cookies of our user's browser through cookie-parser and also use to create secure cookies
const app = express()

//Mostly data came from url came through req.params or req.body
//We require a package call cookie-parser and CORS 

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"})) //we can directly take json files in express with limit in size and this data is that which we fill in form

//Now for data coming from url, we need an encoder as url changes as per browser
app.use(express.urlencoded({extended: true, limit: "16kb"})) //extended is use to give object inside an object

app.use(express.static("public")) //for public static files like images

app.use(cookieParser())

//Routes importing

import userRouter from './routes/user.routes.js';

//routes declaration
//we cant use app.get() here bcz it is used when we are not exportingg router
//Now for declaring router we need to use middleware, so use app.use()

//app.use("/users", userRouter)    //now on route /user we get redirect or give control to userRouter in user.routes.js then from there i can redirect to  registerUser using route /register
//the path would be http://localhost8000/users/register
//We can resuse this route users for every thing like login, register, etc.

//Better production std route for user

app.use("/api/v1/users", userRouter) 


export { app }