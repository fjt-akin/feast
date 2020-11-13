const express    = require("express"),
	  router     = express.Router(),
	  passport   = require("passport"),
	  User       = require("../models/user"),
	  Food       = require("../models/food"),
	  asyncs     = require("async"),
	  nodemailer = require("nodemailer"),
	  crypto     = require("crypto");
	         


//ROOT ROUTE
router.get("/", (req, res)=>{
	res.render("landing");
});

// SHOW REGISTER FORM
router.get("/register", (req, res)=>{
	res.render("register", {page: 'register'})
});

//HANDLE SIGN UP LOGIC
router.post("/register", (req, res)=>{
	
	const newUser = new User({
			username: req.body.username,
			email: req.body.email,
		});
	
	if(req.body.adminCode === 'secretcode123'){
		newUser.isAdmin = true;
	}
	User.register(newUser, req.body.password, (err, user)=>{
		if(err){
			console.log(err)
			return res.render("register", {error: err.message})
		}
		passport.authenticate("local")(req, res, ()=>{
			req.flash("success", "Successfully Signed up!! Welcome to FeastOn  " + user.username);
			res.redirect("/foods")
		});
	});
});

  //SHOW LOGIN FORM
router.get("/login", (req, res)=>{
	res.render("login", {page: 'login'});
});

//HANDLE LOGIN LOGIC
router.post("/login", passport.authenticate("local", {
	successRedirect: "/foods",
	failureRedirect: "/login",
	failureFlash: true,
	successFlash: 'Welcome back!'
}) ,(req, res)=>{
});

//LOGOUT ROUTE
router.get("/logout", (req, res)=>{
	req.logout();
	req.flash("success", "You just Logged Out");
	res.redirect("/foods")
});

//FORGOT ROUTES
router.get("/forgot", (req, res)=>{
	res.render('forgot');
})

router.post('/forgot', function(req, res, next) {
  asyncs.waterfall([
    function(done) {
      crypto.randomBytes(20, function(err, buf) {
        var token = buf.toString('hex');
        done(err, token);
      });
    },
    function(token, done) {
      User.findOne({ email: req.body.email }, function(err, user) {

        if (!user) {
          req.flash('error', 'No account with that email address exists.');
          return res.redirect('/forgot');
        }

        user.resetPasswordToken = token;
        user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

        user.save(function(err) {
          done(err, token, user);
        });
      });
    },
    function(token, user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'favy.dev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'favy.dev@gmail.com',
        subject: 'FeastOn Password Reset',
        text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
          'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
          'http://' + req.headers.host + '/reset/' + token + '\n\n' +
          'If you did not request this, please ignore this email and your password will remain unchanged.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        console.log('mail sent');
        req.flash('success', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
        done(err, 'done');
      });
    }
  ], function(err) {
    if (err) {
		req.flash('error', err.message)
	};
    res.redirect('/forgot');
  });
});

router.get('/reset/:token', function(req, res) {
  User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
		if (err || !user) {
		  req.flash('error', 'Password reset token is invalid or has expired.');
		  return res.redirect('/forgot');
		}
		res.render('reset', {token: req.params.token});
		});
});


router.post('/reset/:token', function(req, res) {
  asyncs.waterfall([
    function(done) {
      User.findOne({ resetPasswordToken: req.params.token, resetPasswordExpires: { $gt: Date.now() } }, function(err, user) {
        if (!user) {
          req.flash('error', 'Password reset token is invalid or has expired.');
          return res.redirect('back');
        }
        if(req.body.password === req.body.confirm) {
          user.setPassword(req.body.password, function(err) {
            user.resetPasswordToken = undefined;
            user.resetPasswordExpires = undefined;

            user.save(function(err) {
              req.logIn(user, function(err) {
                done(err, user);
              });
            });
          })
        } else {
            req.flash("error", "Passwords do not match.");
            return res.redirect('back');
        }
      });
    },
    function(user, done) {
      let smtpTransport = nodemailer.createTransport({
        service: 'Gmail', 
        auth: {
          user: 'favy.dev@gmail.com',
          pass: process.env.GMAILPW
        }
      });
      let mailOptions = {
        to: user.email,
        from: 'favy.dev@gmail.com',
        subject: 'Your password has been changed',
        text: 'Hello,\n\n' +
          'This is a confirmation that the password for your account ' + user.email + ' has just been changed.\n'
      };
      smtpTransport.sendMail(mailOptions, function(err) {
        req.flash('success', 'Success! Your password has been changed.');
        done(err);
      });
    }
  ], function(err) {
	  if (err) {
		req.flash('error', err.message)
	};
    res.redirect('/foods');
  });
});

//USER PROFILE

router.get("/users/:id", (req, res)=>{
	User.findById(req.params.id, (err, user)=>{
		if(err){
			req.flash('error', 'User not found');
			return res.redirect('back');		
		}
        // To find all the food by a particular author 
		Food.find().where('author.id').equals(user._id).exec((err, foods)=>{
			if(err){
			req.flash('error', 'User not found');
			return res.redirect('back');		
		}
			//render the show page
			res.render("users/show", {user: user, foods: foods});
		})
		
	});
});




module.exports = router;