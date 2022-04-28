const db = require("../mongoose");
const Members = db.profiles;

exports.postProfileImage = async(req,res)=>{
     const _id =  req.user.id
     const imageUrl =  req.file.url
    try{              
        const updateImageURL = await Members.findOneAndUpdate({ _id}, { imageUrl: imageUrl });
        if(updateImageURL){
            res.status(201).send(            
                {  
                    status:200,
                    message:"Image uploaded successfully ",
                    imageUrl:  imageUrl
                }
            )
        }else{
            res.status(400).send(            
                {
                    message:"Image not uploaded",
                    status:  400
                }
            )
        }
        

    }catch(err){
        console.log(err)
        res.status(500).send({status:500, message:"Error while uploading file "})
    }
       
   
}

