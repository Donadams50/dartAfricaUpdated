const db = require("../mongoose");
const Ratecalculator = db.ratecalculators;
const Cointype = db.cointypes;
//create rate
exports.createRate = async(req, res) => {
    const { coinType, usdRateCoin,localCurrencyRate} = req.body;
    if(coinType&& usdRateCoin&& localCurrencyRate){
          if ( coinType === "" || usdRateCoin=== ""|| localCurrencyRate ===""){
            res.status(400).send({
                status: 400,
                message:"Incorrect entry format, one of the field is empty"
            });
        }else{
           
            try{
                const saverate = new Ratecalculator({
                                coinType: coinType,
                                usdRateCoin: usdRateCoin,
                                localCurrencyRate : localCurrencyRate
                              });
                  const isRateExist = await Ratecalculator.findOne({coinType: coinType} )
                        if(isRateExist){
                            res.status(400).send({status:400,message:"Coint type alraedy exists"})
                        }else{
                            const saveRate = await saverate.save()
                            res.status(201).send({ status: 201,message:"Rate created successfully "})
                        }
            }catch(err){
                console.log(err)
                res.status(500).send({ status: 500,message:"Error while saving "})
            }     
        }
    }else{
        res.status(400).send({
            status: 400,
            message:"Incorrect entry format6"
        });
    }
                   
};

//update rate
exports.updateRate = async(req, res) => {
    const _id = req.params.id;
    const { coinType, usdRateCoin, localCurrencyRate } = req.body;
    if(coinType&& usdRateCoin&& localCurrencyRate) {
          if ( coinType === "" || usdRateCoin=== ""|| localCurrencyRate ===""){
            res.status(400).send({
                status: 400,
                message:"Incorrect entry format, one of the field is empty"
            });
        }else{
           
            try{
                const saverate = new Ratecalculator({
                                _id : _id,
                                coinType: coinType,
                                usdRateCoin: usdRateCoin,
                                localCurrencyRate : localCurrencyRate
                  });
                  
                    const updaterate = await Ratecalculator.updateOne( {_id}, saverate)
                    //  console.log(updateProfile)                       
                    res.status(200).send({ status: 200,message:"Rate updated successfully "})
                 
            }catch(err){
                console.log(err)
                res.status(500).send({ status: 500,message:"Error while updating rate "})
            }     
        }
    }else{
        res.status(400).send({
            status: 400,
            message:"Incorrect entry format, one of the field is missing"
        });
    }
                   
};

// Find all rates
exports.getAllRate = async (req, res) => {
    try{
            const findAllRates = await Ratecalculator.find().sort({"_id": 1})    
            res.status(200).send({ status: 200, message: findAllRates})
        
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting all rates "})
       }
};

// Find rate by coin type 
exports.getRateByCoinId = async (req, res) => {
    try{
        
         let id = req.params.id
         const findratebycoinid = await Ratecalculator.findOne({_id: id})
         res.status(200).send({status: 200, message:findratebycoinid})
            
        }catch(err){
            console.log(err)
            res.status(500).send({ status: 500, message:"Error while getting rate by id "})
        }
 
 };

// delete rate 
exports.deleteRate = async (req, res) => {
    try{

        const rateId = req.params.id;
        // const sess = await mongoose.startSession()
        //  sess.startTransaction()
        const deleteCategory= await Ratecalculator.findByIdAndRemove(rateId)
        // await sess.commitTransaction()
        // sess.endSession();   
        //console.log(deletaOffice)
        res.status(200).send({ status: 200,  message:"Deleted succesfully"})
         
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500,  message:"Error while deleting category"})
       }
};


//create coin type

exports.createCoinType = async(req, res) => {
    const { coinType, coinName} = req.body;
    if(coinType && coinName){
          if ( coinType === "" || coinName=== "" ){
            res.status(400).send({
                status: 400,
                message:"Incorrect entry format, one of the field is empty"
            });
        }else{
           
            try{
                const savecointype = new Cointype({
                                coinType: coinType,
                                coinName: coinName
                  });
                  const isCoinExist = await Cointype.findOne({ $or: [ { coinType: coinType }, {coinName: coinName} ] } )
                        if(isCoinExist){
                            res.status(400).send({status:400,message:"Coin type alraedy exists"})
                        }else{
                            const saveRate = await savecointype.save()
                            res.status(201).send({ status: 201,message:"Coint type created successfully "})
                        }
            }catch(err){
                console.log(err)
                res.status(500).send({ status: 500,message:"Error while saving coin type"})
            }     
        }
    }else{
        res.status(400).send({
            status: 400,
            message:"Incorrect entry format6"
        });
    }
                   
};



// Find  coin type  by coin id
exports.getCoinTypeeByCoinId = async (req, res) => {
    try{
        
         let id = req.params.id
         const findratebycoinid = await Cointype.findOne({_id: id})
         res.status(200).send({status: 200, message:findratebycoinid})
            
        }catch(err){
            console.log(err)
            res.status(500).send({ status: 500, message:"Error while getting rate by id "})
        }
 
 };



exports.getAllCoins = async (req, res) => {
    try{
            const findAllCoinTypes = await Cointype.find().sort({"_id": 1})    
            res.status(200).send({ status: 200, message: findAllCoinTypes})
        
       }catch(err){
           console.log(err)
           res.status(500).send({ status: 500, message:"Error while getting all coin types "})
       }
};
