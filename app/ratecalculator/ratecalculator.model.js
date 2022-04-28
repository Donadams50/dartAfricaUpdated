module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        coinType: String,
        usdRateCoin: Number,
        localCurrencyRate: Array

      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Ratecalculator = mongoose.model("ratecalculator", schema);
    return Ratecalculator;
  };
  
  