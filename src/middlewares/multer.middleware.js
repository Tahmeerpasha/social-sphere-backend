import multer from "multer";

const storage = multer.diskStorage({
    destination: function (_, file, cb) {
        console.log("Uploading file....")
        cb(null, process.env.FILE_UPLOAD_PATH);
    },
    filename: function (_, file, cb) {
        cb(null, file.originalname);
    }
})

export const upload = multer({ storage });
