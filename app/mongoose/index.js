const mongoose = require("mongoose");
mongoose.Promise = global.Promise;
const dotenv=require('dotenv');
dotenv.config();




const db = {};
db.mongoose = mongoose;
db.url = process.env.url;
db.mongoose
  .connect(db.url, { 
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useFindAndModify: false 
  })
  .then(() => {
    console.log("Connected to the my database!");
  })
  .catch(err => {
    console.log("Cannot connect to the database!", err);
    process.exit();
  });

db.profiles = require("../members/members.model.js")(mongoose);
db.auths = require("../members/auth.model.js")(mongoose);
db.ratecalculators = require("../ratecalculator/ratecalculator.model")(mongoose);
db.adminconfigs = require("../adminconfig/adminconfig.model")(mongoose);
db.trades = require("../trades/trades.model")(mongoose);
db.transactions = require("../transactions/transactions.model")(mongoose);
db.withdrawrequests = require("../withdrawrequest/withdrawrequest.model")(mongoose);
db.cointypes = require("../ratecalculator/cointypes.model")(mongoose);
db.notifications = require("../notifications/notifications.model")(mongoose);
module.exports = db;
