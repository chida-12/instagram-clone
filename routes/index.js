var express = require('express');
var router = express.Router();
const userModel = require("./users");
const postModel = require("./post");

// Export Passport
const passport = require('passport');
const LocalStrategy = require("passport-local");
passport.use(new LocalStrategy(userModel.authenticate()));

//Import the multer middelware setup
const upload = require('./multer');


/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('signup');
});

router.get('/login', function (req, res, next) {
  res.render('login');
});

router.get('/index', Isloggdin, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  });

  const posts = await postModel.find().populate("user").populate("user");
  res.render('index', { user, posts });
});

// profile route
router.get('/profile', Isloggdin, async function (req, res, next) {
  const user = await userModel.findOne({
    username: req.session.passport.user
  }).populate("posts")
  res.render("profile", { user })
});


router.get('/post', Isloggdin, function (req, res, next) {
  res.render('post');
});

router.get('/search', Isloggdin, function (req, res, next) {
  res.render('search');
});

router.get('/username/:username', Isloggdin, async function (req, res, next) {
  const regex = new RegExp(`^{req.params.username}`, 'i');
  const findusers = await userModel.findOne({ username: regex })

  res.json(findusers);
});

router.get('/edit', Isloggdin, async function (req, res, next) {
  const user = await userModel.findOne({ username: req.session.passport.user })
  res.render('edit', { user });
});



// Login code
router.post('/register', function (req, res, next) {
  let userdata = new userModel({
    username: req.body.username,
    email: req.body.email,
    name: req.body.name
  });

  // resgister(first:usermodelname, second:password) helps us to create our account. It return a promiss
  userModel.register(userdata, req.body.password)
    .then(function () {
      passport.authenticate("local")(req, res, function () {
        res.redirect('/index');
      });
    });
});


// Login Route
router.post('/login', passport.authenticate('local', {
  successRedirect: '/index',
  failureRedirect: '/login',
  failureFlash: true
}), function (req, res) { });

// Logout route
router.get('/logout', function (req, res, next) {
  req.logout(function (err) {
    if (err) return next(err);
    res.redirect('/login');
  });
});

// Islogdin code
function Isloggdin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect('/login');
}

// update route in  multer code
router.post('/update', Isloggdin, upload.single('image'), async (req, res) => {
  // who loggedin to know
  const user = await userModel.findOneAndUpdate(
    { username: req.session.passport.user },
    // user details upadte like username, bio, name on the basic of usernmae
    {
      username: req.body.username,
      name: req.body.name,
      bio: req.body.bio
    },
    { new: true }
  );
  // user profile image update
  if (req.file) {
    user.profileImage = req.file.filename;
  }

  await user.save();
  res.redirect('/profile');
});
;

// Post
router.post('/upload', Isloggdin, upload.single("image"), async function (req, res) {
  const user = await userModel.findOne({ username: req.session.passport.user });

  const posteduser = await postModel.create({
    picture: req.file.filename,
    user: user._id, // logedin user id
    caption: req.body.caption,
  })
  user.posts.push(posteduser._id);
  await user.save();
  res.redirect("/profile");
});





module.exports = router;