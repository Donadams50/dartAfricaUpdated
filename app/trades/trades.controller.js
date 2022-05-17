
const db = require("../mongoose");
const Trades = db.trades;
const Members = db.profiles;
const Transactions = db.transactions;
const Ratecalculator = db.ratecalculators;
const sendemail = require('../helpers/emailhelper.js');
const Notifications = db.notifications;
const moment  = require('moment')
const cron =  require('node-cron') 
const mongoose = require("mongoose");
const dotenv=require('dotenv');
dotenv.config();

const axios = require('axios');


// Create new trade
exports.postNewTrade = async(req, res) => {
  
    const {  coinType , amounttInCoin  , narration, amountInLocalCurrency , country, amountInUsd} = req.body;
    
    if ( coinType && amounttInCoin  && narration && amountInLocalCurrency && country  && amountInUsd ){
        if ( coinType ==="" || amounttInCoin==="" || narration==="" || amountInLocalCurrency===""  ||  country === "" || amountInUsd === ""){
            res.status(400).send({
               status:400,
                message:"Incorrect entry format"
            });
        }else{
            try{     
                 if(coinType === "BUSD" || coinType === "USDT"){
                  var savelazerpaypaymet = await lazerPayTrade(coinType , amountInUsd, req.user.username, req.user.email)
                      if(savelazerpaypaymet.statusCode === 201 && savelazerpaypaymet.status === "success"){
                        const trades = new Trades({      
                          tradeStatus: "Created",
                          userId: req.user.id,
                          userDetails: req.user.id,
                          walletAddress : savelazerpaypaymet.data.address,
                          amounttInCoin: amounttInCoin,
                          coinType: coinType,
                          narration:  narration || "",
                          amountInLocalCurrency : amountInLocalCurrency,
                          country: req.user.countryTag,    
                          uniqueId: savelazerpaypaymet.data.reference,
                          
                        });
                          const emailList = await Members.find({ $or: [ { role: "Admin" }, { role: "SubAdmin" } ] })
  
                          const saveTrade = await  trades.save()
                          emailList.map(email => {
                             from = {
                                        name: process.env.emailName,
                                        address: process.env.user	
                                }
                            const emailFrom = from; 
                            const subject = 'New Trade Alert';                      
                            const hostUrl =  process.env.adminUrl
                            const hostUrl2 =   process.env.adminUrl2
                            const username = "Admin"
                            const   text = "A new trade has just been created, Please login to your dashboard to view this" 
                            const emailTo = email.email;
                            const link = `${hostUrl}`;
                            const link2 = `${hostUrl2}`;
                            processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                          });
  
                          res.status(201).send({ status:201,message:{ walletAddress : savelazerpaypaymet.data.address, uniqueId: savelazerpaypaymet.data.reference,
                            code: "" ,
                            hostedUrl: "", coinType: coinType, }})
                      }else{
                        res.status(400).send({ status:400, message:"Error from Lazerpay "})
                      }

                 }else{
                  const headers = {
                    'Content-Type': 'application/json',
                    'X-CC-Api-Key':  process.env.COINBASE_API_KEY,
                    'X-CC-Version': "2018-03-22"
                    }

                   params = {
                    name: "Receive payment",
                    description: "Receive payment",
                  
                    pricing_type: "no_price",
                    metadata: {
                      customer_id: req.user.id,
                      customer_name:  req.user.username
                    },
                    
                  }
                  const  getAddress = await axios.post('https://api.commerce.coinbase.com/charges', params, {headers: headers})
                  if(getAddress.status === 201){

                  
                        if(coinType === "BTC"){
                           address = getAddress.data.data.addresses.bitcoin
                          }else if(coinType === "ETH"){
                           address = getAddress.data.data.addresses.ethereum
                        }else if(coinType === "LTC"){
                          address = getAddress.data.data.addresses.litecoin
                        }else if(coinType === "DOGE"){
                          address = getAddress.data.data.addresses.dogecoin
                        }else if(coinType === "DAI"){
                          address = getAddress.data.data.addresses.dai
                        }else if(coinType === "BITCOINCASH"){
                          address = getAddress.data.data.addresses.bitcoincash
                        }else if(coinType === "USDC"){
                          address = getAddress.data.data.addresses.usdc
                        }else{
                              address = getAddress.data.data.addresses.bitcoin
                        }
                        const trades = new Trades({      
                        tradeStatus: "Created",
                        userId: req.user.id,
                        userDetails: req.user.id,
                        walletAddress : address,
                        amounttInCoin: amounttInCoin,
                        coinType: coinType,
                        narration:  narration || "",
                        amountInLocalCurrency : amountInLocalCurrency,
                        country: req.user.countryTag,    
                        uniqueId: getAddress.data.data.id,
                        code: getAddress.data.data.code ,
                        hostedUrl: getAddress.data.data.hosted_url  
                      });
                        const emailList = await Members.find({ $or: [ { role: "Admin" }, { role: "SubAdmin" } ] })

                        const saveTrade = await  trades.save()
                        emailList.map(email => {
                           from = {
                                      name: process.env.emailName,
                                      address: process.env.user	
                              }
                          const emailFrom = from; 
                          const subject = 'New Trade Alert';                      
                          const hostUrl =  process.env.adminUrl
                          const hostUrl2 =   process.env.adminUrl2
                          const username = "Admin"
                          const   text = "A new trade has just been created, Please login to your dashboard to view this" 
                          const emailTo = email.email;
                          const link = `${hostUrl}`;
                          const link2 = `${hostUrl2}`;
                          processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                        });

                        res.status(201).send({ status:201,message:{ walletAddress : address, uniqueId: getAddress.data.data.id,
                          code: getAddress.data.data.code ,
                          hostedUrl: getAddress.data.data.hosted_url, coinType: coinType, }})
                }else{
                  res.status(400).send({ status:400, message:"Error from coinbase "})
                }
              }
            }catch(err){
                console.log(err) 
                if(getAddress.status === 429){
                  res.status(429).send({ status:429, message:"Error while creating trade "})
                }else{
                  res.status(500).send({ status:500, message:"Error while creating trade "})
                }
            }
        }
    }else{
        res.status(400).send({
          status:400,
            message:"Incorrect entry format"
        });
    }
};

