import multer from "multer";

const storage = multer.diskStorage({
    destination: function (_, file, cb) {
        console.log("Uploading file....")
        cb(null, "/tmp/");
    },
    filename: function (_, file, cb) {
        cb(null, file.originalname);
    }
})

export const upload = multer({ storage });
