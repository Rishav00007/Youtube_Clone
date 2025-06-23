import mongoose, {Schema} from "mongoose";
import jwt from "jsonwebtoken";  //JWT is a bearer token, jiske paas ye token hoga hm usko data bhej denge
import bcrypt from "bcrypt";


const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
            index: true
        },

        email: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },

        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },

        avatar: {
            type: String, //cloudinary url
            required: true,
        },

        coverImage: {
            type: String
        },

        watchHistory:[
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],

        password: {
            type: String, //must be encrypted
            required: [true, 'Password is required']
        },

        refreshToken: {
            type: String
        }

    },
    {timestamps: true}
);

userSchema.pre("save", async function (next){
    if(!this.isModified("password")){ //ensures that this code only runs whenever we modiffy our passwords only not everytime
        return next();
    }
    this.password = bcrypt.hash(this.password, 10); //10 is no of rounds of encryption
    next(); //to go outside middleware
}) //to encrypt password just before saving it in database, we can run any code snippet in pre hook and next is taken bcz we are adding a middleware \

//We can also add methods just like middlewares here

userSchema.methods.isPasswordCorrect = async function(password){
    return bcrypt.compare(password, this.password) //compare our password and the encrypted one
}

userSchema.methods.generateAccessToken = function(){
    return jwt.sign(
        {
            _id: this._id, //we got id directly from mongoDB
            email: this.email,
            username: this.username,
            fullName: this.fullName, //same name as your model have above
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}

userSchema.methods.generateRefreshToken = function(){ //Refresh token contains less information and have more expiry date
    return jwt.sign(
        {
            _id: this._id, //we got id directly from mongoDB
            email: this.email,
            username: this.username,
            fullName: this.fullName, //same name as your model have above
        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema);

//hey i am rishav