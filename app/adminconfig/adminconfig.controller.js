const db = require("../mongoose");
const Adminconfig = db.adminconfigs;
const Members = db.profiles;
const Trades = db.trades;
const Withdrawrequest = db.withdrawrequests
const axios = require('axios');
const moment  = require('moment')
const sendemail = require('../helpers/emailhelper.js');
const dotenv=require('dotenv');
const { profile } = require("winston");
dotenv.config();







// create configuration
exports.postConfiguration = async(req,res)=>{
        if (!req.body){
            res.status(400).send({ status: 400, message:"Content cannot be empty"});
        }
        
     
        const { minimumWithdrawer, maximumWithdrawer,enableAutomatedWithdrawer } = req.body;
      
        if ( minimumWithdrawer && maximumWithdrawer){
              if ( minimumWithdrawer==="" || maximumWithdrawer=== "" ){
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
               }else{   
                   
                   
           
                try{
                    from = {
                        name: process.env.emailName,
                        address: process.env.user	
                    }
                     const emailTo = process.env.user
                     const emailFrom = from
                     const subject = "Configuratiion created"
                     const link = process.env.adminUrl
                     const link2 = process.env.adminUrl2
                     const name =  "Admin"
                     const message = "You just created the minimum and maximum withdrawer configuration, Please confirm if you just did that. Thanks "
                     
                     const adminconfig = new Adminconfig({
                            minimumWithdrawer: minimumWithdrawer,
                            maximumWithdrawer: maximumWithdrawer,
                            enableAutomatedWithdrawer : enableAutomatedWithdrawer
                         });
                         const saveadminconfig = await adminconfig.save()
                         processEmail(emailFrom, emailTo, subject,  link, link2, message, name);
                         res.status(201).send({ status: 201,message:"Configuration created successfully "})
                    
                      }catch(err){
                            console.log(err)
                            res.status(500).send({ status: 500,message:"Error while creating configuration "})
                 }
               }
                }else{
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
                }
};

// update configuration
exports.updateConfiguration = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status: 400, message:"Content cannot be empty"});
    }
    const _id = req.params.id;
 
    const { minimumWithdrawer, maximumWithdrawer,enableAutomatedWithdrawer } = req.body;
  
    if ( minimumWithdrawer && maximumWithdrawer){
          if ( minimumWithdrawer==="" || maximumWithdrawer=== ""){
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
           }else{   
               
               
       
            try{
                from = {
                    name: process.env.emailName,
                    address: process.env.user	
                }
                 const emailTo = process.env.user
                 const emailFrom = from
                 const subject = "Configuratiion updated"
                 const link = process.env.adminUrl
                 const link2 = process.env.adminUrl2
                 const name =  "Admin"
                 const message = "You just updated the minimum and maximum withdrawer configuration, Please confirm if you just did that. Thanks "
                 
                 const adminconfig = new Adminconfig({
                        _id : _id,
                        minimumWithdrawer: minimumWithdrawer,
                        maximumWithdrawer: maximumWithdrawer,
                        enableAutomatedWithdrawer : enableAutomatedWithdrawer   
                     });
                     console.log(adminconfig)
                     const updaterate = await Adminconfig.updateOne( {_id}, adminconfig)
                    //  processEmail(emailFrom, emailTo, subject,  link, link2, message, name);
                    res.status(201).send({ status: 201,message:"Configuration updated successfully "})
                
                  }catch(err){
                        console.log(err)
                        res.status(500).send({ status: 500,message:"Error while updating configuration "})
             }
           }
            }else{
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
            }
};


