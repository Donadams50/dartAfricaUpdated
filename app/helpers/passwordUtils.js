const bcrypt = require('bcryptjs');

exports.hashPassword=(userPassword)=> {
  console.log(userPassword)
  convertedUserPassword = userPassword.toString()
  console.log(convertedUserPassword)
  return bcrypt.hash(convertedUserPassword, 10);
}

exports.comparePassword=(password, hashedPassword)=> {
  convertedPassword = password.toString()
  return bcrypt.compare(convertedPassword, hashedPassword);
} 