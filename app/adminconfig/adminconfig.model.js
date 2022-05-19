module.exports = mongoose => {
    var Schema = mongoose.Schema;
    var schema = mongoose.Schema(
      {

        minimumWithdrawer: Number,
        maximumWithdrawer : Number,
        enableAutomatedWithdrawer : Boolean,
        nairaToDollarRate : Number,
        cedisToDollarRate : Number

       
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Adminconfig = mongoose.model("adminconfig", schema);
    return Adminconfig;
  };
  
  