// get all trade by query parameter
exports.getTradeByUser = async (req, res) => {
  try{
     
      
      //const{ status}= req.query
        const query = getQuery({ ...req.query }, req.user.id)
        
       // console.log(query)
          const findTrade = await Trades.find(query).sort({"_id": -1})
          .populate('userDetails')
          res.status(200).send( {status:200, message: findTrade})
  }catch(err){
         console.log(err)
         res.status(500).send({status:500,message:"Error while getting all users "})
     }
};

// get all trade by query parameter
exports.getAllTrade = async (req, res) => {
    try{

            const query = getQueryNoAmount({ ...req.query })
  
            const findAllTrades = await Trades.find(query).sort({"_id": -1})
            .populate('userDetails')
            
            res.status(200).send( {status:200, findAllTrades})
        
        
      
       }catch(err){
           console.log(err)
           res.status(500).send({ status:500,message:"Error while getting all users "})
       }
};

// get trade by id
exports.getTradeById = async (req, res) => {
  try{
          const tradeId= req.params.tradeId
          const findTradeById = await Trades.findOne({_id: tradeId})
          .populate('userDetails' , { username: 1 })
          res.status(200).send( {status:200, findTradeById})

     }catch(err){
         console.log(err)
         res.status(500).send({ status:500,message:"Error while getting trade by id "})
     }
};
// update trade status from coinbase
exports.responseCoinbaseCreateTrade = async(req, res) => {
    const {  event, scheduled_for} = req.body;
     console.log("event data")
     console.log(event.data)
     console.log(event.type)
    try{
        getTrade = await Trades.findOne({uniqueId: event.data.id})
        console.log("trade details")
        console.log(getTrade)
         _id = getTrade._id;
        if(getTrade.tradeStatus === "Created"  || getTrade.tradeStatus === "Failed" ){
            if (event.type === "charge:created"  ){
                console.log("i am created")
                res.status(200).send()
                
            }else if (event.type === "charge:confirmed")
            {

                  
                  console.log("i am confirmed")
                  console.log(event.data.payments)
                  console.log(event.data.payments[0].value.crypto.amount)
                  console.log(event.data.payments[0].value.crypto.currency)
                  coinBaseAmount = event.data.payments[0].value.crypto.amount
                  coinBaseCurrency = event.data.payments[0].value.crypto.currency
                  const updateTradeStatus = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Confirmed" });    
                  getSellersDetails = await Members.findOne({_id:getTrade.userId}, )
                  rate = await Ratecalculator.findOne({coinType: coinBaseCurrency})

                 console.log(rate)
                  tradeAmountInUsd  = parseFloat(coinBaseAmount) * parseFloat(rate.usdRateCoin) 
                  console.log(tradeAmountInUsd)
                  if(getTrade.country === "GH"){
                      rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                      if( typeof rateInLocalCurrencyObject === 'undefined'){
                          //console.log(rate.localCurrencyRate[localCurrencyRate.length - 1])
                          var rateInLocalCurrency = rate.localCurrencyRate[rate.localCurrencyRate.length - 1].cedisRateUsd
                      }else{
                          var rateInLocalCurrency = rateInLocalCurrencyObject.cedisRateUsd
                      }

                  }else if(getTrade.country === "NG"){
                      rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                      if( typeof rateInLocalCurrencyObject === 'undefined'){
                          // console.log(localCurrencyRate[localCurrencyRate.length - 1])
                          var rateInLocalCurrency = rate.localCurrencyRate[rate.localCurrencyRate.length - 1].ngnRateUsd
                      }else{
                         // console.log(x)
                          var rateInLocalCurrency = rateInLocalCurrencyObject.ngnRateUsd
                      }
                  }

                  tradeAmount = parseFloat(coinBaseAmount) * parseFloat(rate.usdRateCoin) * parseFloat(rateInLocalCurrency)
                  const finalBalance =  parseFloat(getSellersDetails.walletBalance) + parseFloat(tradeAmount)

                  transaction = new Transactions({ 
                    amount: tradeAmount.toFixed(2),
                    tradeId: _id,
                    tradeDetails: _id,
                    sellerId: getSellersDetails._id,
                    sellerDetails: getSellersDetails._id,
                    initialBalance: getSellersDetails.walletBalance ,
                    finalBalance: finalBalance.toFixed(2),
                    status : "Successful", 
                    type: "Credit"           
                  })
                  const postTransaction = await  transaction.save()

                   if(postTransaction){
                          
                         const updateTrade= await Trades.updateOne({ _id : _id }, { coinType: coinBaseCurrency, amounttInCoin: coinBaseAmount, amountInLocalCurrency: tradeAmount.toFixed(2), amountInUSD: tradeAmountInUsd.toFixed(2) }); 
                         const updateWallet= await Members.updateOne({ _id: getSellersDetails._id }, {walletBalance: finalBalance.toFixed(2)}); 
                         fundReferredByWallet(getSellersDetails)
                       
                  
                         from = {
                              name: process.env.emailName,
                              address: process.env.user	
                          }
                         const emailFrom = from;
                          const subject = 'Wallet credited';                      
                          const hostUrl = process.env.hostUrl
                          const hostUrl2 = process.env.hostUrl2  
                          const username =  getSellersDetails.username
                          const   text = `Your wallet has been credited with  GHS ${tradeAmount.toFixed(2)}` 
                          const emailTo = getSellersDetails.email
                          const link = `${hostUrl}`;
                          const link2 = `${hostUrl2}`;
                          processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                          res.status(200).send({status:200, message:"Success"})
                   }else{
                       res.status(200).send()
                   }

            }else if  (event.type === "charge:failed"  ) {
                console.log("i am failed")
                const updatePaymentStatus = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Failed" });  
                res.status(200).send()

            }else if  (event.type === "charge:delayed" || event.type === "charge:underpaid" || event.type === "charge:overpaid" || event.type === "charge:manual" || event.type === "charge:multiple" || event.type === "charge:other" ) {
                console.log("i am unreolve")
                const updatePaymentStatus = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Unresolved" });  
                res.status(200).send()

            }else if  (event.type === "charge:pending"  ) {
              console.log("i am pending") 
              console.log(event.data.payments[0].value.crypto.amount)
              console.log(event.data.payments[0].value.crypto.currency)
              // coinBaseAmount = event.data.payments[0].value.crypto.amount
              // coinBaseCurrency = event.data.payments[0].value.crypto.currency
              
            
              res.status(200).send()

            }else{
              console.log("i am nothing")
              res.status(200).send()
            }
      
        }else if (getTrade.tradeStatus === "Unresolved"){
              console.log("This trade must be resolved by admin")
              res.status(200).send()
        // }else if (getTrade.tradeStatus === "Failed"){
        //   console.log("This trade is failed already you cannot update it")
        //   res.status(200).send()
        // }else if (getTrade.tradeStatus === "Confirmed"){
          console.log("This trade has been completed, you cant alter it again")
          res.status(200).send()
        }else{
              console.log("This trade has been completed or Invalid")
              res.status(200).send()
        } 
        //await sess.commitTransaction()
        //sess.endSession();
    }catch(err){
        console.log(err)
        res.status(500).send({message:"Error while completing trade "})
    }
};


