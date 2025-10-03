const multer = require('multer');
const path = require('path');

// Configure storage options
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/'); // Define the directory to store uploaded files
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + path.extname(file.originalname)); // Append timestamp to file name
    }
});

// Create the upload middleware
const upload = multer({ storage: storage });

module.exports = upload;
