module.exports = app => {
    const transaction = require("./transactions.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verifyToken,  isSeller, isAdmin, isAdminOrSubadmin } = jwtTokenUtils;
    // require('../cloudinary/cloudinary.js')
    // const upload = require('../cloudinary/multer.js');
 
        
   app.get("/transactions/seller",  verifyToken,  isSeller, transaction.getUserTransactionHistory)
   app.get("/transactions/admin",  verifyToken,  isAdminOrSubadmin, transaction.getAllTransactionHistory)
   app.get("/user/transactions/:sellerId", verifyToken,   isAdminOrSubadmin,  transaction.getTransactionsOfUserForAdmin)
  // app.patch("/direct/credit/trade", verifyToken,  isAdmin,  transaction.directCreditTrade)
   //app.patch("/credit/wallet", verifyToken,  isAdmin,  transaction.directCredit)
   app.patch("/direct/debit", verifyToken,  isAdmin,  transaction.directDebit)

}