// resolve trade with issue
exports.resolveTrade = async(req, res) => {
  
  const { tradeId } = req.body;
  
  if (tradeId ){
      if ( tradeId ==="" ){
          res.status(400).send({
             status:400,
              message:"Incorrect entry format"
          });
      }else{
          try{     
            params= {

            }
            // const sess = await mongoose.startSession()
            // sess.startTransaction()
                const headers = {
                  'Content-Type': 'application/json',
                  'X-CC-Api-Key':  process.env.COINBASE_API_KEY,
                  'X-CC-Version': "2018-03-22"
                }
                const getTrade = await Trades.findOne({_id:tradeId})
                if(getTrade.tradeStatus === "Unresolved"){
                      const charge_code = getTrade.code
                      const charge_id = getTrade.uniqueId
                      const  resolvetrade = await axios.post(`https://api.commerce.coinbase.com/charges/${charge_code}/resolve`, params, {headers: headers})
                   //   console.log( resolvetrade.data.data)
                      console.log(resolvetrade.status)
                      if(resolvetrade.status === 200){
                                          // console.log(resolvetrade.data.data.payments)
                                          // console.log(resolvetrade.data.data.payments[0].value.crypto.amount)
                                          // console.log(resolvetrade.data.data.payments[0].value.crypto.currency)
                                          coinBaseAmount = resolvetrade.data.data.payments[0].value.crypto.amount
                                          coinBaseCurrency = resolvetrade.data.data.payments[0].value.crypto.currency
                                           const _id = tradeId
                                          const updateTradeStatus = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Confirmed" });    
                                          getSellersDetails = await Members.findOne({_id:getTrade.userId}, )
                                          rate = await Ratecalculator.findOne({coinType: coinBaseCurrency})
                                        

                                          if(getTrade.country === "GH"){
                                            rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                                            if( typeof rateInLocalCurrencyObject === 'undefined'){
                                                console.log(localCurrencyRate[localCurrencyRate.length - 1])
                                                var rateInLocalCurrency = localCurrencyRate[localCurrencyRate.length - 1].cedisRateUsd
                                            }else{
                                                var rateInLocalCurrency = rateInLocalCurrencyObject.cedisRateUsd
                                            }
                      
                                        }else if(getTrade.country === "NG"){
                                            rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                                            if( typeof rateInLocalCurrencyObject === 'undefined'){
                                                console.log(localCurrencyRate[localCurrencyRate.length - 1])
                                                var rateInLocalCurrency = localCurrencyRate[localCurrencyRate.length - 1].ngnRateUsd
                                            }else{
                                                console.log(x)
                                                var rateInLocalCurrency = rateInLocalCurrencyObject.ngnRateUsd
                                            }
                                        }
                                          tradeAmount = parseFloat(coinBaseAmount) * parseFloat(rate.usdRateCoin) * parseFloat(rateInLocalCurrency)
                                          tradeAmountInUsd  = parseFloat(coinBaseAmount) * parseFloat(rate.usdRateCoin) 
                                          const finalBalance =  parseFloat(getSellersDetails.walletBalance) + parseFloat(tradeAmount)
                                          transaction = new Transactions({ 
                                            amount: tradeAmount.toFixed(2),
                                            tradeId: _id,
                                            tradeDetails: _id,
                                            sellerId: getSellersDetails._id,
                                            sellerDetails: getSellersDetails._id,
                                            initialBalance: getSellersDetails.walletBalance ,
                                            finalBalance: finalBalance.toFixed(2),
                                            status : "Successful", 
                                            type: "Credit",
                                            narration: "Trade resolved"       
                                          })
                                          const postTransaction = await  transaction.save()

                                            if(postTransaction){
                                                  
                                                  const updateTradeCedis= await Trades.updateOne({ _id : _id }, { coinType: coinBaseCurrency, amounttInCoin: coinBaseAmount, amountInLocalCurrency: tradeAmount.toFixed(2), amountInUSD: tradeAmountInUsd.toFixed(2) }); 
                                                  const updateWallet= await Members.updateOne({ _id: getSellersDetails._id }, {walletBalance: finalBalance.toFixed(2)}); 
                                                  fundReferredByWallet(getSellersDetails)  
                                                  from = {
                                                      name: process.env.emailName,
                                                      address: process.env.user	
                                                  }
                                                  const emailFrom = from;
                                                  const subject = 'Wallet credited';                      
                                                  const hostUrl = process.env.hostUrl
                                                  const hostUrl2 = process.env.hostUrl2  
                                                  const username =  getSellersDetails.username
                                                  const   text = `Your wallet has been credited with  GHS ${tradeAmount.toFixed(2)}` 
                                                  const emailTo = getSellersDetails.email
                                                  const link = `${hostUrl}`;
                                                  const link2 = `${hostUrl2}`;
                                                  processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                  res.status(200).send({status:200, message:"Trade resolved successfully"})
                                            }else{
                                                res.status(200).send()
                                            }
                                        
                                              
                      }else{
                          res.status(400).send({ status:400, message:"Error from coinbase while resolving trade "})
                      }
                }else{
                    res.status(400).send({ status:400, message:"This trade is not in an Unresolved state, there by cannot be resolved"})
                }

              
          }catch(err){
              console.log(err)
              res.status(500).send({ status:500, message:"Error while creating trade "})
          }
      }
  }else{
      res.status(400).send({
        status:400,
          message:"Incorrect entry format"
      });
  }
};


