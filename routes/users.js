const { User, validateUser } = require('../models/userSchema');
const { BlacklistedToken } = require('../models/blacklistedToken');

const bcrypt = require('bcrypt');
const auth = require('../middleware/auth');
const checkTokenBlacklist = require('../middleware/checkTokenBlacklist');
const express = require('express');
const router = express.Router();

//Create new user
router.post('/', async (req, res) => {
  try {
    const { error } = validateUser(req.body);
    if (error) return res.status(400).send(error.details[0].message);
    let user = await User.findOne({ username: req.body.username });
    if (user) return res.status(400).send('Someone is already registered with that username.');
    user = await User.findOne({ emailAddress: req.body.emailAddress });
    if (user) return res.status(400).send('Someone is already registered with that email address.');

    const salt = await bcrypt.genSalt(10);
    user = new User({
      username: req.body.username,
      password: await bcrypt.hash(req.body.password, salt),
      emailAddress: req.body.emailAddress,
      isOnline: true,
      aboutMe: "",
      bullish: "",
      myCoins: [],
      posts: []
    });
    await user.save();

    const token = user.generateAuthToken();
    
    return res
      .header('x-auth-token', token)
      .header('access-control-expose-headers', 'x-auth-token')
      .send({ _id: user._id, username: user.username, emailAddress: user.emailAddress, isOnline: user.isOnline, posts: user.posts });

  } catch (ex) {
    return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});

//Log out
router.post('/log-out', auth, async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(req.user._id,
      {
        isOnline: false
      });
    user.save();

    const oldToken = req.header('x-auth-token');
    const blacklistedToken = new BlacklistedToken({
      string: oldToken
    });
    await blacklistedToken.save();

    return res.send( `User "${user.username}" logged out successfully.` );

  } catch (ex) {
    return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});


router.get('/user-profile', auth, checkTokenBlacklist, async (req, res) => {
  try {
  const userProfile = await User.findById( req.user._id, { password: 0, posts: 0, _id: 0, __v: 0 }, function(err, results){ if (err) return res.status(404).send(`The following error occurred when trying to find the user's profile information: ${err}`);} );
  return res.send( userProfile ); 

  } catch (ex) {
  return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});


router.delete('/delete-account', auth, checkTokenBlacklist, async (req, res) => {
  try {
    const deletedUser = await User.findByIdAndDelete(req.user._id);
    if (!deletedUser) return res.send( `User "${deletedUser.username}" not found.` );    
  
    const oldToken = req.header('x-auth-token');
    const blacklistedToken = new BlacklistedToken({
      string: oldToken
    });
    await blacklistedToken.save();
    
    return res.send( `User "${deletedUser.username}" deleted successfully.` );

  } catch (ex) {
    return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});

//Create a new post
router.post('/create-post', auth, checkTokenBlacklist, async (req, res) => {
  try {
    if (!(req.body.author && req.body.text)) return res.status(400).send('"author", "text", and "imageString" must be supplied in the request body.');
    const post = {
      author: req.user.username,
      text: req.body.text,
      likes: []
    }
    const user = await User.findByIdAndUpdate(req.user._id,
      {
        $push: { posts: post }
      },
      { new: true });
    user.save();
    return res.send( user.posts );

  } catch (ex) {
    return res.status(500).send(`Internal Server Error: ${ex}`);
  }
});


module.exports = router;