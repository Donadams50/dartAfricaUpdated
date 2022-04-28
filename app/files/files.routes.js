module.exports = app => {
    const files = require("./files.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken ,  isExchanger, isAdminOrSubadmin, isAdmin } = jwtTokenUtils;
   
    require('../cloudinary/cloudinary.js')
    const upload = require('../cloudinary/multer.js');

    app.post("/profileimage", verifyToken,  upload.single("file"),  files.postProfileImage)


}
  