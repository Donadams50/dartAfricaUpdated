module.exports = mongoose => {
  var Schema = mongoose.Schema;
    var schema = mongoose.Schema(
      {
        status: String,
        sellerDetails: { type: Schema.Types.ObjectId, ref: 'profile' },
        sellerId: String,
        tradeId: String,
        tradeDetails: { type: Schema.Types.ObjectId, ref: 'trade' },
        amount: Number,
        type : String,
        initialBalance : Number,
        finalBalance: Number,
        accountName: String,
        accountNumber: String,
        bankName : String,
        narration : String,
        mobileNumber: String,
        mobileNetwork: String,
        accountType: String,
        bankBranch: String,
        bankCode: String,
        reference: String

      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Transaction = mongoose.model("transaction", schema);
    return Transaction;
  };
  
