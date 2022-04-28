module.exports = app => {
    const ratecalculator = require("./ratecalculator.controller");
    const jwtTokenUtils = require('../helpers/jwtTokenUtils')
    const { verify ,  verifyToken,isAdminOrSubadmin, isAdmin} = jwtTokenUtils;

    app.post("/rate",  verifyToken, isAdminOrSubadmin,  ratecalculator.createRate)
    app.put("/rate/:id",  verifyToken, isAdminOrSubadmin, ratecalculator.updateRate)
    app.get("/rates/:id",  verify,  ratecalculator.getRateByCoinId)
    app.get("/rates", verify,  ratecalculator.getAllRate)
    app.delete("/rates/:id",  verifyToken, isAdminOrSubadmin,  ratecalculator.deleteRate)


    app.post("/cointype",  verifyToken, isAdminOrSubadmin,  ratecalculator.createCoinType)
    app.get("/cointypes",    ratecalculator.getAllCoins)
    app.get("/cointypes/:id",    ratecalculator.getCoinTypeeByCoinId)

}