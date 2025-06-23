import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";



const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`); //for connecting to the database 
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`); //to tell the host who connected to our database
    } 
    catch (error) {
        console.error("MONGODB connection error", error)
        process.exit(1)    
    }
}

export default connectDB;