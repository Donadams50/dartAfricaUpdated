module.exports = app => {
    const member = require("./members.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken, isAdmin, isAdminOrSubadmin, isSeller} = jwtTokenUtils;
    
     app.post("/user/register",  member.createSeller)
     app.post("/subadmin/register", verifyToken,  isAdmin,  member.createSubAdmin)
     app.post("/login", member.signIn)
     app.post("/verifyuser",    member.verifyUser)
     app.post("/forgotpassword",  member.forgotPassword)
     app.post("/resetpassword",    member.resetPassword)
     app.post("/link/verify/forgotpasswordcode" ,      member.verifyForgotpasswordlink)
     app.post("/resendverificationlink",    member.resendVerificationLink)
     app.put("/user", verifyToken, isSeller, member.updateMember)
     app.post("/accountdetails",  verifyToken, isSeller, member.createAccountDetails)
     app.put("/accountdetails/:id",  verifyToken, isSeller,   member.updateAccountDetails)
     app.get("/member/:id",  verifyToken,   member.findMembeById)
     app.post("/changepassword",   verifyToken,  member.ChangePassword)
     app.post("/enableuser", verifyToken, isAdmin ,   member.enableUser)
     app.post("/disableuser", verifyToken, isAdmin ,   member.disableUser)   
     app.get("/users",  verifyToken, isAdminOrSubadmin,   member.findAllMembers)
     app.post("/createpin", verifyToken, isSeller,  member.createPin)
     app.put("/updatepin", verifyToken, isSeller,  member.updatePin)
     app.post("/forgotpin", verifyToken, isSeller,  member.forgotPin)
     app.post("/resetpin",    member.resetPin)
     app.get("/walletbalance",  verifyToken, isSeller,  member.findWalletBalance)
     app.post("/link/verify/pincode" ,  member.verifyForgotpasswordlink)
     app.delete("/accountdetails/:id",  verifyToken, isSeller,   member.deleteAccountDetails)
}


