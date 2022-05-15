
const db = require("../mongoose");
const Members = db.profiles;
const Auths = db.auths;
const Trades = db.trades;
const Transactions = db.transactions;
const passwordUtils =require('../helpers/passwordUtils');
const jwtTokenUtils = require('../helpers/jwtTokenUtils.js');
const sendemail = require('../helpers/emailhelper.js');

const { signToken } = jwtTokenUtils;
const uuid = require('uuid')
const speakeasy = require('speakeasy')
const dotenv=require('dotenv');
dotenv.config();


// Register a new User
exports.createSeller = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const codeGenerated =  getCode();
    const myRefCode = await  generateReferralCode()
    const { username,email,password,phoneNumber,country, countryTag, refferedBy  } = req.body;
   
    if (username && email && password && phoneNumber && country && countryTag ){
          if(username==="" ||  password===""  || email==="" || phoneNumber===  "" || country=== "" || countryTag === "" ){
                res.status(400).send({
                    status : 400,
                    message:"Incorrect entry format"
                });
          }else{ 

            if(refferedBy){
                var isCodeExist = await Members.findOne({referralCode: refferedBy})
                 if(!isCodeExist) return res.status(400).send({status:400,message:"Refferral code not valid"})
                 var  members = new Members({
                    username: username,
                    role: "Seller",
                    phoneNumber: phoneNumber,
                    email: email.toLowerCase(),
                    forgotPasswordCode: '',
                    isVerified: false,
                    walletBalance: 0.00,
                    verificationCode: codeGenerated,
                    isEnabled: true,
                    forgotPasswordCodeStatus: false,
                    accountDetails : [],
                    isSetPin: false,
                    imageUrl: "",
                    country: country,
                    countryTag: countryTag,
                    referralCode: myRefCode,
                    referredBy: isCodeExist.id ,
                    referralBonusCount: 0,
                    referralBonusAmount: 0,
                    referralBonusUsers: []
                    });
             }else{
                var  members = new Members({
                    username: username,
                    role: "Seller",
                    phoneNumber: phoneNumber,
                    email: email.toLowerCase(),
                    forgotPasswordCode: '',
                    isVerified: false,
                    walletBalance: 0.00,
                    verificationCode: codeGenerated,
                    isEnabled: true,
                    forgotPasswordCodeStatus: false,
                    accountDetails : [],
                    isSetPin: false,
                    imageUrl: "",
                    country: country,
                    countryTag: countryTag,
                    referralCode: myRefCode,
                    referralBonusCount: 0,
                    referralBonusAmount: 0,
                    referralBonusUsers: []
                    });
             }
                            const auths = new Auths({ 
                                email: req.body.email.toLowerCase(),
                                pin: ""           
                            });
       
                            try{
                            const isUserExist = await Members.findOne({ $or:[{'email': email.toLowerCase()}, {'phoneNumber': phoneNumber} ]} )
                                     if(isUserExist){
                                          res.status(400).send({status:400,message:" Email already exists"})
                                     }else{
                                            auths.password = await passwordUtils.hashPassword(password);
                                            from = {
                                                name: process.env.emailName,
                                                address: process.env.user	
                                            }
                                            const emailFrom = from;
                                            const subject = 'Verification link';                      
                                            const hostUrl = ""+process.env.hostUrl+"/verifyemail/auth/activate/"+codeGenerated+""
                                            const hostUrl2 = ""+process.env.hostUrl2+"/verifyemail/auth/activate/"+codeGenerated+"" 
                                            const username = req.body.username
                                            const   text = 'Welcome to Dart Africa, verify your account by clicking the link below'
                                            const emailTo = req.body.email.toLowerCase();
                                            const link = `${hostUrl}`;
                                            const link2 = `${hostUrl2}`;
                                            processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                            const saveauth = await  auths.save()
                                             console.log(saveauth)
                                                if(saveauth._id){
                                                    const savemember = await  members.save()
                                                    console.log(savemember)
                                                    if( savemember._id){
                                                                  
                                                   res.status(201).send({ status:200, message:"User  created"})
                                            
                                                    }else{
                                                        res.status(400).send({ status:400,message:"Error while creating profile "})
                                                    }
                                                }
            
                                            }
                 
                
                            }catch(err){
                                    console.log(err)
                                    res.status(500).send(  {status: 500, message:"Error while creating profile "})
                                      }
          }
            } 
            else{
                res.status(400).send({
                    status:400,
                    message:"Incorrect entry format"
                });
            }
};

