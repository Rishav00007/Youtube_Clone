//While connecting to database through mongoose, always use try-catch as there are very much chances of errors
//Since database is always kept in other continent there must be a delay while fetching the data, so must put async await

import dotenv from "dotenv"; //import this at first as soon as possible and must add its path in config and also add config in scripts in package.json. Since it has not been updated yet in documentation, we need to also use a tag --experimental-json-modules in scripts as it gonna later addon
//or we can use:-
// require('dotenv').config()
// console.log(process.env) //but this destroy the continuity of pgm




// import mongoose from "mongoose";
// import { DB_NAME } from "./constants.js";



/*
//First approach to write every thing in index.js only about databases

import express from "express"

const app = express()


//function connectDB(){
//better approach is to put an IFFY


(async () => {
    try {
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`) //for connecting to the database 
        app.on("error", (error) => {
            console.log("ERROR: ", error);
            throw error
        })

        app.listen(process.env.PORT, () => {
            console.log(`App is listening on port ${process.env.PORT}`);
        })
    } 
    catch (error) {
        console.error("ERROR: ", error)
        throw error    
    }
})()

*/

//Second approach is to write everything about database in db/index.js and only import in index.js

import connectDB from "./db/index.js";
import app from "./app.js"

dotenv.config({
    path: './env'
});

connectDB() //since connectDB is an asynchronous method it also return a promise, so we can put .then().catch()
.then(() => {
    application.listen(process.env.PORT || 8000, () => {
        console.log(`Server is running at port : ${process.env.PORT}`);
    })
})
.catch((err) => {
    console.log("Mongo Db connection failed !!! ", err);
});