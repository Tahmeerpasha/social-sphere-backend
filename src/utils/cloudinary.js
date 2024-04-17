import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});


const uploadAssetsOnCloudinary = async (localFilePath) => {
    try {
        if (!localFilePath) return;
        // Upload the file to cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto",
        })
        // Once it's uploaded console log it for confirmation and return the response object
        console.log("File upload to cloudinary successfull", response)
        return response
    } catch (error) {
        // If there's an error, then remove the file from the server and console log the error
        console.error(error);
    } finally {
        // Always remove the file from the server
        fs.unlinkSync(localFilePath)
    }
}

const deleteAssetsOnCloudinary = async (publicId) => {
    try {
        if (!publicId) return;
        // Delete the file from cloudinary
        const response = await cloudinary.uploader.destroy(publicId, {
            resource_type: "auto",
        })
        // Once it's deleted console log it for confirmation and return the response object
        console.log("File deleted from cloudinary successfull", response)
        return response
    } catch (error) {
        // If there's an error, then console log the error
        console.error(error);
    }
}
export { uploadAssetsOnCloudinary, deleteAssetsOnCloudinary };