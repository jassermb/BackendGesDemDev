const multer = require('multer');
const path = require('path');

const storage = multer.diskStorage({
  destination: './upload',
  filename: (req, file, cb) => {
    const uniqueSuffix = file.originalname.split('.')[0] + '-' + (Date.now() + '-' + Math.round(Math.random() * 1E9)) + path.extname(file.originalname);
    req.Fnameup = uniqueSuffix;
    cb(null, uniqueSuffix);
  }
});

const upload = multer({
  storage: storage
});

module.exports = upload;
