
const db = require("../mongoose");
const Transactions = db.transactions;
const Withdrawrequest = db.withdrawrequests
const Members = db.profiles;
const Adminconfig = db.adminconfigs;
const mongoose = require("mongoose");
const sendemail = require('../helpers/emailhelper.js');
const axios = require('axios');
const uuid = require('uuid')
const moment  = require('moment')
const dotenv=require('dotenv');
      dotenv.config()

const Engage = require('@engage_so/js')
//import Engage from '@engage_so/js'

Engage.init(process.env.engageApiKey)

// withdraw  funds
exports.withdrawFunds = async(req, res) => {
    
    const {amount, accountName, accountNumber, bankName , bankBranch, accountType, mobileNetwork,  mobileNumber, bankCode, branchName } = req.body;
    if (accountType){  
       // const sess = await mongoose.startSession()
        // sess.startTransaction()
        const emailList = await Members.find({ $or: [ { role: "Admin" }, { role: "SubAdmin" } ] })

        if (accountType === "Bank"){
           
            if ( amount  && accountName && accountNumber&& bankName && bankCode &&  bankBranch  ){

                if ( amount === ""  || accountName ==="" || accountNumber==="" || bankName==="" || bankCode === "" || bankBranch=== "" ){
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
                }else{
            
                        try{
                                        const _id = req.user.id
                                        const getUser = await Members.findOne({_id: _id});
                                        const findConfiguration = await Adminconfig.findOne();

                                        const transAmount =    parseFloat(amount)
                                        const walletBalance =  parseFloat(getUser.walletBalance)
                                        const finalBalance  =  walletBalance - transAmount
                                        const minimumWithdrawer = parseFloat(findConfiguration.minimumWithdrawer) 
                                        const maximumWithdrawer = parseFloat(findConfiguration.maximumWithdrawer)
                                        const nairaToDollarRate = parseFloat(findConfiguration.nairaToDollarRate) 
                                        const cedisToDollarRate = parseFloat(findConfiguration.cedisToDollarRate)
                                        const enableAutomatedWithdrawer = findConfiguration.enableAutomatedWithdrawer
                                        const narration =  req.body.narration || "Fund withdrawer"
                                        const reference = uuid.v4()
                                        
                                        if(getUser.country === "Nigeria"){
                                            transAmountUSD = transAmount / nairaToDollarRate
                                        }else {
                                            transAmountUSD = transAmount / cedisToDollarRate
                                        }
                                       
                                        console.log("RATE")
                                        console.log(cedisToDollarRate)
                                        console.log(nairaToDollarRate)
                                        console.log("transAmount")
                                         console.log(minimumWithdrawer)
                                         console.log(transAmountUSD)
                                         console.log(maximumWithdrawer)
                                      

                                         console.log( enableAutomatedWithdrawer)
                                        if(walletBalance > transAmount ){
                                            if(transAmountUSD > minimumWithdrawer &&  transAmountUSD < maximumWithdrawer ){
                                                if(enableAutomatedWithdrawer === false ){

                                                    const transactions = new Transactions({      
                                                        status: "Pending",
                                                        sellerId: _id,  
                                                        sellerDetails: _id,            
                                                        amount: transAmount.toFixed(2), 
                                                        type : "Debit",
                                                        initialBalance : walletBalance.toFixed(2),
                                                        finalBalance: finalBalance.toFixed(2),
                                                        bankName: bankName,
                                                        accountName: accountName,
                                                        accountNumber: accountNumber,
                                                        bankBranch:bankBranch,
                                                        accountType: accountType,
                                                        bankCode: bankCode,
                                                        narration : narration || "Fund Withdrawer"
                
                                                        
                                                        });

                                                    const withdrawrequest = new Withdrawrequest({      
                                                        status: "Pending",
                                                        userDetails: _id,
                                                        userId:  _id,
                                                        bankName: bankName,
                                                        accountName: accountName,
                                                        accountNumber: accountNumber,
                                                        amount:transAmount.toFixed(2),
                                                        bankBranch:bankBranch,
                                                        accountType: accountType,
                                                        bankCode: bankCode,
                                                        branchName: branchName,
                                                        narration : narration || "Fund withdrawer",
                                                        country: getUser.country
                                                        });   

                                                        const saveTransaction = await  transactions.save()
                                                        const saveWithdrawerRequest = await withdrawrequest.save() 
                                                        const withdrawerRequestId = saveWithdrawerRequest._id
                                                        const updateUserWallet = await Members.findOneAndUpdate({ _id }, { walletBalance: finalBalance.toFixed(2) });  
                                                        const updateWithdrawerRequest = await Withdrawrequest.updateOne({ _id: withdrawerRequestId }, { transactionId: saveTransaction._id }); 

                                                        emailList.map(email => {
                                                                from = {
                                                                            name: process.env.emailName,
                                                                            address: process.env.user	
                                                                    }
                                                                const emailFrom = from; 
                                                                const subject = 'New withdrawer request';                      
                                                                const hostUrl =  process.env.adminUrl
                                                                const hostUrl2 =   process.env.adminUrl2
                                                                const receiver =  req.user.username;
                                                                const username = "Admin"
                                                                const   text = "You have a new withdrawal request to attend to, Please login to your dashboard to view this." 
                                                                const emailTo = email.email;
                                                                const link = `${hostUrl}`;
                                                                const link2 = `${hostUrl2}`;
                                                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                        }) 
                                                       
                                                        res.status(200).send({ status: 200, message:"Processing your request"})
                                                }else{

                                                    if(getUser.country === "Ghana"){
                                                        currency = "GHS"
                                                        var makepayment = await makePaymentGhana(bankCode , accountNumber  , transAmount, narration , currency, reference, bankBranch, accountName)
                                                        console.log(makepayment.data)
                                                        console.log(makepayment.status)
                                                        console.log(makepayment.data.status)
                                                         //console.log(sendmoney.data)
                                                    }else if(getUser.country === "Nigeria"){
                                                        currency = "NGN"
                                                        var makepayment = await makePaymentNigeria(bankCode , accountNumber  , transAmount, narration , currency, reference,  accountName)
                                                        console.log(makepayment.data)
                                                        console.log(makepayment.status)
                                                        console.log(makepayment.data.status)
                                                         //console.log(sendmoney.data)
                                                    }                                   
                                                  
                                                   if (makepayment.status === 200  && makepayment.data.status === "success") {
                                                            if (makepayment.data.data.status === "SUCCESSFUL" && makepayment.data.data.complete_message === "Transaction was successful"  ) {
                                                                const transactions = new Transactions({      
                                                                    status: "Successful",
                                                                    sellerId: _id,  
                                                                    sellerDetails: _id,            
                                                                    amount: transAmount.toFixed(2), 
                                                                    type : "Debit",
                                                                    initialBalance : walletBalance.toFixed(2),
                                                                    finalBalance: finalBalance.toFixed(2),
                                                                    bankName: bankName,
                                                                    accountName: accountName,
                                                                    accountNumber: accountNumber,
                                                                    bankBranch:bankBranch,
                                                                    accountType: accountType,
                                                                    bankCode: bankCode,
                                                                    narration : narration || "Fund withdrawer",
                                                                    reference:reference
                                                                    });

                                                                const withdrawrequest = new Withdrawrequest({      
                                                                        status: "Completed",
                                                                        userDetails: _id,
                                                                        userId: _id,
                                                                        bankName: bankName,
                                                                        accountName: accountName,
                                                                        accountNumber: accountNumber,
                                                                        amount:transAmount.toFixed(2),
                                                                        bankBranch:bankBranch,
                                                                        accountType: accountType,
                                                                        bankCode: bankCode,
                                                                        narration : narration ||"Fund withdrawer",
                                                                        flutterPaymentId: makepayment.data.data.id,
                                                                        reference:reference,
                                                                        branchName: branchName,
                                                                        country: getUser.country
                                                                    }); 

                                                                const updateUserWallet = await Members.updateOne({ _id: _id }, { walletBalance: finalBalance.toFixed(2) });  
                                                                const saveTransaction = await  transactions.save()
                                                                const saveWithdrawerRequest = await withdrawrequest.save() 
                                                                const withdrawerRequestId = saveWithdrawerRequest._id
                                                                const updateWithdrawerRequest = await Withdrawrequest.updateOne({ _id: withdrawerRequestId }, { transactionId: saveTransaction._id });  
                                                                from = {
                                                                    name: process.env.emailName,
                                                                    address: process.env.user	
                                                                }
                                                                const emailFrom = from; 
                                                                const subject = 'Funds sent';                      
                                                                const hostUrl =  process.env.hostUrl
                                                                const hostUrl2 =   process.env.hostUrl2
                                                                const username =  req.user.username
                                                                const   text = "Your withdrawer request has been approved and you funds has been sent" 
                                                                const emailTo = req.user.email
                                                                const link = `${hostUrl}`;
                                                                const link2 = `${hostUrl2}`;
                                                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                                Engage.track(_id, {
                                                                    event: 'make_withdrawal',
                                                                    timestamp: new Date(),
                                                                    properties: {
                                                                        amount: transAmount,
                                                                        account_name: accountName,
                                                                        account_number : accountNumber,
                                                                        bank_name: bankName,
                                                                        withdrawal_successful : true,
                                                                        withdrawal_failed: false
                                                                    }
                                                                   })
                                                                res.status(200).send({ status: 200, message:"Withdrawer succesfull"})
                                                            }else{
                                                                const transactions = new Transactions({      
                                                                    status: "Pending",
                                                                    sellerId: _id,  
                                                                    sellerDetails: _id,            
                                                                    amount: transAmount.toFixed(2), 
                                                                    type : "Debit",
                                                                    initialBalance : walletBalance.toFixed(2),
                                                                    finalBalance: finalBalance.toFixed(2),
                                                                    bankName: bankName,
                                                                    accountName: accountName,
                                                                    accountNumber: accountNumber,
                                                                    bankBranch:bankBranch,
                                                                    accountType: accountType,
                                                                    bankCode: bankCode,
                                                                    narration : narration || "Fund withdrawer",
                                                                    reference:reference
                                                                    });

                                                                const withdrawrequest = new Withdrawrequest({      
                                                                    status: "Processing",
                                                                    userDetails: _id,
                                                                    userId: _id,
                                                                    bankName: bankName,
                                                                    accountName: accountName,
                                                                    accountNumber: accountNumber,
                                                                    amount:transAmount.toFixed(2),
                                                                    bankBranch:bankBranch,
                                                                    accountType: accountType,
                                                                    bankCode: bankCode,
                                                                    narration : narration || "Fund withdrawer",
                                                                    flutterPaymentId: makepayment.data.data.id,
                                                                    reference: reference,
                                                                    branchName: branchName,
                                                                    country: getUser.country
                                                                }); 
                                                                console.log("i am  processing")
                                                                const updateUserWallet = await Members.updateOne({ _id: _id }, { walletBalance: finalBalance.toFixed(2) });  
                                                                const saveWithdrawerRequest = await withdrawrequest.save() 
                                                                const saveTransaction = await  transactions.save()
                                                                const withdrawerRequestId = saveWithdrawerRequest._id
                                                                const updateWithdrawerRequest = await Withdrawrequest.updateOne({ _id: withdrawerRequestId }, { transactionId: saveTransaction._id });  

                                                                    from = {
                                                                        name: process.env.emailName,
                                                                        address: process.env.user	
                                                                    }
                                                                    const emailFrom = from; 
                                                                    const subject = 'Fund processed';                      
                                                                    const hostUrl =  process.env.hostUrl
                                                                    const hostUrl2 =   process.env.hostUrl2
                                                                    const username =  req.user.username
                                                                    const   text = "Your withdrawer request has been processsed, you will receive your funds soon" 
                                                                    const emailTo = req.user.email
                                                                    const link = `${hostUrl}`;
                                                                    const link2 = `${hostUrl2}`;
                                                                    processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                
                                                                    res.status(200).send({ status: 200, message:"Payment is being processed"})      
                                                            }
                                                   }else{
                            
                                                            console.log("i fail trade from interswitch")
                                                            // console.log(reference)
                                                            res.status(400).send({ status: 400, message:"Withdrawer not successful"})   
                                                            // const updatePaymentStatus = await Trades.findOneAndUpdate({ _id }, { paymentStatus: "Failed" });  
                                                   } 
                        
                                                }

                                            
                                            }else{
                                                res.status(400).send({status: 400, message:"Minimum or Maximum withdrawer exceeded"})
                                            }
                                        }else{
                                            res.status(400).send({status: 400, message:"Insufficient funds in your wallet"})
                                        }
            
                        }catch(err){
                            console.log(err)
                            res.status(500).send({ status: 500, message:"Error while making withdrawer request "})
                        }
            
                }
                

            }else{

                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });

            }
           
        }else{
            if(mobileNetwork && mobileNumber && amount && accountName){
                if(mobileNetwork === "" || mobileNumber === "" || amount === "" || accountName===""){
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
                }else{
                        try{
                                const _id = req.user.id
                                const getUser = await Members.findOne({_id: _id});
                                const findConfiguration = await Adminconfig.findOne();
                                const transAmount =    parseFloat(amount)
                                const walletBalance =  parseFloat(getUser.walletBalance)
                                const finalBalance  =  walletBalance - transAmount
                                const minimumWithdrawer = parseFloat(findConfiguration.minimumWithdrawer) 
                                const maximumWithdrawer = parseFloat(findConfiguration.maximumWithdrawer)
                                const nairaToDollarRate = parseFloat(findConfiguration.nairaToDollarRate) 
                                const cedisToDollarRate = parseFloat(findConfiguration.cedisToDollarRate)
                                const enableAutomatedWithdrawer = findConfiguration.enableAutomatedWithdrawer
                                const narration =  req.body.narration || "Mobile Wallet recharge"
                                const reference = uuid.v4()
                                const currency = "GHS"
                            
                                if(getUser.country === "Nigeria"){
                                    transAmountUSD = transAmount / nairaToDollarRate
                                }else {
                                    transAmountUSD = transAmount / cedisToDollarRate
                                }

                                if(walletBalance > transAmount ){
                                    if(transAmountUSD >= minimumWithdrawer &&  transAmountUSD <= maximumWithdrawer ){
                                        if(enableAutomatedWithdrawer === false ){
                                            const withdrawrequest = new Withdrawrequest({      
                                                status: "Pending",
                                                userDetails: _id,
                                                userId: _id,
                                                mobileNetwork: mobileNetwork,
                                                amount:transAmount,
                                                accountName: accountName,
                                                mobileNumber:mobileNumber,
                                                accountType: accountType,
                                                narration : "Mobile wallet withdrawer",
                                                country: getUser.country
                                                });   

                                                const transactions = new Transactions({      
                                                    status: "Pending",
                                                    sellerId: _id,  
                                                    sellerDetails: _id,            
                                                    amount: transAmount, 
                                                    type : "Debit",
                                                    initialBalance : walletBalance,
                                                    finalBalance: finalBalance,
                                                    mobileNetwork: mobileNetwork,
                                                    mobileNumber: mobileNumber,
                                                    accountName: accountName,
                                                    accountType: accountType,
                                                    narration : narration || "Mobile wallet withdrawer"
                                                    
                                                    });
                                                const saveTransaction = await  transactions.save()
                                                const saveWithdrawerRequest = await withdrawrequest.save() 
                                                const withdrawerRequestId = saveWithdrawerRequest._id
                                                const updateUserWallet = await Members.findOneAndUpdate({ _id }, { walletBalance: finalBalance });  
                                                const updateWithdrawerRequest = await Withdrawrequest.updateOne({_id: withdrawerRequestId }, { transactionId: saveTransaction._id });  
                                                
                                             
                                                emailList.map(email => {
                                                    from = {
                                                                name: process.env.emailName,
                                                                address: process.env.user	
                                                        }
                                                    const emailFrom = from; 
                                                    const subject = 'New withdrawer request';                      
                                                    const hostUrl =  process.env.adminUrl
                                                    const hostUrl2 =   process.env.adminUrl2
                                                    const receiver =  req.user.username;
                                                    const username = "Admin"

                                                    const   text = "A new payment request from "+username+"   Amount: "+transAmount.toFixed(2)+". Please Login to the dashborad to attend to it." 
                                                    const emailTo = email.email;
                                                    const link = `${hostUrl}`;
                                                    const link2 = `${hostUrl2}`;
                                                    processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                            }) 
                                                res.status(200).send({status:200, message:"Processing your request"})
                                        }else{
                                            const makepayment =  await makePaymentMobile(mobileNetwork , mobileNumber  , transAmount, narration , currency, reference, accountName)
                                             //   console.log(makepayment.status)
                                                console.log(makepayment.data.data.status)
                                                if (makepayment.status === 200  && makepayment.data.status === "success") {
                                                        if (makepayment.data.data.status === "SUCCESSFUL" && makepayment.data.data.complete_message === "Transaction was successful"  ) {
                                                                const transactions = new Transactions({      
                                                                    status: "Successful",
                                                                    sellerId: _id,  
                                                                    sellerDetails: _id,            
                                                                    amount: transAmount, 
                                                                    type : "Debit",
                                                                    initialBalance : walletBalance,
                                                                    finalBalance: finalBalance,
                                                                    mobileNetwork: mobileNetwork,
                                                                    mobileNumber: mobileNumber,
                                                                    accountType: accountType,
                                                                    accountName: accountName,
                                                                    narration : narration || "Mobile wallet withdrawer",
                                                                    reference:reference
                                                                    
                                                                    });

                                                                const withdrawrequest = new Withdrawrequest({      
                                                                        status: "Completed",
                                                                        userDetails: _id,
                                                                        userId: _id,
                                                                        mobileNetwork: mobileNetwork,
                                                                        mobileNumber: mobileNumber,
                                                                        amount:transAmount.toFixed(2),
                                                                        accountType: accountType,
                                                                        narration : narration || "Mobile wallet withdrawer",
                                                                        flutterPaymentId: makepayment.data.data.id,
                                                                        reference:reference,
                                                                        accountName: accountName,
                                                                        country: getUser.country
                                                                    }); 

                                                                const updateUserWallet = await Members.updateOne({ _id: _id }, { walletBalance: finalBalance.toFixed(2) });  
                                                                const saveTransaction = await  transactions.save()
                                                                const saveWithdrawerRequest = await withdrawrequest.save() 
                                                                const withdrawerRequestId = saveWithdrawerRequest._id
                                                                const updateWithdrawerRequest = await Withdrawrequest.updateOne({ _id: withdrawerRequestId }, { transactionId: saveTransaction._id });  
                                                                from = {
                                                                    name: process.env.emailName,
                                                                    address: process.env.user	
                                                                }
                                                                const emailFrom = from; 
                                                                const subject = 'Mobile wallet credited';                      
                                                                const hostUrl =  process.env.hostUrl
                                                                const hostUrl2 =   process.env.hostUrl2
                                                                const username =  req.user.username
                                                                const   text = "Your withdrawer request has been approved and you Mobile wallet has been credited" 
                                                                const emailTo = req.user.email
                                                                const link = `${hostUrl}`;
                                                                const link2 = `${hostUrl2}`;
                                                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                                Engage.track(_id, {
                                                                    event: 'make_withdrawal',
                                                                    timestamp: new Date(),
                                                                    properties: {
                                                                        amount: transAmount,
                                                                        account_name: accountName,
                                                                        account_number : mobileNumber,
                                                                        bank_name: mobileNetwork,
                                                                        withdrawal_successful : true,
                                                                        withdrawal_failed: false
                                                                    }
                                                                   })
                                                                res.status(200).send({ status: 200, message:"Withdrawer succesfull"})
                                                        }else{
                                                        const transactions = new Transactions({      
                                                            status: "Processing",
                                                            sellerId: _id,  
                                                            sellerDetails: _id,            
                                                            amount: transAmount, 
                                                            type : "Debit",
                                                            initialBalance : walletBalance,
                                                            finalBalance: finalBalance,
                                                            mobileNetwork: mobileNetwork,
                                                            mobileNumber: mobileNumber,
                                                            accountName: accountName,
                                                            accountType: accountType,
                                                            narration :  narration || "Mobile wallet withdrawer",
                                                            reference:reference
                                                            
                                                            });

                                                            const withdrawrequest = new Withdrawrequest({      
                                                                status: "Processing",
                                                                userDetails: _id,
                                                                userId: _id,
                                                                mobileNetwork: mobileNetwork,
                                                                mobileNumber: mobileNumber,
                                                                amount:transAmount.toFixed(2),
                                                                accountType: accountType,
                                                                accountName: accountName,
                                                                narration : narration || "Mobile wallet withdrawer",
                                                                flutterPaymentId: makepayment.data.data.id,
                                                                reference:reference,
                                                                country: getUser.country
                                                            }); 


                                                            const updateUserWallet = await Members.updateOne({ _id: _id }, { walletBalance: finalBalance.toFixed(2) });  
                                                            const saveWithdrawerRequest = await withdrawrequest.save() 
                                                            const saveTransaction = await  transactions.save()
                                                            const withdrawerRequestId = saveWithdrawerRequest._id
                                                            const updateWithdrawerRequest = await Withdrawrequest.updateOne({ _id: withdrawerRequestId }, { transactionId: saveTransaction._id });  
                                                                from = {
                                                                    name: process.env.emailName,
                                                                    address: process.env.user	
                                                                }
                                                                const emailFrom = from; 
                                                                const subject = 'Mobile wallet withdrawer processed';                      
                                                                const hostUrl =  process.env.hostUrl
                                                                const hostUrl2 =   process.env.hostUrl2
                                                                const username =  req.user.username
                                                                const   text = "Your withdrawer request has been processsed, you will receive your credit soon" 
                                                                const emailTo = req.user.email
                                                                const link = `${hostUrl}`;
                                                                const link2 = `${hostUrl2}`;
                                                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                            
                                                                res.status(200).send({ status: 200, message:"Payment is being processed"})      
                                                        }
                                                }else{
                    
                                                    console.log("i fail trade from interswitch")
                                                    // console.log(reference)
                                                    res.status(400).send({ status: 400, message:"Withdrawer not successful"})   
                                                    // const updatePaymentStatus = await Trades.findOneAndUpdate({ _id }, { paymentStatus: "Failed" });  
                                                } 
                                        }

                                       
                                    }else{
                                        res.status(400).send({status: 400, message:"Minimum or Maximum withdrawer exceeded"})
                                    }
                                }else{
                                    res.status(400).send({status: 400, message:"Insufficient fund"})
                                }
                                
                      
    

                        }catch(err){
                            console.log(err)
                            res.status(500).send({ status: 500, message:"Error while making withdrawer request "})
                        }
                }
            }else{
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
            }
        }
        //await sess.commitTransaction()
        //sess.endSession();
    }else{
        res.status(400).send({ status:400,message:"Account type field must be available"});
    }
  
  
  };

  
  //find  all withdrawer
