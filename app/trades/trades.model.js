module.exports = mongoose => {
    var Schema = mongoose.Schema;
    var schema = mongoose.Schema(
      {

        userId: String,
        userName: String,
        userDetails:  { type: Schema.Types.ObjectId, ref: 'profile' },
        tradeStatus : String,
        coinType: String,
        walletAddress: String,
        amounttInCoin : Number , 
        narration : String,
        amountInLocalCurrency : Number,
        country: String,
        amountInUSD : Number,
        uniqueId: String,
        code: String,
        hostedUrl: String
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Trade = mongoose.model("trade", schema);
    return Trade;
  };
  
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
