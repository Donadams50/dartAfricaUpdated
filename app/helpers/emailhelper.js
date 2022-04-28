const nodemailer = require("nodemailer"); 
const hbs = require('nodemailer-express-handlebars')
let responseGot = {}
const dotenv=require('dotenv');
dotenv.config();

exports.emailUtility= async (emailFrom, emailTo, emailSubject,  emailLink, emailLink2, text, fName  ) =>{
   
        let resp= await wrapedSendMail();
         return resp;

    async function wrapedSendMail(){
        return new Promise((resolve,reject)=>{
            let transport = nodemailer.createTransport({
                host: process.env.mailName,
                port: 465, 
                secure: true, 
                auth: {
                        user: process.env.user,
                        pass:  process.env.pass  
                     }  
                   });
  const handlebarsOptions= {
      viewEngine:{
          extName:'index.handlebars', 
          partialsDir: './',
          layoutsDir: './',
          defaultLayout:'./app/helpers/index'
      },
      viewPath:'./app/helpers',
      extName:'.handlebars',
   
  };
        transport.use('compile', hbs(handlebarsOptions));
        const mailOptions = {
            // should be replaced with real  recipient's account 
            from: emailFrom,
            to: emailTo,         
            subject:emailSubject,
            text:emailLink,
            template: 'index',
            context: {
                name: fName,
                link:emailLink,
                link2: emailLink2,
                message: text
               
               
            }
        }; 


     let resp=false;
     transport.sendMail(mailOptions, function(error, info){
        if (error) {
         //   console.log('=======================================yyyyyyy======================')
            console.log("error is "+error);
           reject(false); // or use rejcet(false) but then you will have to handle errors
           //return error
        } 
       else {
          
     //   console.log('=======================================uuuuuuuuu======================')
         console.log('Email sent: ' + info.response);    
           resolve(true);
        }
       });
     
       })
    }
       
  
} 

exports.emaiforgotPassword= async (emailFrom, emailTo, subject, link, link2, text, username ) =>{
   
    let resp= await wrapedSendMail();
     return resp;

async function wrapedSendMail(){
    return new Promise((resolve,reject)=>{
        
        let transport = nodemailer.createTransport({
    
             host: process.env.mailName,
             port: 465,
             secure: true, 
             auth: {
                     user: process.env.user,
                     pass:  process.env.pass  
            }  
            });
const handlebarsOptions= {
  viewEngine:{  
      extName:'forgotpassword.handlebars',
      partialsDir: './',
      layoutsDir: './',
      defaultLayout:'./app/helpers/forgotpassword'
  },
  viewPath:'./app/helpers',
  extName:'.handlebars',
};
    transport.use('compile', hbs(handlebarsOptions));
    const mailOptions = {
        // should be replaced with real  recipient's account 
        from: emailFrom,
        to: emailTo,         
        subject:subject,
        text:text,
        template: 'forgotpassword',
        context: {
            message:text,
            name: username,
            link:link,
            link2: link2
        }
    }; 


 let resp=false;
 transport.sendMail(mailOptions, function(error, info){
    if (error) {
     //   console.log('=======================================yyyyyyy======================')
        console.log("error is "+error);
       reject(false); // or use rejcet(false) but then you will have to handle errors
       //return error
    } 
   else {
      
 //   console.log('=======================================uuuuuuuuu======================')
     console.log('Email sent: ' + info.response);    
       resolve(true);
    }
   });
 
   })
}
   

} 


exports.emailSupportSystem= async (emailFrom, emailTo, emailSubject,   text, name, email  ) =>{
   
    let resp= await wrapedSendMail();
     return resp;

async function wrapedSendMail(){
    return new Promise((resolve,reject)=>{
        let transport = nodemailer.createTransport({
            host: process.env.mailName,
            port: 465,
            secure: true, 
            auth: {
                    user: process.env.usersupport,
                    pass:  process.env.pass  
                 }  
               });
const handlebarsOptions= {
  viewEngine:{
      extName:'support.handlebars', 
      partialsDir: './',
      layoutsDir: './',
      defaultLayout:'./app/helpers/support'
  },
  viewPath:'./app/helpers',
  extName:'.handlebars',

};
    transport.use('compile', hbs(handlebarsOptions));
    const mailOptions = {
        // should be replaced with real  recipient's account 
        from: emailFrom,
        to: emailTo,         
        subject:emailSubject,
        text:text,
        template: 'support',
        context: {
            name: name,
            email:email,
            message: text
           
           
        }
    }; 


 let resp=false;
 transport.sendMail(mailOptions, function(error, info){
    if (error) {
     //   console.log('=======================================yyyyyyy======================')
        console.log("error is "+error);
       reject(false); // or use rejcet(false) but then you will have to handle errors
       //return error
    } 
   else {
      
 //   console.log('=======================================uuuuuuuuu======================')
     console.log('Email sent: ' + info.response);    
       resolve(true);
    }
   });
 
   })
}
   

} 


