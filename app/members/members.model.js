module.exports = mongoose => {
  var Schema = mongoose.Schema;
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
        countryTag: String,
        isAuthSecret:Boolean,
        referralCode: String,
        referredBy:  { type: Schema.Types.ObjectId, ref: 'profile' },
        referralBonusCount: Number,
        referralBonusAmount: Number,
        referralBonusUsers: [{ type : Schema.Types.ObjectId, ref: 'profile' }],
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
  
  