exports.getAllWithdrawer = async (req, res) => {
   // console.log("i enter")
    try{
        if(req.query.limit){
            const resultsPerPage =  parseInt(req.query.limit);
            const query = getQueryNoAmount({ ...req.query })
            const findWithdrawerRequest = await Withdrawrequest.find(query).sort({ _id: "desc" }).limit(resultsPerPage).populate('userDetails')
            res.status(200).send({status: 200, message: findWithdrawerRequest})
        }else{
            const query = getQueryNoAmount({ ...req.query })
            const findWithdrawerRequest = await Withdrawrequest.find(query).sort({ _id: "desc" }).populate('userDetails')
            res.status(200).send({status: 200, message: findWithdrawerRequest})
        }
       }catch(err){
           console.log(err)
           res.status(500).send({message:"Error while getting Withdrawer request "})
       }
};
                                                                
                
exports.cancelWithdrawerRequest = async(req, res) => {
       
                    try{
                             //const sess = await mongoose.startSession()
                            // sess.startTransaction()
                              
                              const _id = req.params.withdrawerrequestId;
                              getWithdrawerRequest = await Withdrawrequest.findOne({_id: _id})
                              getUserDetails = await Members.findOne({_id:getWithdrawerRequest.userDetails})
                             const userId = getUserDetails._id
                             if(getWithdrawerRequest.status === "Completed" || getWithdrawerRequest.status === "Declined" ){
                                   res.status(400).send({ status: 400, message:"This withdrawer request has been completed or cancelled"})
                
                             }else{    
                                    const amount =  getWithdrawerRequest.amount
                                    const transAmount = parseFloat(amount)
                                    const walletBalance =  parseFloat(getUserDetails.walletBalance)
                                    const finalBalance  =  parseFloat(getUserDetails.walletBalance) + parseFloat(amount) 
                                    const transactionId = getWithdrawerRequest.transactionId
                    
                                    const updateWithdrawerrequest= await Withdrawrequest.findOneAndUpdate({ _id }, { status: "Declined" });    
                                    const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { status: "Failed" });  

                                    if (getWithdrawerRequest.accountType === "Bank"){
                                            transactions = new Transactions({      
                                                status: "Successful",
                                                sellerId: getUserDetails._id, 
                                                sellerDetails: getUserDetails._id,             
                                                amount: amount.toFixed(2),
                                                type : "Credit",
                                                initialBalance : walletBalance.toFixed(2),
                                                finalBalance: finalBalance.toFixed(2),
                                                bankName: getWithdrawerRequest.bankName,
                                                accountName: getWithdrawerRequest.accountName,
                                                accountNumber: getWithdrawerRequest.accountNumber,
                                             //   bankCode: getWithdrawerRequest.bankCode || "",
                                                narration : "Transaction Reversed",
                                                accountType: getWithdrawerRequest.accountType
                                                
                                            });

                                            Engage.track(userId, {
                                                event: 'make_withdrawal',
                                                timestamp: new Date(),
                                                properties: {
                                                    amount: getWithdrawerRequest.amount,
                                                    account_name: getWithdrawerRequest.accountName,
                                                    account_number : getWithdrawerRequest.accountNumber,
                                                    bank_name: getWithdrawerRequest.bankName,
                                                    withdrawal_successful : false,
                                                    withdrawal_failed: true
                                                }
                                               })
                                    }else{
                                            transactions = new Transactions({      
                                                status: "Successful",
                                                sellerId: getUserDetails._id,    
                                                sellerDetails: getUserDetails._id,          
                                                amount: amount.toFixed(2),
                                                type : "Credit",
                                                initialBalance : walletBalance.toFixed(2),
                                                finalBalance: finalBalance.toFixed(2),
                                                mobileNumber: getWithdrawerRequest.mobileNumber,
                                                mobileNetwork: getWithdrawerRequest.mobileNetwork,
                                                narration : "Transaction Reversed",
                                                accountType: getWithdrawerRequest.accountType
                                                
                                            });
                                            Engage.track(userId, {
                                                event: 'make_withdrawal',
                                                timestamp: new Date(),
                                                properties: {
                                                    amount: getWithdrawerRequest.amount,
                                                    
                                                    account_number : getWithdrawerRequest.mobileNumber,
                                                    bank_name: getWithdrawerRequest.mobileNetwork,
                                                    withdrawal_successful : false,
                                                    withdrawal_failed: true
                                                }
                                               })
                                }
                                    const saveTransaction = await  transactions.save()      
                                    const updateUserWallet = await Members.updateOne({_id:  userId }, { walletBalance: finalBalance.toFixed(2) });  
                                   
                                  //  await sess.commitTransaction()
                                    //    sess.endSession();  
                                        from = {
                                            name: process.env.emailName,
                                            address: process.env.user	
                                        }
                                        const emailFrom = from; 
                                        const subject = 'Funds reversed';                      
                                        const hostUrl =  process.env.hostUrl
                                        const hostUrl2 =   process.env.hostUrl2
                                        const username =  getUserDetails.username
                                        const   text = "Your withdrawer request has been rejected and you funds has been reversed" 
                                        const emailTo = getUserDetails.email
                                        const link = `${hostUrl}`;
                                        const link2 = `${hostUrl2}`;
                                        processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                    
                                        res.status(200).send({ status: 200, message:"Withdrawer request declined succesfully"})
                              
                
                            }
                    }
                    catch(err){
                        console.log(err)
                        res.status(500).send({ status: 500, message:"Error while cancelling order "})
                    }
                
};


