const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, "../itsm_Static-main/src/assets/attachments/profile_pictures");
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now();
        const extension = path.extname(file.originalname);
        const basename = path.basename(file.originalname, extension).replace(/\s+/g, '');
        cb(null, `${basename}-${uniqueSuffix}${extension}`);
    }
});

const profile = multer({ storage: storage });

module.exports=profile