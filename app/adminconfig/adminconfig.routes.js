module.exports = app => {
    const adminconfig = require("./adminconfig.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken, isAdmin, isAdminOrSubadmin } = jwtTokenUtils;
    

   app.post("/configuration", verifyToken, isAdminOrSubadmin, adminconfig.postConfiguration);
   app.put("/configuration/:id", verifyToken,  isAdminOrSubadmin,  adminconfig.updateConfiguration);
   app.get("/configuration", verifyToken, isAdminOrSubadmin, adminconfig.getConfiguration)
   app.get("/admin/dashboard/count", verifyToken, isAdminOrSubadmin, adminconfig.adminDashboardCount)
   app.get("/admin/analytics/alltime", verifyToken, isAdminOrSubadmin, adminconfig.adminAnalyticsAlltime)
   app.get("/admin/analytics/filter/:filterType", verifyToken, isAdminOrSubadmin, adminconfig.adminAnalyticsFilter)
   app.get("/droplet/balance",   adminconfig.getDropletBalance)
}

          