exports.manualSuccessWithdrawerRequest = async(req, res) => {
       
    try{
            // const sess = await mongoose.startSession()
            // sess.startTransaction()
              
              const _id = req.params.withdrawerrequestId;
              getWithdrawerRequest = await Withdrawrequest.findOne({_id: _id})
              getUserDetails = await Members.findOne({_id: getWithdrawerRequest.userDetails})
             const userId = getUserDetails._id
             if(getWithdrawerRequest.status === "Completed" || getWithdrawerRequest.status === "Declined" ){
                   res.status(400).send({ status: 400, message:"This withdrawer request has been completed or cancelled"})

             }else{    
                    const transactionId = getWithdrawerRequest.transactionId
                    const updateWithdrawerrequest= await Withdrawrequest.findOneAndUpdate({ _id }, { status: "Completed" });    
                    const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { status: "Successful" });  
                   // await sess.commitTransaction()
                    //sess.endSession(); 
                        from = {
                            name: process.env.emailName,
                            address: process.env.user	
                        }
                        const emailFrom = from; 
                        const subject = 'Funds sent';                      
                        const hostUrl =  process.env.hostUrl
                        const hostUrl2 =   process.env.hostUrl2
                        const username =  getUserDetails.username
                        const   text = "Your withdrawer request has been approved and you funds has been sent" 
                        const emailTo = getUserDetails.email
                        const link = `${hostUrl}`;
                        const link2 = `${hostUrl2}`;
                        processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                        if (getWithdrawerRequest.accountType === "Bank"){
                            Engage.track(userId, {
                                event: 'make_withdrawal',
                                timestamp: new Date(),
                                properties: {
                                    amount: getWithdrawerRequest.amount,
                                    account_name: getWithdrawerRequest.accountName,
                                    account_number : getWithdrawerRequest.accountNumber,
                                    bank_name: getWithdrawerRequest.bankName,
                                    withdrawal_successful : true,
                                    withdrawal_failed: false
                                }
                               })
                        }else{
                            Engage.track(userId, {
                                event: 'make_withdrawal',
                                timestamp: new Date(),
                                properties: {
                                    amount: getWithdrawerRequest.amount,
                                    account_name: getWithdrawerRequest.accountName,
                                    account_number : getWithdrawerRequest.mobileNumber,
                                    bank_name: getWithdrawerRequest.mobileNetwork,
                                    withdrawal_successful : true,
                                    withdrawal_failed: false
                                }
                               })
                        }
                        res.status(200).send({ status: 200, message:"Manual success posted succesfully"})
              

            }
    }
    catch(err){
        console.log(err)
        res.status(500).send({ status: 500, message:"Error while approving withdrawer request "})
    }

};


