import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';


const uploadOnCloudinary = async (localFilePath) => {
    // Configuration
    cloudinary.config({ 
        cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
        api_key:process.env.CLOUDINARY_API_KEY,
        api_secret:process.env.CLOUDINARY_API_SECRET
    });

    try {
        
        if(!localFilePath) return null;

        // Upload the file on Cloudinary
        const uploadResult = await cloudinary.uploader
       .upload( localFilePath , resource_type = "auto" );

       // Return the uploaded image URL

       console.log(uploadResult);
       return uploadResult.secure_url;

    } catch (error) {

        // Remove the locally saved temporary file if any error occurs
        fs.unlinkSync(localFilePath);   
        
        return null;
    }
}

return uploadOnCloudinary;