// Find configuration
exports.getConfiguration = async (req, res) => {
    try{
            const findConfiguration= await Adminconfig.findOne();    
            res.status(200).send({ status: 200, message: findConfiguration})
        
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting configuration "})
       }
};

  //Count dashboard count 
  exports.adminDashboardCount = async (req, res) => {
    try{
      
        const countTotalUsers= await Members.countDocuments({  role : "Seller"});
        const countCompletedTrade = await Trades.countDocuments({ tradeStatus : "Confirmed"});
        const countWithdrawerRequest = await Withdrawrequest.countDocuments({ status : "Pending"})
      
       // const totalOutflow = 5656
        const sumTotalTrade = await Withdrawrequest.aggregate(
            [
                { $match: { status: "Completed" } },
             {  
            
               $group : {
                  _id : null ,
                  totalAmount: { $sum: "$amount"} || 5, 
                  
               }
             }
           ])
         
    
        if(sumTotalTrade.length === 0){
             var sumTrade = 0
           
        }else{
            var sumTrade =sumTotalTrade[0].totalAmount
        }
        
          res.status(200).send({status: 200, message:{ countTotalUsers:countTotalUsers,countCompletedTrade:countCompletedTrade,countWithdrawerRequest:countWithdrawerRequest, totalOutflow: sumTrade}})
     }catch(err){ 
           console.log(err)
           res.status(500).send({status: 500,message:"Error while getting admin dashboard "})
       }
  };


  // admin analytics all time
  exports.adminAnalyticsAlltime = async (req, res) => {
    try{
      

       //-----------------------------------------------------------------------------------------------//
           // const total balance  ghana
                    const sumTotalBalanceUserGhana = await Members.aggregate(
                    [
                    
                        { $match: { country: "Ghana" } },
                    {  
                    
                    $group : {
                        _id : null ,
                        totalAmount: { $sum: "$walletBalance"} || 5, 
                        
                    }
                    }
                    ])
                    if(sumTotalBalanceUserGhana.length === 0){
                        var totalBalanceUserGhana= 0
                    
                    }else{
                        var totalBalanceUserGhana =sumTotalBalanceUserGhana[0].totalAmount
                    }

            // total balance nigeria
                const sumTotalBalanceUserNigeria= await Members.aggregate(
                    [
                    
                        { $match: { country: "Nigeria" } },
                    {  
                    
                    $group : {
                        _id : null ,
                        totalAmount: { $sum: "$walletBalance"} || 5, 
                        
                    }
                    }
                    ])
                    if(sumTotalBalanceUserNigeria.length === 0){
                        var totalBalanceUserNigeria= 0
                    
                    }else{
                        var totalBalanceUserNigeria=sumTotalBalanceUserNigeria[0].totalAmount
                    }
        //----------------------------------------------------------------------------------------------//


        //----------------------------------------------------------------------------------------------//
          
            // total amount withdrawn ghana
                 const sumTotalWithdrawGhana = await Withdrawrequest.aggregate(
                [
                      {
                        $lookup: {
                        from:"profiles",
                        localField: "userDetails",
                        foreignField: "_id",
                        as: "profile"
                    
                       }},
                       {
                           $match: {
                             "profile.country": "Ghana",
                              status: "Completed"
                            }
                       },

                       {  

                          $group : {
                            _id : null ,
                            totalAmount: { $sum: "$amount"}, 
                          }
                       }
                ])
             
                if(sumTotalWithdrawGhana.length === 0){
                    var totalWithdrawGhana = 0
                }else{
                    var totalWithdrawGhana =sumTotalWithdrawGhana[0].totalAmount
                }


            // total amount withdrawn nigeria
                 const sumTotalWithdrawNigeria = await Withdrawrequest.aggregate(
                [
                      {
                        $lookup: {
                        from:"profiles",
                        localField: "userDetails",
                        foreignField: "_id",
                        as: "profile"
                    
                       }},
                       {
                           $match: {
                             "profile.country": "Nigeria",
                              status: "Completed"
                            }
                       },

                       {  

                          $group : {
                            _id : null ,
                            totalAmount: { $sum: "$amount"}, 
                          }
                       }
                ])
               
                if(sumTotalWithdrawNigeria.length === 0){
                    var totalWithdrawNigeria = 0
                }else{
                    var totalWithdrawNigeria =sumTotalWithdrawNigeria[0].totalAmount
                }
    
        //-----------------------------------------------------------------------------------------------/-/



        //---------------------------------------------------------------------------------------------//
            //total inflow ghana
                 const sumTotalInflowGhana = await Trades.aggregate(
                    [
                        { $match: { tradeStatus: "Confirmed" ,country: "GH" } },
                    {  
                    
                    $group : {
                        _id : null ,
                        totalAmount: { $sum: "$amountInLocalCurrency"} || 5, 
                        
                    }
                    }
                    ])
                    if(sumTotalInflowGhana.length === 0){
                        var totalInflowGhana = 0
                    }else{
                        var totalInflowGhana =sumTotalInflowGhana[0].totalAmount
                    }



             //total inflow Nigeria
                 const sumTotalInflowNigeria = await Trades.aggregate(
                    [
                        { $match: { tradeStatus: "Confirmed" ,country: "NG" } },
                    {  
                    
                    $group : {
                        _id : null ,
                        totalAmount: { $sum: "$amountInLocalCurrency"} || 5, 
                        
                    }
                    }
                    ])
                    if(sumTotalInflowNigeria.length === 0){
                        var totalInflowNigeria = 0
                    }else{
                        var totalInflowNigeria =sumTotalInflowNigeria[0].totalAmount
                    }

      //-----------------------------------------------------------------------------------------------//
      
      res.status(200).send({status: 200, message:{ totalBalanceUserGhana:totalBalanceUserGhana, totalBalanceUserNigeria: totalBalanceUserNigeria, totalInflowGhana:totalInflowGhana,totalInflowNigeria:totalInflowNigeria, totalWithdrawGhana: totalWithdrawGhana, totalWithdrawNigeria: totalWithdrawNigeria}})
     }catch(err){ 
           console.log(err)
           res.status(500).send({status: 500,message:"Error while getting admin dashboard "})
       }
  };


  
  exports.adminAnalyticsFilter = async (req, res) => {
    try{
       const type = req.params.filterType
       const lim = req.query.limit
       const role = "Seller"
       const query = getQueryNoAmount({ ...req.query })
       console.log(type)
       if(type === "Balance"){
            if(lim){
                const findAllMembers = await Members.find({role: role, walletBalance: { $gt: 0 }},{ username: 1, walletBalance: 1 ,email: 1, country: 1, phoneNumber: 1 }).sort({"_id": -1}).limit(lim)
                console.log(findAllMembers)
                res.status(200).send({status: 200, message:findAllMembers})
            }else{
                const findAllMembers = await Members.find({role: role, walletBalance: { $gt: 0 }}, { username: 1, walletBalance: 1 ,email: 1, country: 1, phoneNumber: 1 }).sort({"_id": -1})    
                console.log(findAllMembers)
                res.status(200).send({status: 200, message:findAllMembers})
            
            }
       }else if(type === "Inflow"){
          const inflow=  await  Trades.aggregate([
                {"$match":{ ...query, tradeStatus: "Confirmed", }},
                {"$group" : {"_id":"$userId", "totalAmountInLocalCurrency":{"$sum":"$amountInLocalCurrency"}}}, 
                {"$lookup":{"from":"profiles","localField":"id", "foreignField":"userDetails","as":"profile"}}, 
                {"$project": {"profiles":"$profile","total":"$totalAmountInLocalCurrency", "userId":"$_id" ,_id:0}}    
            ])
            var finalInflow = []
                for(let i = 0; i < inflow.length; i++){
                        const allProfiles = inflow[i].profiles
                        for(let j = 0; j < allProfiles.length; j++){
                             if( allProfiles[j]._id == inflow[i].userId){
                                    let currentInflow = {
                                        username: allProfiles[j].username,
                                        walletBalance: allProfiles[j].walletBalance,
                                        email: allProfiles[j].email,
                                        country: allProfiles[j].country,
                                        phoneNumber: allProfiles[j].phoneNumber,
                                        totalAmountInLocalCurrency: inflow[i].total
                                    }
                                    console.log(currentInflow)
                                    finalInflow.push(currentInflow)
                                }
                            }
                        }

            res.status(200).send({status: 200, message:finalInflow})
       }else if(type === "Withdrawn"){
             const withdrawn =   await Withdrawrequest.aggregate([
                    { $match: { ...query, status: "Completed"} },
                    {$group:{_id:"$userId", totalAmountInLocalCurrency: {$sum: "$amount"}}},
                    {
                        $lookup: {
                        from:"profiles",
                        localField: "userId",
                        foreignField: "userDetails",
                        as: "profile"
                    
                    }},
                    {$project: {userId: "$_id", total:"$totalAmountInLocalCurrency",  profiles:"$profile" ,_id:0}}
            ])
            var finalWithdrawn = []
            for(let i = 0; i < withdrawn.length; i++){
                    const allProfiles = withdrawn[i].profiles
                    for(let j = 0; j < allProfiles.length; j++){
                         if( allProfiles[j]._id == withdrawn[i].userId){
                                let currentWithdrawn = {
                                    username: allProfiles[j].username,
                                    walletBalance: allProfiles[j].walletBalance,
                                    email: allProfiles[j].email,
                                    country: allProfiles[j].country,
                                    phoneNumber: allProfiles[j].phoneNumber,
                                    totalAmountInLocalCurrency: withdrawn[i].total
                                }
                                finalWithdrawn.push(currentWithdrawn)
                            }
                        }
                    }

            res.status(200).send({status: 200, message:finalWithdrawn})
           
       }else{
            res.status(400).send({status: 400,message:"Wrong filter type"})
       }    
    }catch(err){ 
           console.log(err)
           res.status(500).send({status: 500,message:"Error while getting admin dashboard "})
    }
  };


  exports.getDropletBalance = async (req, res) => {
    try{
        const headers = {
            'Authorization': process.env.digitalOceanBearer,
            'Content-Type': 'application/json',
            
            }
      
        const  getBalnce = await axios.get('https://api.digitalocean.com/v2/customers/my/balance', {headers: headers}) 
            res.status(200).send({Balance:getBalnce.data})
      
       }catch(err){
           console.log(err)
           res.status(500).send({message:"Error while getting balance "})
       }
};

// process email one
async function processEmail(emailFrom, emailTo, subject, link, link2, text, fullName){
    try{
       
       const sendmail =  await sendemail.emailUtility(emailFrom, emailTo, subject, link, link2, text, fullName);
     //  console.log(sendmail)
        return sendmail
    }catch(err){
        console.log(err)
        return err
    }
  
}
  
const getQueryNoAmount = (queryObj) =>{

    let monthAgo = moment().subtract(1, 'years').format('YYYY-MM-DD');
    console.log(monthAgo)
    let today = moment(new Date()).format('YYYY-MM-DD');
    console.log(today)
    let {  from_date=monthAgo, to_date=today, status= /.*/ } = queryObj
   
const query = { createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
return query


}
