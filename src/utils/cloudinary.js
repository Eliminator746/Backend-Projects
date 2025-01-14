import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import dotenv from 'dotenv';
dotenv.config();

// Configuration
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return null;

        // Upload the file on Cloudinary under avatars folder
        const uploadResult = await cloudinary.uploader.upload(localFilePath, {
            folder: 'avatars',
        });

        // Return the uploaded image details in JSON format
        console.log('Upload successful: ', uploadResult);
        fs.unlinkSync(localFilePath);
        return uploadResult;
    } catch (error) {
        console.error('Error uploading to Cloudinary: ', error.message);
        // Remove the locally saved temporary file if any error occurs
        fs.unlinkSync(localFilePath);

        return null;
    }
};

export { uploadOnCloudinary };
