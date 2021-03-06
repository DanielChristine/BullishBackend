const Joi = require('joi');
const bcrypt = require('bcrypt');
const express = require('express');
const { User } = require('../models/userSchema');
const router = express.Router();

router.post('/', async (req, res) => {
  try {
  const { error } = validateLogin(req.body);
  if (error) return res.status(400).send(error.details[0].message);
  const user = await User.findOne({ $or: [{ username: req.body.usernameOrEmailAddress}, { emailAddress: req.body.usernameOrEmailAddress }] });
  if (!user) return res.status(400).send('Invalid login. Please try again.');
  const validPassword = await bcrypt.compare(req.body.password, user.password);
  if (!validPassword) return res.status(400).send('Invalid login. Please try again.');
  user.isOnline = true;
  user.save();
  const token = user.generateAuthToken();
  res.send(token);
  
  } catch (ex) {
  return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});

function validateLogin(req) {
 const schema = Joi.object({
 usernameOrEmailAddress: Joi.string().min(6).max(255).required(),
 password: Joi.string().min(6).max(255).required(),
 });
 return schema.validate(req);
}

module.exports = router;