exports.getWithdrawerRequestById = async (req, res) => {
    try{
            const id = req.params.withdrawerrequestId
            const findWithdrawerRequestById = await Withdrawrequest.findOne({_id: id}).populate('userDetails')
            res.status(200).send( {status:200, findWithdrawerRequestById})
    }catch(err){
        console.log(err)
        res.status(500).send({ status:500,message:"Error while getting single withdrawer request "})
    }
};

// get bank code
exports.getBanksCode = async (req, res) => {
    country = req.params.country;

    if(country === "GH"){
            var bankCodeUrl = 'https://api.flutterwave.com/v3/banks/GH'
    }else if(country === "NG"){
            var bankCodeUrl  = 'https://api.flutterwave.com/v3/banks/NG'
    }
    try{
        console.log("getBankCode")
        const headers = {
            'Authorization': process.env.flutterwaveToken,
            'Content-Type': 'application/json'      
            }
        
        const  getAllCode = await axios.get(bankCodeUrl, {headers: headers}) 
        console.log(getAllCode.data.data)
            let allCode = getAllCode.data.data
            if(getAllCode.status === 200){

                if(country === "GH"){
                    var indexesToBeRemoved = [0, 1, 2];
              
                    allBanks = allCode.filter(function(value, index) {
                           return indexesToBeRemoved.indexOf(index) == -1;
                    })
                  
                    res.status(200).send({ status: 200, message: allBanks})
                }else if(country === "NG"){
                    res.status(200).send({ status: 200, message: allCode})
                }
               
            }else{
                res.status(400).send({ status: 400, message: "error while calling flutter wave"})
            }
      
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting bank code "})
       }
};
// get bank code
exports.getBankBranch = async (req, res) => {
    try{
        console.log("getBankCode")
        const headers = {
            'Authorization': process.env.flutterwaveToken,
            'Content-Type': 'application/json'      
            }
            id = req.params.codeId
        
        const  getBranchCodes = await axios.get(`https://api.flutterwave.com/v3/banks/${id}/branches`, {headers: headers}) 
            //console.log(getBranchCodes.data.data)
            let branchCode = getBranchCodes.data.data
            if(getBranchCodes.status === 200){
                res.status(200).send({ status: 200, message: branchCode})
            }else{
                res.status(400).send({ status: 400, message: "error while calling flutter wave"})
            }
      
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting bank code "})
       }
};
        
