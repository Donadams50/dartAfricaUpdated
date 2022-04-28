module.exports = mongoose => {
    var schema = mongoose.Schema(
      {
        username: String,
        role: String,
        email:String,
        phoneNumber:String,
        forgotPasswordCode: String,
        forgotPasswordCodeStatus: Boolean,
        verificationCode: String,
        isVerified: Boolean, 
        walletBalance: Number,
        accountDetails : Array,
        isEnabled: Boolean,
        country: String,
        isSetPin: Boolean,
        imageUrl: String,
        countryTag: String
      },

      { timestamps: true }
    );

  
  
    schema.method("toJSON", function() {
      const { __v, _id, ...object } = this.toObject();
      object.id = _id;
      return object;
    });
  
    const Profile = mongoose.model("profile", schema);
    return Profile;
  };
  
  