import { v2 as cloudinary } from 'cloudinary';
import fs from "fs"; //file system management like open, read, write, unlink, link (unlink:- whwnever file is deleted it is basically get unlinked)



// Configuration
cloudinary.config({ 
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
    api_key: process.env.CLOUDINARY_API_KEY, 
    api_secret: process.env.CLOUDINARY_API_SECRET // Click 'View API Keys' above to copy your API secret
});    

export const uploadOnCloudinary = async (localFilePath) => {
    try {
        if(!localFilePath) return null; //if no local file path is present

        //Now upload in cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        }); //we can give many upload options hee like public_id, resource_type

        //Now file has been uploaded successfully
        console.log("File is uploaded on cloudinary", response.url);
        return response;

    } 
    catch (error) {
        fs.unlinkSync(localFilePath); //remove the locally saved temporary file if the upload operation got failed
        return null;    
    }
}

//or poor way:- 
// cloudinary.v2.uploader.upload("https://res.cloudinary.com/demo/image/upload/getting-started/shoes.jpg",
//     {public_id: "shoes"}, 
//     function(error, result){console.log(result);});
    
    