//get wallet code

exports.getMobileWalletCode = async (req, res) => {
    try{
        console.log("getwalletCode")
        const headers = {
            'Authorization': process.env.flutterwaveToken,
            'Content-Type': 'application/json'      
            }
        
        const  getAllCode = await axios.get('https://api.flutterwave.com/v3/banks/GH', {headers: headers}) 
           // console.log(getAllCode.data.data) 
             let allCode = getAllCode.data.data
            if(getAllCode.status === 200){
                 
                 const mobileWalletCode = function( arr){
                     return[arr[0], arr[1], arr[2]]
                 }
                 res.status(200).send({ status: 200, message: mobileWalletCode(allCode)})
            }else{
                res.status(400).send({ status: 400, message: "error while calling flutter wave"})
            }
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting bank code "})
       }
};


exports.flutterwaveWithdrawer = async(req, res) => {
       
    try{
             //const sess = await mongoose.startSession()
           //  sess.startTransaction()
              
              const _id = req.params.withdrawerrequestId;
              getWithdrawerRequest = await Withdrawrequest.findOne({_id: _id})
              getUserDetails = await Members.findOne({_id: getWithdrawerRequest.userDetails})
             const userId = getUserDetails._id
             if(getWithdrawerRequest.status === "Completed" || getWithdrawerRequest.status === "Declined" ){
                   res.status(400).send({ status: 400, message:"This withdrawer request has been completed or cancelled"})

             }else{    
                    const transactionId = getWithdrawerRequest.transactionId
                    
                    const reference = uuid.v4()
                    if( getWithdrawerRequest.accountType === "Bank"){
                        account_bank= getWithdrawerRequest.bankCode
                        account_number = getWithdrawerRequest.accountNumber
                        amount = getWithdrawerRequest.amount
                        narration = getWithdrawerRequest.narration || ""
                        bankBranch = getWithdrawerRequest.bankBranch
                        accountName = getWithdrawerRequest.accountName
                        currency = "GHS"
                        narration = "Sent Fund by Admin"
                        bankBranch = getWithdrawerRequest.bankBranch
                        accountName = getWithdrawerRequest.accountName
                        
                        if(getUserDetails.country === "Ghana"){
                            currency = "GHS"
                            var makepayment = await makePaymentGhana(account_bank , account_number  , amount, narration , currency, reference, bankBranch, accountName);
                            console.log(makepayment.data)
                            console.log(makepayment.status)
                            console.log(makepayment.data.status)
                             //console.log(sendmoney.data)
                        }else if(getUserDetails.country === "Nigeria"){
                            currency = "NGN"
                            var makepayment = await makePaymentNigeria(account_bank , account_number  , amount, narration , currency, reference,  accountName)
                            console.log(makepayment.data)
                            console.log(makepayment.status)
                            console.log(makepayment.data.status)
                             //console.log(sendmoney.data)
                        }
                            


                    }else{
                        account_bank =  getWithdrawerRequest.mobileNetwork
                        account_number = getWithdrawerRequest.mobileNumber
                        amount = getWithdrawerRequest.amount
                        narration ="Sent Fund by Admin"
                        currency = "GHS"
                        accountName = getWithdrawerRequest.accountName
                        makepayment = await makePaymentMobile(account_bank , account_number  , amount, narration , currency, reference, accountName);

                    }
                        
                    if (makepayment.status === 200  && makepayment.data.status === "success") {
                        const updateReference = await Withdrawrequest.updateOne({ _id: _id }, { reference: reference }); 
                        const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { reference: reference });

                            if (makepayment.data.data.status === "SUCCESSFUL" && makepayment.data.data.complete_message === "Transaction was successful"  ) {
                                const updateWithdrawerrequest= await Withdrawrequest.updateOne({ _id: _id }, { status: "Completed",  flutterPaymentId: makepayment.data.data.id });    
                                const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { status: "Successful" });
                                from = {
                                    name: process.env.emailName,
                                    address: process.env.user	
                                }
                                const emailFrom = from; 
                                const subject = 'Funds sent';                      
                                const hostUrl =  process.env.hostUrl
                                const hostUrl2 =   process.env.hostUrl2
                                const username =  getUserDetails.username
                                const   text = "Your withdrawer request has been approved and you funds has been sent" 
                                const emailTo = getUserDetails.email
                                const link = `${hostUrl}`;
                                const link2 = `${hostUrl2}`;
                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
    
                              res.status(200).send({ status: 200, message:"Manual success posted succesfully"})
                            }else{
        
                                    const updatePaymentStatus = await Withdrawrequest.updateOne({ _id : _id}, { status: "Processing", flutterPaymentId: makepayment.data.data.id });    
                                    from = {
                                        name: process.env.emailName,
                                        address: process.env.user	
                                    }
                                    const emailFrom = from; 
                                    const subject = 'Fund processed';                      
                                    const hostUrl =  process.env.hostUrl
                                    const hostUrl2 =   process.env.hostUrl2
                                    const username =  getUserDetails.username
                                    const   text = "Your withdrawer request has been processsed, you will receive your funds soo" 
                                    const emailTo = getUserDetails.email
                                    const link = `${hostUrl}`;
                                    const link2 = `${hostUrl2}`;
                                    processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                
                                    res.status(200).send({ status: 200, message:"Payment is being processed"})      
                            }
                    
    
                    }else{
    
                        console.log("enter trade")
                        // console.log(reference)
                        res.status(400).send({ status: 400, message:"Payment not successful"})   
                        // const updatePaymentStatus = await Trades.findOneAndUpdate({ _id }, { paymentStatus: "Failed" });  
                    } 

                   // await sess.commitTransaction()
                   // sess.endSession(); 
            }
    }
    catch(err){
        console.log(err)
        res.status(500).send({ status: 500, message:"Error while approving withdrawer request "})
    }

};

