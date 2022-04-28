module.exports = app => {
    const trade = require("./trades.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken, isAdmin, isAdminOrSubadmin, isSeller, VerifySharedSecret, VerifySharedSecretLazerpay} = jwtTokenUtils;
    

       app.post("/trade", verifyToken,   isSeller,  trade.postNewTrade)
       app.get("/seller/trades", verifyToken,   isSeller,  trade.getTradeByUser)
       app.get("/trades", verifyToken,   isAdminOrSubadmin,  trade.getAllTrade)
       app.get("/trades/:tradeId",  verifyToken,   trade.getTradeById)
       app.get("/user/trade/:userId", verifyToken,   isAdminOrSubadmin,  trade.getTradeForAdmin)
       app.post("/webhook/payment/status", VerifySharedSecret,  trade.responseCoinbaseCreateTrade)
       app.post("/resolve/trade", verifyToken,  isAdminOrSubadmin,  trade.resolveTrade)
       app.post("/webhook/lazerpay/status", VerifySharedSecretLazerpay,  trade.responseLazerpayCreateTrade) 

}