// Register a new User
exports.createSubAdmin = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const codeGenerated =  getCode();
    const { username,email,password,phoneNumber  } = req.body;
    if (username && email && password && phoneNumber ){
          if(username==="" ||  password===""  || email==="" || phoneNumber===  "" ){
                res.status(400).send({
                    status : 400,
                    message:"Incorrect entry format"
                });
          }else{ 
                const members = new Members({
                            username: username,
                            role: "SubAdmin",
                            phoneNumber: phoneNumber,
                            email: email.toLowerCase(),
                            forgotPasswordCode: '',
                            isVerified: false,
                            verificationCode: codeGenerated,
                            isEnabled: true,
                            forgotPasswordCodeStatus: false,
                            imageUrl: "",
                            isAuthSecret: true
                            });
                            
                            const auths = new Auths({ 
                                email: req.body.email.toLowerCase()             
                            });
       
                            try{
                            const isUserExist = await Members.findOne({email: email.toLowerCase()} )
                                     if(isUserExist){
                                          res.status(400).send({status:400,message:" Email already exists"})
                                     }else{
                                        from = {
                                            name: process.env.emailName,
                                            address: process.env.user	
                                        }
                                            auths.password = await passwordUtils.hashPassword(password);
                                           
                                            const myAuthSecret = await generateAuthSecret()
                                            if(myAuthSecret.base32){  
                                                    auths.authSecret = myAuthSecret
                                                    const emailFrom = from;
                                                    const subject = 'Verification link';                      
                                                    const hostUrl = ""+process.env.hostUrl+"/verifyemail/auth/activate/"+codeGenerated+""
                                                    const hostUrl2 = ""+process.env.hostUrl2+"/verifyemail/auth/activate/"+codeGenerated+"" 
                                                    const username = req.body.username
                                                    const   text = 'Welcome to Dart Africa, verify your account by clicking the link below'
                                                    const emailTo = req.body.email.toLowerCase();
                                                    const link = `${hostUrl}`;
                                                    const link2 = `${hostUrl2}`;
                                                    processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                                    const saveauth = await  auths.save()
                                                    console.log(saveauth)
                                                        if(saveauth._id){
                                                            const savemember = await  members.save()
                                                            console.log(savemember)
                                                            if( savemember._id){
                                                                        
                                                        res.status(201).send({ status:200, message:"User  created", data: myAuthSecret})
                                                    
                                                            }else{
                                                                res.status(400).send({ status:400,message:"Error while creating profile "})
                                                            }
                                                        }
                                            }else{
                                                res.status(400).send(  {status: 400, message:"Error from creating auth secret"})
                                            }
                                        }
                 
                
                            }catch(err){
                                    console.log(err)
                                    res.status(500).send(  {status: 500, message:"Error while creating profile "})
                                      }
          }
            } 
            else{
                res.status(400).send({
                    status:400,
                    message:"Incorrect entry format"
                });
            }
};
// Verify a new user
exports.verifyUser = async (req, res) => {
    if (!req.body){
      res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { verificationCode  } = req.body;
    if(verificationCode){
        if(verificationCode===""){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{   
            try{
                const findVerificationCode = await Members.findOne({verificationCode: verificationCode})
                    if(findVerificationCode){
                        if(findVerificationCode.isVerified === false){
                            const _id =  findVerificationCode._id
                            const verifyUser = await Members.findOneAndUpdate({ _id}, { isVerified: true });
                            if(verifyUser){
                                const clearCode = await Members.findOneAndUpdate({ _id}, { verificationCode: "" });
                                res.status(200).send({ status:200, message:"Email Verified succesfully "})
                            }else{
                                res.status(400).send({ status:400,message:" Error while verifying user "})
                             }                                         
                        }else{
                            res.status(400).send({ status:400,message:" Email has already been verified"})
                        }
                    }else{
                        res.status(400).send({ status:400,message:" Link has been used or Invalid code"})
                    }
                                     
                                    
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while verifying member "})
            }
        }
    }
    else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// User's Login
exports.signIn = async(req, res) => {
    if (!req.body){
    res.status(400).send({ status:400,message:"Content cannot be empty"});    
    }
    const {email, password  } = req.body;
    if ( email && password  ){
        if ( email==="" || password===""){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{
            try{
                const User = await Members.findOne({email: email.toLowerCase()} )
                const Auth = await Auths.findOne({email: email.toLowerCase()} )
                if(User){
                    const retrievedPassword = Auth.password
                    const id = User._id;
                    const {  username,    phoneNumber, email, isVerified, isEnabled, walletBalance , role, coinWallets, isSetPin, imageUrl, country, countryTag, isAuthSecret,referralCode,referralBonusCount,referralBonusAmount } = User
                    const accountDetails = User.accountDetails || []
                    const isMatch = await passwordUtils.comparePassword(password, retrievedPassword);
                    console.log(isMatch )         
                    if(isMatch){
                        if (User.isEnabled === false){
                            res.status(400).json({ status:400,message:"Your account has been disabled contact the admin to enable your account"})
                        }
                        else{ 
                            if (User.isVerified === false){
                                res.status(400).json({ status:400,message:"This account has not been verified, check your mail for verification link"})
                            }else{
                                const tokens = signToken( id, username, phoneNumber , email, isVerified, isEnabled, walletBalance, role, coinWallets, accountDetails, isSetPin, imageUrl,country, countryTag ) 
                                let user = {}
                                user.profile = { id,username, phoneNumber , email, isVerified, isEnabled, walletBalance, role, accountDetails, coinWallets, isSetPin, imageUrl,country, countryTag ,isAuthSecret,referralCode,referralBonusCount,referralBonusAmount} 
                                user.token = tokens;                
                                res.status(200).send({status:200,message:user})  
                            }
                        }  
                    }else{
                        res.status(400).json({ status:400,message:"Incorrect Login Details"})
                    }
                    
        
                }else{
                res.status(400).send({status:400,message:"Incorrect Login Details"})
                }
                    
                
            }catch(err){
                console.log(err)
                res.status(500).send({status:500,message:"Error while signing in "})
            }
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

//  forget password
exports.forgotPassword = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { email } = req.body;
    if (email){
        if ( email===""   ){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{
            try{
                const isUserExist = await Members.findOne({email: email.toLowerCase()} )
                const isUserExist2 = await Auths.findOne({email: email.toLowerCase()} )
                if(isUserExist && isUserExist2){ 
                    const code = uuid.v1()
                    const _id = isUserExist._id;
                    const saveCode = await Members.findOneAndUpdate({ _id }, { forgotPasswordCode: code });
                    console.log(saveCode)
                    if(saveCode){
                        from = {
                            name: process.env.emailName,
                            address: process.env.user	
                        }
        
                        const username = isUserExist.username;
                        const emailFrom = from;
                        const subject = 'Reset password link';                      
                        const hostUrl = ""+process.env.hostUrl+"/resetpassword?code="+code+""
                        const hostUrl2 = ""+process.env.hostUrl2+"/resetpassword?code="+code+""   
                        const   text = "Your password reset link is shown below. Click on the reset button to change your password"
                        const emailTo = req.body.email.toLowerCase();
                        const link = `${hostUrl}`;
                        const link2 = `${hostUrl2}`;
                        processEmailForgotPassword(emailFrom, emailTo, subject, link, link2, text, username);
                        res.status(201).send({ status:200, message:"Reset link sent succesfully"})
                    }{ 
                    //  res.status(400).send({message:"User does not exist"})

                    }                  
                }
                else{
                  res.status(400).send({status:400, message:"User does not exist"})
                }
                       
                
            }catch(err){
                console.log(err)
                res.status(500).send({status:500,message:"Error while resetting password   "})
            }
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// reset password
exports.resetPassword = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { password, code} = req.body;
    if (password && code){
        if ( password === " " || code === " "  ){
            res.status(400).send({
                status:400,
                message:"One of the entry is empty"
            });
        }else{
            try{
                const getuser = await Members.findOne({forgotPasswordCode: req.body.code} )
                if(getuser){
                    const temporaryPassword = req.body.password
                    const newpassword = await passwordUtils.hashPassword(temporaryPassword);
                    const getAuth = await Auths.findOne({email: getuser.email} ) 
                    const _id =  getAuth._id
                    const newForgotPasswordCode = ""
                    const updatePassword = await Auths.findOneAndUpdate({ _id}, { password: newpassword });
                    if(updatePassword){
                        const _id =   getuser._id 
                        const updateCode = await Members.findOneAndUpdate({_id}, { forgotPasswordCode: newForgotPasswordCode  });
                        const updateCodeStatus = await Members.findOneAndUpdate({_id}, { forgotPasswordCodeStatus: false  });
                       
                        res.status(200).send({status:200,message:"Password reset was succesfull"})
                    }            
                    }else{
                        res.status(400).send({
                            status:400,
                            message:"This link you selected has already been used. or invalid "
                        });
                    } 
                
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while creating profile "})
            }
        }
        }else{
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
       }
};

// verify password link
exports.verifyForgotpasswordlink = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
   
    const { code} = req.body;
  
    if ( code ){
        if (  code === ""  ){
            res.status(400).send({
                status:400,
                message:"One of the entry is empty"
            });
        }else{
            try{
              const getcode = await Members.findOne({forgotPasswordCode: req.body.code} ) 
              if(getcode){
                        if(getcode.forgotPasswordCodeStatus === true){
                            res.status(400).send({
                                status:400,
                                message:"This link you selected has been used "
                            });
                        }else{
                            console.log(getcode)
                            const _id =   getcode._id 
                            //const updateCode = await Members.findOneAndUpdate({_id}, { forgotPasswordCodeStatus: true  });
                            res.status(200).send({ status:200,message:"Link is valid"})
                        }      
               }else{
                res.status(400).send({
                    status:400,
                    message:"This link you selected is invalid or has expired"
                });
            } 
                
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while creating profile "})
            }
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// Update members details
exports.updateMember = async(req, res) => {
    const _id = req.user.id;
    console.log( req.user.id)

    const { username,role,email,isEnabled,phoneNumber, isVerified, walletBalance, accountDetails, coinWallets, isSetPin} = req.body;
  
    if ( username && role  && email  && phoneNumber  &&coinWallets&& accountDetails ){
          if ( username==="" ||  role==="" || email==="" || phoneNumber===  ""){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format5"
            });
        }else{   
            const member = new Members({
                _id : _id,
                username: req.body.username,
                role: req.user.role,
                phoneNumber:req.body.phoneNumber,
                email: req.user.email.toLowerCase(),
                forgotPasswordCode: req.body.forgotPasswordCode || '',
                isVerified: req.user.isVerified,
                walletBalance: req.user.walletBalance ,
                verificationCode: req.body.verificationCode || '',
                isEnabled:  req.user.isEnabled,
                forgotPasswordCodeStatus: req.body.forgotPasswordCodeStatus,
                accountDetails : req.body.accountDetails,
                isSetPin: req.user.isSetPin
              });

            try{
                const updateProfile = await Members.updateOne( {_id}, member)
                    //console.log(updateProfile)                       
                 res.status(200).send({ status:200, message:"Profile updated  succesfully"})
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500, message:"Error while updating profile "})
            }   
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format6"
        });
    }
                   
};

exports.createAccountDetails = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }


    const { accountType, mobileNetwork,  mobileNumber, bankName, bankBranch, accountNumber, accountName, bankCode, branchName } = req.body;
    if (accountType){
        if (accountType === "Bank"){
                if ( bankName && accountNumber && accountName && bankBranch && bankCode  ){
                    if ( bankName === "" || accountNumber === "" ||  accountName === ""  || bankBranch === ""){
                        res.status(400).send({
                            status:400,
                            message:"Incorrect entry format"
                        });
                    }else{
                        const accountdetails ={
                            bankName: bankName,
                            accountNumber : accountNumber,
                            accountName: accountName,
                            bankBranch: bankBranch,
                            accountType: accountType,
                            bankCode: bankCode,
                            branchName: branchName,
                            id : uuid.v1() 
                            }       
                        try{ 
                            const postAccountNumber = await Members.updateOne({_id: req.user.id}, { $addToSet: { accountDetails: [accountdetails] } } ) 
                            const findMemberById = await Members.findOne({_id: req.user.id})
                    
                            res.status(200).send({  status:200,message:"Account details added succesfully", accountDetails : findMemberById.accountDetails})           
                            
                        }catch(err){
                            console.log(err)
                            res.status(500).send({  status:500, message:"Error while updating account details "})
                        }
                    }
                }else{
                    res.status(400).send({
                        status:400,
                        message:"Incorrect entry format"
                    });
                }

        }else{
                if ( mobileNetwork && mobileNumber  ){
                    if ( mobileNetwork === "" || mobileNumber === ""){
                        res.status(400).send({
                            status:400,
                            message:"Incorrect entry format"
                        });
                    }else{
                        const accountdetails ={
                            mobileNetwork: mobileNetwork,
                            mobileNumber : mobileNumber,
                            accountType: accountType,
                            accountName: accountName,
                            id : uuid.v1() 
                            }
                                
                        try{ 
                            const postAccountNumber = await Members.updateOne({_id: req.user.id}, { $addToSet: { accountDetails: [accountdetails] } } ) 
                            const findMemberById = await Members.findOne({_id: req.user.id})
                    
                            res.status(200).send({  status:200,message:"Account details added succesfully", accountDetails : findMemberById.accountDetails})           
                            
                        }catch(err){
                            console.log(err)
                            res.status(500).send({  status:500, message:"Error while updating account details "})
                        }
                    }
                }else{
                    res.status(400).send({
                        status:400,
                        message:"Incorrect entry format"
                    });
                }
        }
    }else{
        res.status(400).send({ status:400,message:"Account type field must be available"});
    }

}

exports.updateAccountDetails = async(req,res)=>{
    if (!req.body){
        res.status(400).send({  status:400, message:"Content cannot be empty"});
    }

    const { accountType, mobileNetwork,  mobileNumber, bankName, bankBranch, accountNumber, accountName , bankCode, branchName} = req.body;
    if (accountType){
        if (accountType === "Bank"){
            if ( bankName && accountNumber && accountName && bankBranch && bankCode ){
                if ( bankName === "" || accountNumber === "" ||  accountName === ""  || bankBranch === "" || bankCode === ""){
                    res.status(400).send({
                        status:400,
                        message:"Incorrect entry format"
                    });
                }else{
                    const accountId  = req.params.id
                    const _id = req.user.id
            
                    try{
                    
                    
                        const updateAccountDetails = await Members.updateOne( { _id: _id, "accountDetails.id": accountId },  { $set: {  
                            "accountDetails.$.id" : accountId,
                            "accountDetails.$.bankName": bankName,
                            "accountDetails.$.accountNumber" : accountNumber,
                            "accountDetails.$.bankName" : bankName,
                            "accountDetails.$.bankBranch" : bankBranch,
                            "accountDetails.$.accountType" : accountType,
                            "accountDetails.$.bankCode" : bankCode,
                            "accountDetails.$.branchName" : branchName
                        }})
                        const findMemberById = await Members.findOne({_id: req.user.id})
                        //   console.log(findMemberById)        
                        res.status(200).send({  status:200, message:"Account details updated succesfully", accountDetails : findMemberById.accountDetails})           
                        
                    }catch(err){
                        console.log(err)
                        res.status(500).send({  status:500, message:"Error while updating account details "})
                    }
                }
            }else{
                res.status(400).send({
                    status:400,
                    message:"Incorrect entry format"
                });
            }
        }else{
            if ( mobileNetwork && mobileNumber&& accountName  ){
                if ( mobileNetwork === "" || mobileNumber === "" ){
                    res.status(400).send({
                        status:400,
                        message:"Incorrect entry format"
                    });
                }else{
                    const accountId  = req.params.id
                    const _id = req.user.id
            
                    try{
                        const updateAccountDetails = await Members.updateOne( { _id: _id, "accountDetails.id": accountId },  { $set: {  
                            "accountDetails.$.id" : accountId,
                            "accountDetails.$.mobileNumber": mobileNumber,
                            "accountDetails.$.mobileNetwork" : mobileNetwork,
                            "accountDetails.$.accountType": accountType,
                            "accountDetails.$.accountName": accountName
                        }})
                        const findMemberById = await Members.findOne({_id: req.user.id})
                        //   console.log(findMemberById)        
                        res.status(200).send({  status:200, message:"Account details updated succesfully", accountDetails : findMemberById.accountDetails})           
                        
                    }catch(err){
                        console.log(err)
                        res.status(500).send({  status:500, message:"Error while updating account details "})
                    }
                }
            }else{
                res.status(400).send({
                    status:400,
                    message:"Incorrect entry format"
                });
            }

        }

    }else{
    res.status(400).send({ status:400,message:"Account type field must be available"});
  }
}

// change password
exports.ChangePassword = async(req,res)=>{
    if (!req.body){
        res.status(400).send({  status:400, message:"Content cannot be empty"});
    }
//console.log(req.body)
  // let {myrefCode} = req.query;
    const { oldPassword, newPassword} = req.body;
  
    if ( oldPassword && newPassword  ){
        if ( newPassword==="" || oldPassword===""  ){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{

            try{
                const email = req.user.email
                console.log(req.user.email)
           
              const getpassword = await Auths.findOne({email: email} )
              const retrievedPassword = getpassword.password
              const isMatch = await passwordUtils.comparePassword(oldPassword, retrievedPassword);
              console.log(isMatch )
               if (isMatch){ 
                const newpassword = await passwordUtils.hashPassword(req.body.newPassword);
                console.log("newpassword")
                console.log(newpassword) 
                console.log(getpassword._id)              
               
                const _id  = getpassword._id
                const updatePassword = await Auths.findOneAndUpdate({ _id }, { password: newpassword });
                console.log(updatePassword)

                // const emailFrom = process.env.user;;
                // const subject = 'Reset Password Succesful ';                      
                // const hostUrl = process.env.hostUrl
                //  const hostUrl2 = process.env.hostUrl2  
                // const   text = "Your password has just been changed"
                // const emailTo = req.user.email.toLowerCase();
                // const link = `${hostUrl}`;
                // const link2 = `${hostUrl2}`;
                //  processEmail(emailFrom, emailTo, subject, link, link2, text, req.user.username);
                  
                res.status(200).send({  status:200, message:"Password changed succesfully"})
                                 
             
               }else{
                res.status(400).send({  status:400, message:"Incorrect old password "})
               }        
                
            }catch(err){
                console.log(err)
                res.status(500).send({
                    status:500, message:"Error while changing password "})
            }
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
}


// find member by the id 
exports.findMembeById = async (req, res) => {
    try{
        let id = req.params.id
        const findMemberById = await Members.findOne({_id: id}).populate('referredBy').populate('referralBonusUsers')
        res.status(200).send({ status: 200, message :findMemberById})         
    }catch(err){
        console.log(err)
        res.status(500).send({ status:500,message:"Error while getting member "})
    }
};

// resend verification link
exports.resendVerificationLink = async (req, res) => {
    if (!req.body){
      res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const  email  = req.body.email.toLowerCase();
    if(email){
        if(email===""){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{   
            try{
                const isUserExist = await Members.findOne({email: email})
                    if(isUserExist){
                        if(isUserExist.isVerified === false){
                            from = {
                                name: process.env.emailName,
                                address: process.env.user	
                            }
                            const emailFrom = from;
                            const subject = 'Verification link';                      
                            const hostUrl = ""+process.env.hostUrl+"/verifyemail/auth/activate/"+isUserExist.verificationCode+""
                            const hostUrl2 = ""+process.env.hostUrl2+"/verifyemail/auth/activate/"+isUserExist.verificationCode+"" 
                            const username = isUserExist.username
                            const   text = 'Welcome to Dart Africa, verify your account by clicking the link below'
                            const emailTo = email
                            const link = `${hostUrl}`;
                            const link2 = `${hostUrl2}`;
                            processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                res.status(200).send({ status:200, message:"Email Verification link resent succesfully "})
                                                                   
                        }else{
                            res.status(400).send({ status:400,message:"Email has already been verified"})
                        }
                    }else{
                        res.status(400).send({ status:400,message:"User does not exist"})
                    }
                                     
                                    
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while verifying member "})
            }
        }
    }
    else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// admin enable user
exports.enableUser = async (req, res) => {
    if (!req.body){
        res.status(400).send({ status:400, message:"Content cannot be empty"});
    }
    console.log(req.body)
    const { userId  } = req.body;
  
    if ( userId ){
          if ( userId===""  ){
                res.status(400).send({
                    status:400,
                    message:"Incorrect entry format"
                });
           }else{   
    
                            try{
                               
                                const isUserExist = await Members.findOne({_id: userId})
                                        if(isUserExist){
                                             
                                             const _id =  isUserExist._id
                                             const enableUser = await Members.findOneAndUpdate({ _id}, { isEnabled: true });
                                                        if(enableUser){
                                                           
                                                            res.status(200).send({status:200, message :" User Enabled succesfully"})
                                                        }else{
                                                            res.status(400).send({status:400, message:" Error while enabling user "})
                                                        }                                         
                                             
                                              }else{
                                                res.status(400).send({ status:400,message:"  Invalid user"})
                                            }
                                     
                                    
                                }catch(err){
                                    console.log(err)
                                    res.status(500).send({ status:500,message:"Error while enabling user "})
                                }
              }
          }
        else{
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }
         };


// admin disable user
exports.disableUser = async (req, res) => {
            if (!req.body){
                res.status(400).send({ status:400, message:"Content cannot be empty"});
            }
            console.log(req.body)
            const { userId  } = req.body;
          
            if ( userId ){
                  if ( userId===""  ){
                        res.status(400).send({
                            status:400,
                            message:"Incorrect entry format"
                        });
                   }else{   
            
                                    try{
                                       
                                        const isUserExist = await Members.findOne({_id: userId})
                                                if(isUserExist){
                                                     
                                                     const _id =  isUserExist._id
                                                     const enableUser = await Members.findOneAndUpdate({ _id}, { isEnabled: false });
                                                                if(enableUser){
                                                                   
                                                                    res.status(200).send( {status:200, messaage: " User Disabled succesfully"})
                                                                }else{
                                                                    res.status(400).send({ status:400, message:" Error while enabling user "})
                                                                }                                         
                                                     
                                                      }else{
                                                        res.status(400).send({ status:400, message:"  Invalid user"})
                                                    }
                                             
                                            
                                        }catch(err){
                                            console.log(err)
                                            res.status(500).send({ status:500, message:"Error while enabling user "})
                                        }
                      }
                  }
                else{
                    res.status(400).send({
                        status:400,
                        message:"Incorrect entry format"
                    });
                }
                 };

// Find all members
exports.findAllMembers = async (req, res) => {
    try{
        
        const{ limit}= req.query
        const{ role}= req.query
        if(role){
                if(role === "Admin"){
                    res.status(400).send({ status: 400, message:"You can get admin users "})
                }else{
                    if(limit){
                        const findAllMembers = await Members.find({role: role}).sort({"_id": -1}).limit(limit).populate('referredBy').populate('referralBonusUsers')
                    console.log(findAllMembers)
                    res.status(200).send( {status: 200, message: findAllMembers})
                    }else{
                        const findAllMembers = await Members.find({role: role}).sort({"_id": -1})    
                    console.log(findAllMembers)
                    res.status(200).send( {status: 200, message: findAllMembers})
                    }
                    
                }
        }else{
            res.status(400).send({ status: 400, message:"please provide a role"})
        }
    }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting all users "})
    }
};



exports.deleteAccountDetails = async(req,res)=>{
 

            
                    const accountId  = req.params.id
                    const _id = req.user.id
            
                    try{
                    
                    
                        const deleteAccountDetails = await Members.updateOne(
                            { _id: _id },
                            { $pull: { accountDetails: { id: accountId} } },
                            { multi: true }
                          )
                        const findMemberById = await Members.findOne({_id: req.user.id})
                        //   console.log(findMemberById)        
                        res.status(200).send({  status:200, message:"Account details deleted succesfully", accountDetails : findMemberById.accountDetails})           
                        
                    }catch(err){
                        console.log(err)
                        res.status(500).send({  status:500, message:"Error while deleting account details "})
                    }
                
            
        

    
}

// create transaction pin
exports.createPin = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { pin  } = req.body;
    if (pin ){
          if(Number.isInteger(pin) &&  pin.toString().length === 4  ){
            try{
                 const email = req.user.email
                 const isUserExist = await Members.findOne({email: email.toLowerCase()} )
                 const isAuthExist = await Auths.findOne({email: email.toLowerCase()} )
                         if(isUserExist && isAuthExist ){
                            if(isUserExist.isSetPin === false &&  isAuthExist.pin === ""  ){
                                hashedPin = await passwordUtils.hashPassword(pin);
                                
                                const _id = isAuthExist._id
                                from = {
                                    name: process.env.emailName,
                                    address: process.env.user	
                                }
                                const emailFrom = from;
                                const subject = 'Pin created';                      
                                const hostUrl =  process.env.hostUrl
                                const hostUrl2 = process.env.hostUrl2 
                                const username = req.user.username
                                const text = 'This is to inform you that you created a pin for your transactions'
                                const emailTo = req.user.email.toLowerCase();
                                const link = `${hostUrl}`;
                                const link2 = `${hostUrl2}`;
                                processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                                const updatePin = await Auths.findOneAndUpdate({ _id }, { pin: hashedPin });
                                if(updatePin ){
                                
                                    const updateProfile = await Members.updateOne({ _id: req.user.id }, { isSetPin: true });
                                    res.status(201).send({ status:200, message:"User pin  created"})
                                }else{
                                    res.status(400).send({status:400,message:"Error while updating pin"})  
                                }
                            }else{
                                res.status(400).send({status:400,message:"You pin has been created previously"})  
                            }
                         }else{
                            
                            res.status(400).send({status:400,message:"User details not found"})  

                        }
     
    
                }catch(err){
                        console.log(err)
                        res.status(500).send(  {status: 500, message:"Error while creating pin "})
                          }
          }else{ 
            res.status(400).send({
                status : 400,
                message:"Pin must be an integer and length must be equal to 4" 
            });             
          }
    } 
    else{
            res.status(400).send({
                status:400,
                message:"Pin field not provided"
            });
       }
};

// change pin
exports.updatePin = async(req,res)=>{
    if (!req.body){
        res.status(400).send({  status:400, message:"Content cannot be empty"});
    }
console.log(req.body)
  // let {myrefCode} = req.query;
    const { oldPin, newPin} = req.body;
    console.log(Number.isInteger(newPin))
    console.log(req.body.newPin.length)
    if ( oldPin && newPin  ){
        if(Number.isInteger(newPin) &&  newPin.toString().length === 4  ){
            try{
                const email = req.user.email
                console.log(req.user.email)
           
              const getpin = await Auths.findOne({email: email} )
              const retrievedPin = getpin.pin
              const isMatch = await passwordUtils.comparePassword(oldPin, retrievedPin);
              console.log(isMatch )
               if (isMatch){ 
                const harsedPin = await passwordUtils.hashPassword(req.body.newPin);
                console.log("newpin")
                console.log(harsedPin) 
                           
               
                const _id  = getpin._id
                const updatePin = await Auths.findOneAndUpdate({ _id }, { pin: harsedPin });
                console.log(updatePin)
                from = {
                    name: process.env.emailName,
                    address: process.env.user	
                }
                const emailFrom = from;
                const subject = 'Pin changed Successfully ';                      
                const hostUrl = process.env.hostUrl
                 const hostUrl2 = process.env.hostUrl2  
                const   text = "Your pin has just been changed"
                const emailTo = req.user.email.toLowerCase();
                const link = `${hostUrl}`;
                const link2 = `${hostUrl2}`;
                 processEmail(emailFrom, emailTo, subject, link, link2, text, req.user.username);
                  
                res.status(200).send({  status:200, message:"Pin changed succesfully"})
                                 
             
               }else{
                res.status(400).send({  status:400, message:"Incorrect old pin "})
               }        
                
            }catch(err){
                console.log(err)
                res.status(500).send({
                    status:500, message:"Error while changing pin "})
            }
        }else{

            res.status(400).send({
                status:400,
                message:"Pin must be an integer and length must be equal to 4" 
            });

           
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

//  forget pin
exports.forgotPin = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { email , phoneNumber} = req.body;
    if (email && phoneNumber  ){
        if ( email==="" || phoneNumber === "" ){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{
            try{
                const isUserExist = await Members.findOne({email: email.toLowerCase(), phoneNumber: phoneNumber } )
                const isUserExist2 = await Auths.findOne({email: email.toLowerCase()} )
                if(isUserExist && isUserExist2){ 
                    const code = getCode();
                    const _id = isUserExist._id;
                    const saveCode = await Members.findOneAndUpdate({ _id }, { forgotPasswordCode: code });
                    console.log(saveCode)
                    if(saveCode){
                        const username = isUserExist.username;
                        from = {
                            name: process.env.emailName,
                            address: process.env.user	
                        }
                        const emailFrom = from;
                        const subject = 'Reset Pin Token';                      
                        const hostUrl = process.env.hostUrl
                        const hostUrl2 = process.env.hostUrl2  
                        const   text = "Please use the Token "+code+" to complete your reset pin"
                        const emailTo = req.body.email.toLowerCase();
                        const link = `${hostUrl}`;
                        const link2 = `${hostUrl2}`;
                        processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                        res.status(201).send({ status:200, message:" Pin Reset link sent to your mail succesfully"})
                    }else{ 
                     res.status(400).send({ status:200, message:"Error while forgetting password"})

                    }                  
                }
                else{
                  res.status(400).send({status:400, message:"User details does is not correct"})
                }
                       
                
            }catch(err){
                console.log(err)
                res.status(500).send({status:500,message:"Error while resetting password   "})
            }
        }
    }else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// reset pin
exports.resetPin = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { pin, code} = req.body;
    if (pin && code){
        if (   Number.isInteger(pin)  && pin.toString().length === 4   ){
            try{
                const getuser = await Members.findOne({forgotPasswordCode: req.body.code} )
                if(getuser){
                    const temporaryPin = req.body.pin
                    const newpin = await passwordUtils.hashPassword(temporaryPin);
                    const getAuth = await Auths.findOne({email: getuser.email} ) 
                    const _id =  getAuth._id
                    const newForgotPinCode = ""
                    const updatePin= await Auths.findOneAndUpdate({ _id}, { pin: newpin });
                    if(updatePin){
                        const _id =   getuser._id 
                        const updateCode = await Members.findOneAndUpdate({_id}, { forgotPasswordCode: newForgotPinCode  });
                        const updateCodeStatus = await Members.findOneAndUpdate({_id}, { forgotPasswordCodeStatus: false  });
                        from = {
                            name: process.env.emailName,
                            address: process.env.user	
                        }
                        const emailFrom = from;
                        const subject = 'Reset pin Successful  ';                      
                        const hostUrl = process.env.hostUrl
                        const hostUrl2 = process.env.hostUrl2    
                        const   text = 'Your pin has been changed Successfully '
                        const emailTo = getuser.email.toLowerCase()
                        const link = `${hostUrl}`;
                        const link2 = `${hostUrl2}`;
                        const username = getuser.username
                        processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                        res.status(200).send({status:200,message:"Pin reset was successful"})
                    }            
                }else{
                        res.status(400).send({
                            status:400,
                            message:"This link you selected has already been used. or invalid "
                        });
                    } 
                
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while reseting pin "})
            }
           
        }else{
            res.status(400).send({
                status:400,
                message:"Pin must be an integer and length must be equal to 4"
            });

           
        }
        }else{
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
       }
};

exports.ConfirmResetPinToken = async(req,res)=>{
    if (!req.body){
        res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { pin, code} = req.body;
    if (pin && code){
        if (   Number.isInteger(pin)  && pin.toString().length === 4   ){
            try{
                const getuser = await Members.findOne({forgotPasswordCode: req.body.code} )
                if(getuser){
                    const temporaryPin = req.body.pin
                    const newpin = await passwordUtils.hashPassword(temporaryPin);
                    const getAuth = await Auths.findOne({email: getuser.email} ) 
                    const _id =  getAuth._id
                    const newForgotPinCode = ""
                    const updatePin= await Auths.findOneAndUpdate({ _id}, { pin: newpin });
                    if(updatePin){
                        const _id =   getuser._id 
                        const updateCode = await Members.findOneAndUpdate({_id}, { forgotPasswordCode: newForgotPinCode  });
                        const updateCodeStatus = await Members.findOneAndUpdate({_id}, { forgotPasswordCodeStatus: false  });
                        from = {
                            name: process.env.emailName,
                            address: process.env.user	
                        }
                        const emailFrom = from;
                        const subject = 'Reset pin Succesful ';                      
                        const hostUrl = process.env.hostUrl
                        const hostUrl2 = process.env.hostUrl2    
                        const   text = 'Your pin has been changed succesfully'
                        const emailTo = getuser.email.toLowerCase()
                        const link = `${hostUrl}`;
                        const link2 = `${hostUrl2}`;
                        const username = getuser.username
                        processEmail(emailFrom, emailTo, subject, link, link2, text, username);
                        res.status(200).send({status:200,message:"Pin reset was succesfull"})
                    }            
                }else{
                        res.status(400).send({
                            status:400,
                            message:"This link you selected has already been used. or invalid "
                        });
                    } 
                
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while reseting pin "})
            }
           
        }else{
            res.status(400).send({
                status:400,
                message:"Pin must be an integer and length must be equal to 4"
            });

           
        }
        }else{
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
       }
};

// find wallet balance
exports.findWalletBalance = async (req, res) => {
    try{
        let id = req.user.id
        const findWalletBalance = await Members.findOne({_id: id}, "walletBalance")
        const countPendingTrade = await Trades.countDocuments({userId: id, tradeStatus: "Created", } )
        const countCompletedTrade = await Trades.countDocuments({userId: id, tradeStatus: "Confirmed", } )
        const lastCredit = await Transactions.find({status:"Successful", type: "Credit", sellerId: id}, 'amount').sort({"_id": -1}).limit(1);//
        //db.student.
          if (lastCredit.length === 0){
              lastAmountCredit = 0
          }else{
            lastAmountCredit = lastCredit[0].amount
          }
        res.status(200).send({ status: 200, message : {walletBalance:findWalletBalance.walletBalance, pendingTrade:countPendingTrade, completedTrade: countCompletedTrade, lastCreditAmount : lastAmountCredit}})         
    }catch(err){
        console.log(err)
        res.status(500).send({ status:500,message:"Error while getting wallet balance "})
    }
};


// delete a user
exports.deleteMember = async (req, res) => {
    try{
        const id = req.params.id;
        const deletemember = await Members.findByIdAndRemove(id)
        console.log(deletemember)
        res.status(200).send({message:"Deleted succesfully"})
         
       }catch(err){
           console.log(err)
           res.status(500).send({message:"Error while deleting member "})
       }
}

// count all user
 exports.countUsers = async (req, res) => {
    try{

        const countUsers = await Members.countDocuments()
        console.log(countUsers)
        res.status(200).send({countUsers:countUsers})
     }catch(err){
           console.log(err)
           res.status(500).send({message:"Error while counting users "})
       }
};



// generate auth secret
exports.generateAuthSecret = async(req,res)=>{ 
            try{
                 const email = req.user.email
                 const isUserExist = await Members.findOne({email: email.toLowerCase()} )
                 const isAuthExist = await Auths.findOne({email: email.toLowerCase()} )
                         if(isUserExist && isAuthExist ){
                            if(!isAuthExist.authSecret && !isUserExist.isAuthSecret){
                                const authSecret = await generateAuthSecret();
                                if(authSecret.base32){  
                                    const _id = isAuthExist._id
                                    const updateAuthSecret = await Auths.findOneAndUpdate({ _id }, { authSecret: authSecret });
                                    if(updateAuthSecret ){
                                        const updateProfile = await Members.updateOne({ _id: req.user.id }, { isAuthSecret: true });
                                        res.status(201).send({ status:200, message:authSecret})
                                    }else{
                                        res.status(400).send({status:400,message:"Error while generating auth secret"})  
                                    }
                                }else{
                                         res.status(400).send({status:400,message:"Error while generating auth secret"})  
                                }
                            }else{
                                res.status(400).send({status:400,message:"You auth scret has been created previously"})  
                            }
                        }else{
                            res.status(400).send({status:400,message:"User details not found"})  
                        }
            }catch(err){
                        console.log(err)
                        res.status(500).send(  {status: 500, message:"Error while creating pin "})
            }
};


// Verify auth  code
exports.validateAuthCode = async (req, res) => {
    if (!req.body){
      res.status(400).send({ status:400,message:"Content cannot be empty"});
    }
    const { token  } = req.body;
    if(token){
        if(token===""){
            res.status(400).send({
                status:400,
                message:"Incorrect entry format"
            });
        }else{   
            try{
                const email = req.user.email
                const isUserExist = await Members.findOne({email: email.toLowerCase()} )
                const isAuthExist = await Auths.findOne({email: email.toLowerCase()} )
                    if(isAuthExist && isUserExist){
                        const secret = isAuthExist.authSecret.base32
                        const tokenValidate = speakeasy.totp.verify({
                            secret,
                            encoding: 'base32',
                            token, 
                          });
                            if(tokenValidate){
                                res.status(200).send({ status:200, message:"Token validated succesfully ", data: true})
                            }else{
                                res.status(400).send({ status:400,message:"Token not valid", data: false})
                             }                                         
                        
                    }else{
                        res.status(400).send({ status:400,message:"Invalid user"})
                    }
                                     
                                    
            }catch(err){
                console.log(err)
                res.status(500).send({ status:500,message:"Error while verifying member "})
            }
        }
    }
    else{
        res.status(400).send({
            status:400,
            message:"Incorrect entry format"
        });
    }
};

// generate referral code
exports.generateRefarralCode = async(req,res)=>{ 
    try{
         const email = req.user.email
         const isUserExist = await Members.findOne({email: email.toLowerCase()} )
         const isAuthExist = await Auths.findOne({email: email.toLowerCase()} )
                 if(isUserExist && isAuthExist ){
                    if(!isUserExist.referralCode){
                        const referralCode = await generateReferralCode();
                        await Members.updateOne({ _id: req.user.id }, { referralCode: referralCode });
                        res.status(200).send({ status:200, message:{referralCode: referralCode}})
                    }else{
                        res.status(400).send({status:400,message:"You referrral code has been created previously"})  
                    }
                }else{
                    res.status(400).send({status:400,message:"User details not found"})  
                }
    }catch(err){
                console.log(err)
                res.status(500).send(  {status: 500, message:"Error while creating referral code "})
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


// process email forgot password
async function processEmailForgotPassword(emailFrom, emailTo, subject, link, link2, text, username){
    try{
       const sendmail =  await sendemail.emaiforgotPassword(emailFrom, emailTo, subject, link, link2, text, username);
        return sendmail
    }catch(err){
        console.log(err)
        return err
    }
  
  }

// generate 6 alphanumeric code
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

async function generateReferralCode(){
     try{
          const rawCode = getCode()
          const referralCode = `Dart${rawCode}`
          console.log("referralCode")
          console.log(referralCode)
          const isCodeExist = await Members.findOne({referralCode: referralCode})
          if(isCodeExist){ 
            console.log("i am duplicate")
            generateReferralCode()
          }else{
            return referralCode
          }
         
     }catch(err){
        console.log(err)
        return err
     }
}


async function generateAuthSecret(){
        try{
           return speakeasy.generateSecret()
        }catch(err){
            console.log(err)
            return err
        }
}



exports.generateRefarralCodeForExistingMembers = async(req,res)=>{ 
        const findAllMembers = await Members.find({role: "Seller"})
        console.log("findAllMembers.length")
        console.log(findAllMembers.length)
            try{
                for( var i = 0; i < findAllMembers.length; i++){
                       userId = findAllMembers[i]._id
                      const myRefCode = await  generateReferralCode()
                      const updateProfile = await Members.updateOne({ _id: userId }, { referralCode: myRefCode });
                      console.log("success")
                  }                 
                   res.status(201).send({ status: 201, message:"saved successfully "})
            }catch(err){
                console.log(err)
                return res.status(500).send({ status: 500, message:"Error while saving "})
            }       
};

exports.generateRefarralBonusExistingMembers = async(req,res)=>{ 
    const findAllMembers = await Members.find({role: "Seller"})
    console.log("findAllMembers.length")
    console.log(findAllMembers.length)
        try{
            for( var i = 0; i < findAllMembers.length; i++){
                   userId = findAllMembers[i]._id
                  const updateBonusCount = await Members.updateOne({ _id: userId }, { referralBonusCount: 0 });
                  const updateBonusAmount = await Members.updateOne({ _id: userId }, { referralBonusAmount: 0 });
                  const updateBonusUsers = await Members.updateOne({ _id: userId }, { referralBonusUsers: []});
                  console.log("success")
              }                 
               res.status(201).send({ status: 201, message:"saved successfully "})
        }catch(err){
            console.log(err)
            return res.status(500).send({ status: 500, message:"Error while saving "})
        }       
};