exports.updateFlutterResponse = async(req, res) => {
    const {  id , status  , reference, complete_message} = req.body.data;
    console.log("complete_message")  
    console.log(complete_message)

    console.log("reference")  
    console.log(reference)
     
      console.log("status")
      console.log(status)
      try{
       
          const getwithdrawerrequest = await Withdrawrequest.findOne({reference: reference})
          const getTransaction= await Transactions.findOne({reference: reference})
          console.log("User Id")
          console.log(getwithdrawerrequest)
          const getUserDetails = await Members.findOne({_id:getwithdrawerrequest.userId})
          //const sess = await mongoose.startSession()
        //  sess.startTransaction()
          const userId = getUserDetails._id
          console.log("User Id")
          console.log(userId)
          console.log("getwithdrawerrequest")
          console.log(getwithdrawerrequest)
          const _id = getwithdrawerrequest._id;
          const transactionId = getTransaction._id
          if(getwithdrawerrequest.status === "Processing"){
              if (status === "SUCCESSFUL" && complete_message === "Transaction was successful"  ) {
                    const updateWithdrawerrequest= await Withdrawrequest.updateOne({ _id: _id }, { status: "Completed" });    
                    const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { status: "Successful" });
                    from = {
                        name: process.env.emailName,
                        address: process.env.user	
                    }
                    const emailFrom = from; 
                    const subject = 'Funds sent';                      
                    const hostUrl =  process.env.hostUrl
                    const hostUrl2 =   process.env.hostUrl2
                    const username =  getUserDetails.username
                    const   text = "Your withdrawer request has been approved and you funds has been sent" 
                    const emailTo = getUserDetails.email
                    const link = `${hostUrl}`;
                    const link2 = `${hostUrl2}`;
                    processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                    if (getwithdrawerrequest.accountType === "Bank"){
                        Engage.track(userId, {
                            event: 'make_withdrawal',
                            timestamp: new Date(),
                            properties: {
                                amount: getwithdrawerrequest.amount,
                                account_name: getwithdrawerrequest.accountName,
                                account_number : getwithdrawerrequest.accountNumber,
                                bank_name: getwithdrawerrequest.bankName,
                                withdrawal_successful : true,
                                withdrawal_failed: false
                            }
                           })
                    }else{
                        Engage.track(userId, {
                            event: 'make_withdrawal',
                            timestamp: new Date(),
                            properties: {
                                amount: getwithdrawerrequest.amount,
                                account_name: getwithdrawerrequest.accountName,
                                account_number : getwithdrawerrequest.mobileNumber,
                                bank_name: getwithdrawerrequest.mobileNetwork,
                                withdrawal_successful : true,
                                withdrawal_failed: false
                            }
                           })
                    }
                
                    res.status(200).send({message:"Success"})
              }else if (status === "FAILED" ) {
                                    const amount =  getwithdrawerrequest.amount
                                    const transAmount = parseFloat(amount)
                                    const walletBalance =  parseFloat(getUserDetails.walletBalance)
                                    const finalBalance  =  parseFloat(getUserDetails.walletBalance) + parseFloat(amount) 

                                    if (getwithdrawerrequest.accountType === "Bank"){
                                            transactions = new Transactions({      
                                                status: "Successful",
                                                sellerId: userId, 
                                                sellerDetails: userId,             
                                                amount: amount.toFixed(2),
                                                type : "Credit",
                                                initialBalance : walletBalance.toFixed(2),
                                                finalBalance: finalBalance.toFixed(2),
                                                bankName: getwithdrawerrequest.bankName,
                                                accountName: getwithdrawerrequest.accountName,
                                                accountNumber: getwithdrawerrequest.accountNumber,
                                                narration : "Transaction Reversed",
                                                accountType: getwithdrawerrequest.accountType,
                                                bankBranch: getwithdrawerrequest.bankBranch,
                                                branchName: getwithdrawerrequest.branchName
                                                
                                            });
                                            Engage.track(userId, {
                                                event: 'make_withdrawal',
                                                timestamp: new Date(),
                                                properties: {
                                                    amount: getwithdrawerrequest.amount,
                                                    account_name: getwithdrawerrequest.accountName,
                                                    account_number : getwithdrawerrequest.accountNumber,
                                                    bank_name: getwithdrawerrequest.bankName,
                                                    withdrawal_successful : false,
                                                    withdrawal_failed: true
                                                }
                                               })
                                    }else{
                                            transactions = new Transactions({      
                                                status: "Successful",
                                                sellerId: userId,    
                                                sellerDetails: userId,          
                                                amount: amount.toFixed(2),
                                                type : "Credit",
                                                initialBalance : walletBalance.toFixed(2),
                                                finalBalance: finalBalance.toFixed(2),
                                                mobileNumber: getwithdrawerrequest.mobileNumber,
                                                mobileNetwork: getwithdrawerrequest.mobileNetwork,
                                                narration : "Transaction Reversed",
                                                accountType: getwithdrawerrequest.accountType,
                                                accountName: getwithdrawerrequest.accountName
                                                
                                            });
                                            Engage.track(userId, {
                                                event: 'make_withdrawal',
                                                timestamp: new Date(),
                                                properties: {
                                                    amount: getwithdrawerrequest.amount,
                                                    account_name: getwithdrawerrequest.accountName,
                                                    account_number : getwithdrawerrequest.mobileNumber,
                                                    bank_name: getwithdrawerrequest.mobileNetwork,
                                                    withdrawal_successful : false,
                                                    withdrawal_failed: true
                                                }
                                               })
                                   }
                                            const saveTransaction = await  transactions.save()      
                                            const updateUserWallet = await Members.updateOne({_id:  userId }, { walletBalance: finalBalance.toFixed(2) });  
                                            const updatePaymentStatus = await Withdrawrequest.updateOne({ _id : _id }, { status: "Declined" });  
                                            const updateTransaction = await Transactions.updateOne({_id:  transactionId }, { status: "Failed" });
                                        res.status(200).send({message:"Success"})
  
              }else {
                   console.log("i think its still processing")
                   console.log(status)
                    res.status(200).send({message:"Success"})
              }
          }else{
                console.log("This trade has been completed ,  Invalid or has not been paid")
                res.status(200).send({message:"Success"})
          }  
         // await sess.commitTransaction()
         // sess.endSession();
      }catch(err){
          console.log(err)
          res.status(500).send({message:"Error while completing trade "})
      }
  };


