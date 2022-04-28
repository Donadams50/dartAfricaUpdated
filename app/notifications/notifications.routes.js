module.exports = app => {
    const notification = require("./notifications.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken , isAdminOrSubadmin} = jwtTokenUtils;
    

    app.post("/notification", verifyToken, isAdminOrSubadmin,   notification.sendInAppNotification)
  //app.get("/user/notifications", verifyToken,  isExchanger  ,  notification.getNotificationByUser)
    app.post("/device/token",   notification.postDeviceToken)
    app.post("/support",   notification.contactSupport);
  
}

          
