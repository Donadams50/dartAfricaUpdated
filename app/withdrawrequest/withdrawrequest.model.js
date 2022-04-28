module.exports = mongoose => {
  var Schema = mongoose.Schema;
    var schema = mongoose.Schema(
      {
        status: String,
        userDetails: { type: Schema.Types.ObjectId, ref: 'profile' },
        userId: String,
        amount: Number,
        accountName: String,
        accountNumber: String,
        bankName : String,
        narration : String,
        bankBranch: String,
        bankCode: String,
        branchName: String,
        accountType: String,
        transactionId: { type: Schema.Types.ObjectId, ref: 'transaction' },
        mobileNetwork: String,
        mobileNumber: String,
        reference : String,
        flutterPaymentId : String,
        country: String,

      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });

    const Withdrawrequest = mongoose.model("withdrawrequest", schema);
    return Withdrawrequest;
  };
  
