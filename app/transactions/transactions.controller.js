const db = require("../mongoose");
const Transactions = db.transactions;
const mongoose = require("mongoose");
const moment  = require('moment')
const sendemail = require('../helpers/emailhelper.js');
const dotenv=require('dotenv');
      dotenv.config()
      
  //find transaction history for user
exports.getUserTransactionHistory = async (req, res) => {
    try{

            
        if(req.query.limit){
             const resultsPerPage =  parseInt(req.query.limit);
              let id = req.user.id
              const query = getQuery({ ...req.query }, id)
              const findTransaction = await Transactions.find(query).sort({ _id: "desc" })
              .limit(resultsPerPage)
              .populate('sellerDetails')
              if(findTransaction){
                res.status(200).send({ status:200, message: findTransaction})
              }else{
                res.status(400).send({status:400,message:"No new order to fetch "})
              }  

          }else {
                let id = req.user.id
                const query = getQuery({ ...req.query }, id)
              const findTransaction = await Transactions.find(query).sort({ _id: "desc" })
              
              .populate('sellerDetails')
              if(findTransaction){
                res.status(200).send({ status:200, message: findTransaction})
              }else{
                res.status(400).send({status:400,message:"No new transactions to fetch "})
              }  
          }
   }catch(err){
           console.log(err)
           res.status(500).send({status:500, message:"Error while getting transactions "})
  }
};

  //find all transaction history
exports.getAllTransactionHistory = async (req, res) => {
    try{

        const query = getQueryNoAmount({ ...req.query })
            const findTransaction = await Transactions.find(query).sort({ _id: "desc" })
            .populate('sellerDetails')
  
        if(findTransaction){
            res.status(200).send({ status:200, message: findTransaction})
          }else{
            res.status(400).send({status:400,message:"No new transaction to fetch "})
          }
         
        
       }catch(err){
           console.log(err)
           res.status(500).send({status:500, message:"Error while getting transaction "})
       }
};
// get trade by a user
exports.getTransactionsOfUserForAdmin = async (req, res) => {
  try{
    const sellerId = req.params.sellerId;
    const findTransaction = await Transactions.find({sellerId: sellerId}).sort({ _id: "desc" })
    .populate('sellerDetails')
       res.status(200).send({status: 200, message: findTransaction})
            
     }catch(err){
         console.log(err)
         res.status(500).send({message:"Error while getting transactions "})
     }
};

async function processEmail(emailFrom, emailTo, subject, link, link2, text, fName){
  try{
      //create org details
      // await delay();
     const sendmail =  await sendemail.emailUtility(emailFrom, emailTo, subject, link, link2, text, fName);
   //  console.log(sendmail)
      return sendmail
  }catch(err){
      console.log(err)
      return err
  }

}


const getQuery = (queryObj, sellerId) =>{
  console.log(queryObj)
   if(queryObj.amount){
         let monthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD');
         let today = moment(new Date()).format('YYYY-MM-DD');
         let {  from_date=monthAgo, to_date=today, status= /.*/ , amount} = queryObj
         if(status==="All"){
             status = /.*/
         }
         
         if(queryObj.amount === "All"){
           const query = { sellerId: sellerId, status:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
           console.log(" amount all")
           return query
 
         }else{ 
             finalAmount = parseFloat(amount)
             console.log(finalAmount)
             console.log(" amount")
           const query = { amount: finalAmount, sellerId: sellerId, status:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
           
           return query
         }
   }else{
         let monthAgo = moment().subtract(1, 'months').format('YYYY-MM-DD');
         let today = moment(new Date()).format('YYYY-MM-DD');
         let {  from_date=monthAgo, to_date=today, status= /.*/ } = queryObj
         if(status==="All"){
             status = /.*/
         }
     const query = { sellerId: sellerId, status:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
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
const query = { status:status, createdAt:{ $gte: new Date(new Date(from_date).setHours(00, 00, 00)), $lte: new Date(new Date(to_date).setHours(23, 59, 59)) }}
return query


}