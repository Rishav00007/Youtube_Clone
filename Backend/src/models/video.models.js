import mongoose, {Schema} from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2"; //must be used before exporting

const videoSchema = new Schema(
    {
        videoFile: {
            type: String, //from cloudinary url
            required: true
        },

        thumbnail: {
            type: String,  //from cloudinary url
            required: true
        },

        title: {
            type: String,
            required: true
        },

        description: {
            type: String,
            required: true
        },

        duration: {
            type: Number, //cloudinary also sends the duration
            required: true
        },

        views: {
            type: Number, 
            default: 0
        },

        isPublished: {
            type: Boolean, 
            default: true
        },

        owner:{
            type: Schema.Types.ObjectId,
            ref: "User"
        }
    },
    {timestamps: true}
);

videoSchema.plugin(mongooseAggregatePaginate); //now we can write aggregation queries


export const Video = mongoose.model("Video", videoSchema);



//we use special package called mongoose-aggregate-paginate-v2 which allows us to write aggregation queries which is the true power of MONGO DB
//Learn about aggregation pipelines 