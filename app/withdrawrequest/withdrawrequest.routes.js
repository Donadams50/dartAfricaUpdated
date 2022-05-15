module.exports = app => {
    const withdrawerrequest = require("./withdrawrequest.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken,  isSeller, isSetTransactionPinValid, isAdminOrSubadmin } = jwtTokenUtils;
   
 
        
   app.post("/withdraw",  verifyToken, isSeller, isSetTransactionPinValid,  withdrawerrequest.withdrawFunds)
   app.get("/withdrawer/request",  verifyToken, isAdminOrSubadmin,  withdrawerrequest.getAllWithdrawer)
   app.post("/cancel/withdrawerrequest/:withdrawerrequestId",  verifyToken, isAdminOrSubadmin,  withdrawerrequest.cancelWithdrawerRequest)
   app.post("/manualsuccess/withdrawerrequest/:withdrawerrequestId",  verifyToken, isAdminOrSubadmin,  withdrawerrequest.manualSuccessWithdrawerRequest)
   app.post("/completerequest/flutter/:withdrawerrequestId",  verifyToken, isAdminOrSubadmin,  withdrawerrequest.flutterwaveWithdrawer)
   app.get("/withdrawer/request/:withdrawerrequestId",  verifyToken, isAdminOrSubadmin,  withdrawerrequest.getWithdrawerRequestById)
   app.get("/banks/code/:country",  verifyToken, isSeller,  withdrawerrequest.getBanksCode)
   app.get("/mobilewallet/code",   withdrawerrequest.getMobileWalletCode)
   app.get("/bank/branch/:codeId",  verifyToken, isSeller,  withdrawerrequest.getBankBranch)
   app.post("/flutter/webhook/payment/status/:refence",  withdrawerrequest.updateFlutterResponse)
   app.post("/bank/accountname",   withdrawerrequest.getAccountName)
   
}