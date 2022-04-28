const db = require("../mongoose");
const Notifications = db.notifications;
const sendemail = require('../helpers/emailhelper.js');
const dotenv=require('dotenv');
dotenv.config();
const axios = require('axios');

const admin = require("firebase-admin");

const serviceAccount = require("../../firebase.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});


exports.postDeviceToken = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status: 400, message:"Content cannot be empty"});
    }
    
 
    const { deviceToken } = req.body;
  
    if (deviceToken){
          if ( deviceToken==="" ){
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
           }else{   
               
               
       
            try{
            
                 const saveDeviceToken = new Notifications({
                        deviceToken: deviceToken
                     });
                     const isTokenExist = await Notifications.findOne({deviceToken: deviceToken} )
                     if(isTokenExist){
                        res.status(400).send({ status: 400,message:"Device token already exist "})
                     }else{
                        const savetoken = await saveDeviceToken.save()
                        res.status(201).send({ status: 201,message:"Token Saved successfully "})
                    }
                  }catch(err){
                        console.log(err)
                        res.status(500).send({ status: 500,message:"Error while saving token "})
             }
           }
            }else{
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
            }
};

exports.sendInAppNotification = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status: 400, message:"Content cannot be empty"});
    }
    
 
    const { title, body } = req.body;
  
    if (title && body ){
          if ( title ==="" ||  body === "" ){
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
           }else{   
 
            try{
                     const tokensObject = await Notifications.find({},{'deviceToken': 1, '_id': 0})
                     var tokens = tokensObject.map(function(item) {
                        return item['deviceToken'];
                      });
                      
                     console.log(tokens)
                    const notifications =  await admin.messaging().sendMulticast({
                        tokens,
                        notification: {
                          title,
                          body,
                        },
                      });
                      console.log(notifications)
                     res.status(201).send({ status: 201,message:"Notification Sent successfully "})
                
                  }catch(err){
                        console.log(err)
                        res.status(500).send({ status: 500,message:"Error while sending Notification "})
             }
           }
            }else{
                res.status(400).send({
                    status: 400,
                    message:"Incorrect entry format"
                });
            }
};

// contact support
exports.contactSupport = async(req,res)=>{
        if (!req.body){
            res.status(400).send({ status: 400, message:"Content cannot be empty"});
        }
        
     
        const { firstName, lastName, message,email } = req.body;
      
        if ( firstName && lastName && message  && email ){
              if ( firstName==="" || lastName=== "" ||   message===""   || email==="" ){
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
                     const emailTo = process.env.usersupport
                     const emailFrom = from
                     const subject = process.env.supportSubjectMessage
                     const name =  ` ${lastName} ${firstName}`
                     processEmailSupportSystem(emailFrom, emailTo, subject,  message, name, email);
                     res.status(200).send({ status: 200, message:"Sent  Succesfully"}) 
                    
                      }catch(err){
                            console.log(err)
                            res.status(500).send({ status: 500,message:"Error while creating profile "})
                 }
               }
                }else{
                    res.status(400).send({
                        status: 400,
                        message:"Incorrect entry format"
                    });
                }
};
    
// get digital ocean balance
 exports.getDropletBalance = async (req, res) => {
                try{
                    const headers = {
                        'Authorization': process.env.digitalBearer,
                        'Content-Type': 'application/json',
                        
                        }
                    params = {
                                apiKey:process.env.apiKey
                        }
                    const  getBalnce = await axios.get(' https://api.digitalocean.com/v2/customers/my/balance', {headers: headers}) 
                        res.status(200).send({Balance:getBalnce.data})
                  
                   }catch(err){
                       console.log(err)
                       res.status(500).send({message:"Error while getting balance "})
                   }
 };

const processEmailSupportSystem = async (emailFrom, emailTo, emailSubject,   text, name, email ) => {
                try{
            
                   const sendmail =  await sendemail.emailSupportSystem(emailFrom, emailTo, emailSubject,   text, name, email);
                   console.log(sendmail)
                    return sendmail
                }catch(err){
                    console.log(err)
                    return err
                }
            
 }

            
            