const makePaymentGhana = async (account_bank , account_number  , amount, narration , currency, reference, bankBranch, accountName) => {
    try {
     // const referenceNumber =
      console.log("make payment")
      const headers = {
          'Authorization': process.env.flutterwaveToken,
          'Content-Type': 'application/json'      
          }
          const params = {

            

            account_bank: account_bank,
            account_number: account_number,
            amount: amount,
            narration: narration || "Withdraw funds",
            currency: currency,
            reference : `${reference}`,
             destination_branch_code: bankBranch,
             callback_url : `https://server.dartafrica.io/flutter/webhook/payment/status/${reference}`,
            beneficiary_name: accountName,
          
          }  
         // console.log(params)
      const  sendmoney = await axios.post('https://api.flutterwave.com/v3/transfers', params, {headers: headers}) 
         // console.log(sendmoney.data)
        
  
      return sendmoney
    } catch (err) { 
      console.log(err)
      return err
    }
  }
     

const makePaymentNigeria = async (account_bank , account_number  , amount, narration , currency, reference,  accountName) => {
    try {
     // const referenceNumber =
      console.log("make payment")
      const headers = {
          'Authorization': process.env.flutterwaveToken,
          'Content-Type': 'application/json'      
          }
          const params = {

            

            account_bank: account_bank,
            account_number: account_number,
            amount: amount,
            narration: narration || "Withdraw funds",
            currency: currency,
            reference : `${reference}`,
             callback_url : `https://server.dartafrica.io/flutter/webhook/payment/status/${reference}`,
            beneficiary_name: accountName,
          
          }  
         // console.log(params)
      const  sendmoney = await axios.post('https://api.flutterwave.com/v3/transfers', params, {headers: headers}) 
         // console.log(sendmoney.data)
        
  
      return sendmoney
    } catch (err) { 
      console.log(err)
      return err
    }
  }


 const makePaymentMobile = async (account_bank , account_number  , amount, narration , currency, reference, accountName) => {
    try {
     // const referenceNumber =
      console.log("make payment")
      const headers = {
          'Authorization': process.env.flutterwaveToken,
          'Content-Type': 'application/json'      
          }
          const params = {

            account_bank: account_bank,
            account_number:  `233${account_number}`,
            amount: amount,
            narration: narration || "Withdraw funds",
            currency: currency,
            reference : `${reference}`,
          
            callback_url : `https://server.dartafrica.io/flutter/webhook/payment/status/${reference}`,
            beneficiary_name: accountName,
          
          }  
         // console.log(params)
      const  sendmoney = await axios.post('https://api.flutterwave.com/v3/transfers', params, {headers: headers}) 
         // console.log(sendmoney.data)
        
  
      return sendmoney
    } catch (err) { 
      console.log(err)
      return err
    }
  }      
  
  