const getQuery = (queryObj, userId) =>{
 console.log(queryObj)
  if(queryObj.amount){
        let monthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD');
        let today = moment(new Date()).format('YYYY-MM-DD');
        let {  from_date=monthAgo, to_date=today, status= /.*/ , amount} = queryObj
        if(status==="All"){
            status = /.*/
        }
        
        if(queryObj.amount === "All"){
          const query = { userId: userId, tradeStatus:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
          console.log(" amount all")
          return query

        }else{ 
            finalAmount = parseFloat(amount)
            console.log(finalAmount)
            console.log(" amount")
          const query = { amountInLocalCurrency: finalAmount, userId: userId, tradeStatus:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
          
          return query
        }
  }else{
        let monthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD');
        let today = moment(new Date()).format('YYYY-MM-DD');
        let {  from_date=monthAgo, to_date=today, status= /.*/ } = queryObj
        if(status==="All"){
            status = /.*/
        }
    const query = { userId: userId, tradeStatus:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
    console.log("no amount")
    return query
  }
  
}

const getQueryNoAmount = (queryObj) =>{

         let monthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD');
         let today = moment(new Date()).format('YYYY-MM-DD');
         let {  from_date=monthAgo, to_date=today, status= /.*/ } = queryObj
         if(status==="All"){
             status = /.*/
         }
     const query = { tradeStatus:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
     return query
   
   
 }


// get trade by a user
exports.getTradeForAdmin = async (req, res) => {
  try{
   
     const dateType = req.query.time;
     const userId = req.params.userId;
     if(dateType === "today"){
      console.log("today")
      fromDate = moment().startOf('day').format('YYYY-MM-DD 00:00:01');
      toDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
     
      }else if(dateType === "week"){
              console.log("week")
              fromDate = moment().startOf('week').format('YYYY-MM-DD 00:00:01');
              toDate = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss');
                     
      }else if(dateType === "month"){
              console.log("month")     
              fromDate = moment().startOf('month').format('YYYY-MM-DD 00:00:01');
              toDate = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
                        
      }else if(dateType === "year"){
              console.log("year")
              fromDate = moment().startOf('year').format('YYYY-MM-DD 00:00:01');
              toDate = moment().endOf('year').format('YYYY-MM-DD HH:mm:ss');
                     
      }else{
              fromDate = moment().startOf('day').format('YYYY-MM-DD 00:00:01');
              toDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
             
      }
          const getUserTrade = await Trades.find({userId:userId,  createdAt:{ $gte: new Date(new Date(fromDate).setHours(00, 00, 00)), $lte: new Date(new Date(toDate).setHours(23, 59, 59)) } }).sort({"_id": -1})  
          .populate('userDetails')
          
          
     
  
           res.status(200).send(getUserTrade)
            
     }catch(err){
         console.log(err)
         res.status(500).send({message:"Error while getting trade "})
     }
};



exports.declineTrade = async(req, res) => {
  
    try{
                  
  
              const _id = req.params.tradeId;
             
              
            getTrade = await Trades.findOne({_id: _id})
            //console.log(getTrade)
           if(getTrade.tradeStatus === "Pending"  &&  (getTrade.paymentStatus === "Not Initiated" || getTrade.paymentStatus === "Failed")){
           
            




            getExchangerDetails = await Members.findOne({_id:getTrade.userId}, )

             const postIsComplete = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Declined" });  

             
                notify = new Notifications({      
                    userId: getExchangerDetails._id,
                    userDetails: getExchangerDetails._id,
                    title: "Giftcard Declined",
                    isRead: false,
                    message : "Your giftcard has been rejected"                                              
                  })
           
            const postNotification = await  notify.save()
            
             from = {
              name: process.env.emailName,
              address: process.env.user	
          }
             const emailFrom = from;
             const subject = 'Trade status';                      
             const hostUrl = process.env.hostUrl
              const hostUrl2 = process.env.hostUrl2  
             const username =  getExchangerDetails.firstName
             const   text = "Your trade has been decliined" 
             const emailTo = getExchangerDetails.email
             const link = `${hostUrl}`;
             const link2 = `${hostUrl2}`;
              processEmail(emailFrom, emailTo, subject, link, link2, text, username);

               res.status(200).send({message:"Succesfull" })
            }else{
                res.status(400).send({message:"This trade has been completed or Invalid"})
            }
        

   
    }catch(err){
        console.log(err)
        res.status(500).send({message:"Error while completing trade "})
    }

};
 // Count dashboard count 


exports.graphExchanger = async (req, res) => {
    try{
     //   const status = "Initiated"
       const dateType = req.query.time
      
       if(dateType === "today"){
        fromDate = moment().startOf('day').format('YYYY-MM-DD 00:00:01');
        toDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
        
        }else if(dateType === "week"){
                console.log("week")
                fromDate = moment().startOf('week').format('YYYY-MM-DD 00:00:01');
                toDate = moment().endOf('week').format('YYYY-MM-DD HH:mm:ss');
                        
             }else if(dateType === "month"){
                console.log("month")
                fromDate = moment().startOf('month').format('YYYY-MM-DD 00:00:01');
                toDate = moment().endOf('month').format('YYYY-MM-DD HH:mm:ss');
                  
            }else if(dateType === "year"){
                console.log("year")
                fromDate = moment().startOf('year').format('YYYY-MM-DD 00:00:01');
                toDate = moment().endOf('year').format('YYYY-MM-DD HH:mm:ss');
                      
            }else{
                fromDate = moment().startOf('day').format('YYYY-MM-DD 00:00:01');
                toDate = moment().endOf('day').format('YYYY-MM-DD HH:mm:ss');
            }
            const getGraph = await Trades.find({ tradeStatus: "Completed",  updatedAt:{ $gte: new Date(new Date(fromDate).setHours(00, 00, 00)), $lte: new Date(new Date(toDate).setHours(23, 59, 59)) } }).select('amount -_id').select(' updatedAt -_id').sort({"_id": 1})  
          
  
           
             res.status(200).send(getGraph)
              
       }catch(err){
           console.log(err)
           res.status(500).send({message:"Error while getting loan request "})
       }
};



cron.schedule("0 0 */1 * * *", async () => {
  console.log("runs every one hour")  
   const coins = [
     {
      coinName: "bitcoin",
      coinSymbol: "BTC"
     } ,{
       coinName: "ethereum",
       coinSymbol: "ETH"
     },
     {
       coinName: "litecoin",
       coinSymbol: "LTC"
     },
     {
       coinName: "dogecoin",
       coinSymbol: "DOGE"

     },
     {
      coinName: "usd-coin",
      coinSymbol: "USDC"
    },
    {
      coinName: "dai",
      coinSymbol: "DAI"
    },
    {
      coinName: "binance-usd",
      coinSymbol: "BUSD"
   },
   {
    coinName: "tether",
    coinSymbol: "USDT"
   }
 ]

  try {

      for (let i =0; i < coins.length; i++){
        const  getPrice = await axios.get("https://api.coingecko.com/api/v3/simple/price?ids="+coins[i].coinName+"&vs_currencies=usd");
           if( coins[i].coinName === "bitcoin"){
             console.log(getPrice.data.bitcoin.usd)
             currentPrice = getPrice.data.bitcoin.usd
           }else if( coins[i].coinName === "ethereum"){
            console.log(getPrice.data.ethereum.usd) 
            currentPrice = getPrice.data.ethereum.usd
          }
         else if( coins[i].coinName === "usd-coin"){
            console.log(getPrice.data['usd-coin'].usd)
            currentPrice = getPrice.data['usd-coin'].usd
           }
           else if( coins[i].coinName === "litecoin"){
            console.log(getPrice.data.litecoin.usd)  
            currentPrice = getPrice.data.litecoin.usd
           }
          else if( coins[i].coinName === "dogecoin"){
            console.log(getPrice.data.dogecoin.usd)  
            currentPrice = getPrice.data.dogecoin.usd
          }else if( coins[i].coinName === "dai"){
            console.log(getPrice.data.dai.usd)   
              currentPrice = getPrice.data.dai.usd
          }else if( coins[i].coinName === "binance-usd"){
              console.log(getPrice.data['binance-usd'].usd)
              currentPrice = getPrice.data['binance-usd'].usd
          }else if( coins[i].coinName === "tether"){
              console.log(getPrice.data.tether.usd)   
              currentPrice = getPrice.data.tether.usd
          }

        const updatePrice= await Ratecalculator.updateOne({ coinType : coins[i].coinSymbol }, { usdRateCoin: currentPrice}); 
       // console.log(updatePrice)  
       
      }

  } catch (err) {
      console.log(err)
  }
});


// process email one
async function processEmail(emailFrom, emailTo, subject, link, link2, text, fullName){
    try{
        //create org details
        // await delay();
       const sendmail =  await sendemail.emailUtility(emailFrom, emailTo, subject, link, link2, text, fullName);
     //  console.log(sendmail)
        return sendmail
    }catch(err){
        console.log(err)
        return err
    }
   
  }  

const fundReferredByWallet = async (sellerDetails) => {
  console.log("i enter find reffered by")
    try {
      const findTrade = await Trades.find({userId : sellerDetails._id, tradeStatus: "Confirmed"})
      console.log(findTrade.length)
      if(sellerDetails.countryTag === "GH"){
        if(sellerDetails.referredBy && sellerDetails.referralBonusCount < process.env.totalRedeemableBonusCountGH && sellerDetails.referralBonusAmount < process.env.totalRedeemableBonusAmountGH && findTrade.length === 1 ){
          getReferredByDetails  =   await Members.findOne({_id:sellerDetails.referredBy})
          const initialBalance = parseFloat(getReferredByDetails.walletBalance)
          const amount=  parseFloat(process.env.referralBonusGH)
          const finalBalance =  initialBalance + amount
          const referralBonusCount = parseFloat(getReferredByDetails.referralBonusCount) + 1
          const referralBonusAmount=  parseFloat(getReferredByDetails.referralBonusAmount) + amount
          transaction = new Transactions({ 
            amount: amount.toFixed(2),
            sellerId: getReferredByDetails._id,
            sellerDetails: getReferredByDetails._id,
            initialBalance: initialBalance,
            finalBalance: finalBalance.toFixed(2),
            status : "Successful", 
            type: "Credit",
            narration: "Referral Bonus"         
          })
          const postTransaction = await  transaction.save()
          const updateRefferedBy= await Members.updateOne({ _id: getReferredByDetails._id }, {walletBalance: finalBalance.toFixed(2),referralBonusCount: referralBonusCount,referralBonusAmount: referralBonusAmount}); 
          await Members.updateOne(
            { _id: getReferredByDetails._id }, 
            { $addToSet: {"referralBonusUsers" : sellerDetails._id } }
         )
        }
        console.log("i gave referral money gh" )
   }else if(sellerDetails.countryTag === "NG"){
        if(getSellersDetails.referredBy && getSellersDetails.referralBonusCount < process.env.totalRedeemableBonusCountNG && getSellersDetails.referralBonusAmount < process.env.totalRedeemableBonusAmountNG  && findTrade.length === 1){
          getReferredByDetails  =   await Members.findOne({_id:sellerDetails.referredBy})
          const initialBalance = parseFloat(getReferredByDetails.walletBalance)
          const amount=  parseFloat(process.env.referralBonusNG)
          const finalBalance =  initialBalance + amount
          const referralBonusCount = parseFloat(getReferredByDetails.referralBonusCount) + 1
          const referralBonusAmount=  parseFloat(getReferredByDetails.referralBonusAmount) + amount
          transaction = new Transactions({ 
            amount: amount.toFixed(2),
            sellerId: getReferredByDetails._id,
            sellerDetails: getReferredByDetails._id,
            initialBalance: initialBalance,
            finalBalance: finalBalance.toFixed(2),
            status : "Successful", 
            type: "Credit",
            narration: "Referral Bonus"         
          })
          const postTransaction = await  transaction.save()
          const updateRefferedBy= await Members.updateOne({ _id: getReferredByDetails._id }, {walletBalance: finalBalance.toFixed(2),referralBonusCount: referralBonusCount,referralBonusAmount: referralBonusAmount}); 
           await Members.updateOne(
            { _id: getReferredByDetails._id }, 
            { $addToSet: { "referralBonusUsers": sellerDetails._id } }
         )

        }
        console.log("i gave referral money ng" )
   }
        
   console.log("i no give referral money at all" )
  } catch (err) { 
      console.log(err)
      return err
    }
  };


 

  const lazerPayTrade = async (coinType ,amountInUsd, customerName, customerEmail) => {
    try {
         console.log("lazerpay")
         const headers = {
          'x-api-key': process.env.LAZER_PUBLIC_KEY,
          'Content-Type': 'application/json'      
          }
          const codeGenerated =  getCode();
          const finalReference = Date.now() + codeGenerated
          console.log(finalReference)
          const params = {
            reference: finalReference, // Replace with a reference you generated
            customer_name: customerName,
            customer_email: customerEmail,
            coin: coinType,
            currency: 'USD',
            amount: amountInUsd,
            accept_partial_payment: true // By default it's false
          }
          const  createTrade = await axios.post(process.env.lazerPayBaseUrl, params, {headers: headers}) 
          console.log(createTrade)
           return createTrade.data
    
   } catch (error) {
        console.log(error);
        return error
   }
    
  };


exports.responseLazerpayCreateTrade = async(req, res) => {
  
    console.log(req.body)
    const {  reference, status, coin, amountPaid} = req.body;
    try{
      
        getTrade = await Trades.findOne({uniqueId: reference})
        console.log("trade details")
        console.log(getTrade)
         _id = getTrade._id;
        if(getTrade.tradeStatus === "Created"  || getTrade.tradeStatus === "Failed" ){
           if (status === "confirmed"){
                  console.log("i am confirmed")
                  lazerpayAmount = amountPaid
                  lazerpayCurrency = coin
                  const updateTradeStatus = await Trades.findOneAndUpdate({ _id }, { tradeStatus: "Confirmed" });    
                  getSellersDetails = await Members.findOne({_id:getTrade.userId}, )
                  rate = await Ratecalculator.findOne({coinType: lazerpayCurrency})

                 console.log(rate)
                  tradeAmountInUsd  = parseFloat(lazerpayAmount) * parseFloat(rate.usdRateCoin) 
                  console.log(tradeAmountInUsd)
                  if(getTrade.country === "GH"){
                      rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                      if( typeof rateInLocalCurrencyObject === 'undefined'){
                          console.log(rate.localCurrencyRate[rate.localCurrencyRate.length - 1])
                          var rateInLocalCurrency = rate.localCurrencyRate[rate.localCurrencyRate.length - 1].cedisRateUsd
                      }else{
                          var rateInLocalCurrency = rateInLocalCurrencyObject.cedisRateUsd
                      }
                  }else if(getTrade.country === "NG"){
                      rateInLocalCurrencyObject =  rate.localCurrencyRate.find(x =>  tradeAmountInUsd >= x.minimumUsdValue  && tradeAmountInUsd <= x.maximumUsdValue)
                      if( typeof rateInLocalCurrencyObject === 'undefined'){
                          console.log(rate.localCurrencyRate[rate.localCurrencyRate.length - 1])
                          var rateInLocalCurrency = rate.localCurrencyRate[rate.localCurrencyRate.length - 1].ngnRateUsd
                      }else{
                         // console.log(x)
                          var rateInLocalCurrency = rateInLocalCurrencyObject.ngnRateUsd
                      }
                  }

                  tradeAmount = parseFloat(lazerpayAmount) * parseFloat(rate.usdRateCoin) * parseFloat(rateInLocalCurrency)
                  const finalBalance =  parseFloat(getSellersDetails.walletBalance) + parseFloat(tradeAmount)

                  transaction = new Transactions({ 
                    amount: tradeAmount.toFixed(2),
                    tradeId: _id,
                    tradeDetails: _id,
                    sellerId: getSellersDetails._id,
                    sellerDetails: getSellersDetails._id,
                    initialBalance: getSellersDetails.walletBalance ,
                    finalBalance: finalBalance.toFixed(2),
                    status : "Successful", 
                    type: "Credit"           
                  })
                  const postTransaction = await  transaction.save()

                   if(postTransaction){
                          
                         const updateTradeCedis= await Trades.updateOne({ _id : _id }, { coinType: lazerpayCurrency, amounttInCoin: lazerpayAmount, amountInLocalCurrency: tradeAmount.toFixed(2), amountInUSD: tradeAmountInUsd.toFixed(2) }); 
                         const updateWallet= await Members.updateOne({ _id: getSellersDetails._id }, {walletBalance: finalBalance.toFixed(2)}); 
                         fundReferredByWallet(getSellersDetails)   
                         
                         from = {
                              name: process.env.emailName,
                              address: process.env.user	
                          }
                         const emailFrom = from;
                          const subject = 'Wallet credited';                      
                          const hostUrl = process.env.hostUrl
                          const hostUrl2 = process.env.hostUrl2  
                          const username =  getSellersDetails.username
                          const   text = `Your wallet has been credited with  GHS ${tradeAmount.toFixed(2)}` 
                          const emailTo = getSellersDetails.email
                          const link = `${hostUrl}`;
                          const link2 = `${hostUrl2}`;
                          processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                          res.status(200).send({status:200, message:"Success"})
                   }else{
                       res.status(200).send()
                   }

            }else{
              console.log("i am nothing")
              res.status(200).send()
            }
      
        }else if (getTrade.tradeStatus === "Unresolved"){
              console.log("This trade must be resolved by admin")
              res.status(200).send()
        // }else if (getTrade.tradeStatus === "Failed"){
        //   console.log("This trade is failed already you cannot update it")
        //   res.status(200).send()
        // }else if (getTrade.tradeStatus === "Confirmed"){
          console.log("This trade has been completed, you cant alter it again")
          res.status(200).send()
        }else{
              console.log("This trade has been completed or Invalid")
              res.status(200).send()
        } 
    }catch(err){
        console.log(err)
        res.status(500).send({message:"Error while completing trade "})
    }
};




  //generate 6 alphanumeric code
  function getCode(){
      var numbers = "0123456789";
  
      var chars= "abcdefghijklmnopqrstuvwxyz";
    
      var code_length = 6;
      var number_count = 3;
      var letter_count = 3;
    
      var code = '';
    
      for(var i=0; i < code_length; i++) {
         var letterOrNumber = Math.floor(Math.random() * 2);
         if((letterOrNumber == 0 || number_count == 0) && letter_count > 0) {
            letter_count--;
            var rnum = Math.floor(Math.random() * chars.length);
            code += chars[rnum];
         }
         else {
            number_count--;
            var rnum2 = Math.floor(Math.random() * numbers.length);
            code += numbers[rnum2];
         }
      }
  return code
  }