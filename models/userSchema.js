const mongoose = require('mongoose');
const Joi = require('joi');
const config = require('config');
const jwt = require('jsonwebtoken');

const postSchema = new mongoose.Schema({
  author: { type: String, required: true, unique: false },
  postTime: { type: Date, default: Date.now },
  text: { type: String, required: false, unique: false },
  likes: { type: Array, required: false, unique: false }
});

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true, minlength: 6, maxlength: 18 },
  password: { type: String, required: true, unique: false },
  emailAddress: { type: String, required: true, unique: true, minlength: 6, maxlength: 255 },
  isOnline: { type: Boolean },
  profilePicture: { type: String, required: false, unique: false},
  aboutMe: { type: String, required: false, unique: false, maxlength: 4096 },
  bullish: { type: String, required: false, unique: false },
  myCoins:  { type: Array, required: false, unique: false },
  posts: { type: [postSchema], required: false, unique: false },
  joinedDate: { type: Date, default: Date.now }
});

userSchema.methods.generateAuthToken = function(){
  return jwt.sign({ _id: this._id, username: this.username }, config.get('jwtSecret'), { expiresIn: "1h" });
};

const User = mongoose.model('User', userSchema);

function validateUser(user) {
  const schema = Joi.object({
  username: Joi.string().required().min(6).max(18),
  password: Joi.string().required(),
  emailAddress: Joi.string().required().email().min(6).max(255),
  isOnline: Joi.boolean(),
  aboutMe: Joi.string().max(4096).allow(""),
  bullish: Joi.string().allow(""),
  myCoins: Joi.array(),
  posts: Joi.array()
  });
  return schema.validate(user);
}

module.exports.User = User;
module.exports.validateUser = validateUser;