async function processEmail(emailFrom, emailTo, subject, link, link2, text, fName){
    try{
        
        // await delay();
       const sendmail =  await sendemail.emailUtility(emailFrom, emailTo, subject, link, link2, text, fName);
     //  console.log(sendmail)
        return sendmail
    }catch(err){
        console.log(err)
        return err
    }
  
  };

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



exports.getAccountName = async (req, res) => {
    const {account_bank, account_number} = req.body;
    if ( account_bank  && account_number  ){

        if ( account_number === ""  || account_bank ==="" ){
            res.status(400).send({
                status: 400,
                message:"Incorrect entry format"
            });
        }else{
            try{
            
                const headers = {
                    'Authorization': process.env.flutterwaveToken,
                    'Content-Type': 'application/json'      
                    }
                     params =  {
                        account_number: account_number,
                        account_bank: account_bank 
                     }
                
                const  getBankName = await axios.post('https://api.flutterwave.com/v3/accounts/resolve', params, {headers: headers}) 
                 console.log(getBankName.data) 
                    let bankName = getBankName.data.data
                    if(getBankName.status === 200){
                        
                        
                        res.status(200).send({ status: 200, message:bankName})
                    }else{
                        res.status(400).send({ status: 400, message: "error while calling flutter wave"})
                    }
            }catch(err){ 
                console.log(err.response.data)
                if(err.response.status === 400){
                    res.status(400).send({ status: 400, message:err.response.data})
                }else{
                    res.status(500).send({ status: 500, message:err.response.data})
                }
                
            }
        }
    }else{

        res.status(400).send({
            status: 400,
            message:"Incorrect entry format"
        });

    }
};