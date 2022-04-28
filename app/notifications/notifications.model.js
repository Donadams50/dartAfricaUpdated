module.exports = mongoose => {
    var Schema = mongoose.Schema;
    var schema = mongoose.Schema(
      {

        userId: String,
        deviceToken: String,
      
       
      },
      { timestamps: true }
    );
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Notification = mongoose.model("notification", schema);
    return Notification;
  };
  
  