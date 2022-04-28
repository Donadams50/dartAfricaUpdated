module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        coinName: String,
        coinType: String
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Cointype = mongoose.model("cointype", schema);
    return Cointype;
  };
  
  