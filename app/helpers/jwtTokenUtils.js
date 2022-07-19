const  jwt =require('jsonwebtoken');
const dotenv=require('dotenv');
const verifyHmac256 = require('verify-hmac-sha')
var crypto = require('crypto');
dotenv.config();

const db = require("../mongoose");
const Auths = db.auths;
const passwordUtils =require('./passwordUtils');


exports.signToken= (id, username, phoneNumber , email, isVerified, isEnabled, walletBalance, role , coinWallets, accountDetails, isSetPin, imageUrl, country, countryTag )=> {
    const key = process.env.SECRET_KEY;
    const token = jwt.sign({ id: id, username:username ,   phoneNumber:phoneNumber, email:email , isVerified: isVerified, isEnabled: isEnabled, walletBalance:walletBalance,  role: role, coinWallets: coinWallets, accountDetails: accountDetails, isSetPin: isSetPin, imageUrl: imageUrl, country: country, countryTag : countryTag}, key, { expiresIn: '1h' });
    return token;
  };
 
exports.verifyToken= async(req, res, next)=> { 
    const key = process.env.SECRET_KEY;
    const token = req.headers.authorization || req.params.token;
    if (!token) {
      res.status(403).json({ status: 403, error: 'No token provided' }); 
    }else{
      const getToken = await Auths.findOne({currentToken: token} );
      if(!getToken) return res.status(400).json({ status: 400, error: 'Invalid Token' }); 
       console.log("getToken")
       console.log(getToken.currentToken)
       console.log(token)
      if(getToken.token == token){
        res.status(400).json({ status: 400, error: 'You are logged in another device, please ' }); 
      }
      else{
          jwt.verify(token, key, (error, decoded) => {

                if (error) {
                  console.log(error)
                  res.status(401).json({ status: 401, error: 'Unauthorized' });
                }else{
                // console.log(decoded)
                if (decoded.isEnabled === false ) {
                  console.log("User has been disabled")
                  res.status(401).json({ status: 401, error: 'User has been disabled, contact the admin to enable your account' });
                }else{
                  if (decoded.isVerified === false ) {
                    console.log("User has not been verified")
                    res.status(401).json({ status: 401, error: 'This account has not been verified, check your mail for verification link' });
                  }else{
                      req.user = decoded;
                      next();
                  }
                }
                  
                }
          });
     } 
    }
    
  };

exports.isAdmin= (req, res, next)=> { 
    console.log(req.user) 
  
        if (req.user.role === "Admin") {
         console.log(req.user.role) 
          next();
          
        }else{
          console.log(req.user.role) 
          res.status(401).json({ status: 401, error: 'Unauthorized to access this resource' });
          
        }
    
  };
  
exports.isAdminOrSubadmin= (req, res, next)=> { 
  
  
    if (req.user.role === "Admin" || req.user.role === "SubAdmin") {
     console.log(req.user.role) 
      next();
      
    }else{
      console.log(req.user.role) 
      res.status(401).json({ status: 401, error: 'Unauthorized to access this resource' });
      
    }

  };
 
exports.isSeller= (req, res, next)=> { 
   
  
  if (req.user.role === "Seller") {
   console.log(req.user.role) 
    next();
    
  }else{
    console.log(req.user.role) 
    res.status(401).json({ status: 401, error: 'Unauthorized to access this resource' });
    
  }

  };
  
exports.verify =(req, res, next)=> { 
   
    const token = req.headers.authorization || req.params.token;
    if (!token) {
      res.status(403).json({ status: 403, error: 'No token provided' }); 
    }else{
      if (token ===  process.env.token) {
       
         next();
         
       }else{
     
         res.status(401).json({ status: 401, error: 'Unauthorized to access this resource' });
         
       }
    }
    
  };
  
exports.VerifySharedSecret =(req, res, next)=> { 
      console.log("signature")
     //console.log(req.headers["x-cc-webhook-signature"])
      console.log("req body")
     // console.log(req.body)
      const secret = process.env.COINBASE_SHARED_SECRET
      const payload = JSON.stringify(req.body)
      const signature = req.headers["x-cc-webhook-signature"]   
      console.log(verifyHmac256.encodeInHex.verify({ signature, secret, payload})) // true
      const sharedSecret = verifyHmac256.encodeInHex.verify({
        signature,
        secret,
        payload
      })
      if(sharedSecret) {
         next(); 
      }else{
          console.log("Request not from coinbase")
          res.status(401).json({ status: 401, error: 'Unauthorized to access this resource' });
      }
    
  };

  
exports.VerifySharedSecretLazerpay =(req, res, next)=> { 
  console.log("signature lazerpay")
 //console.log(req.headers["x-cc-webhook-signature"])
  console.log("req body")
 // console.log(req.body)
  const secret = process.env.LAZER_SECRET_KEY
  var hash = crypto.createHmac('sha256', secret).update(JSON.stringify(req.body), 'utf8').digest('hex');
  if (hash == req.headers['x-lazerpay-signature']) {
        next();
   }else {
        console.log("Request not from coinbase");
        res
          .status(401)
          .json({ status: 401, error: "Unauthorized to access this resource" });
  }

};

   
exports.isSetTransactionPinValid= async(req, res, next)=> { 
    try{
        if (req.user.isSetPin === false) {
            //console.log(req.user.role) 
            res.status(400).json({ status: 400, error: 'You need to set a transaction pin, please do that' });
        }else{
          if(req.body.pin){
            email = req.user.email
            const Auth = await Auths.findOne({email: email} );
            const retrievedPassword = Auth.pin
            const pin = req.body.pin
            const isMatch = await passwordUtils.comparePassword(pin, retrievedPassword);
            console.log(isMatch) 
            if(isMatch){
                next();
            }else{
              res.status(400).json({ status: 400, message: 'Invalid transaction pin' });
            }
          }else{
              res.status(400).json({ status: 400, message: 'Pin must be provided for this transaction' });
          }
        }
    }catch{
      console.log(err)
      res.status(500).send({status:500,message:"Error while validating  pin "})
    }
};
 
  
 

