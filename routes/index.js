const express    = require("express"),
	  router     = express.Router(),
	  passport   = require("passport"),
	  User       = require("../models/user"),
	  Food       = require("../models/food");


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
			// req.flash('error', err.message)
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
	failureRedirect: "/login"
}) ,(req, res)=>{
});

//LOGOUT ROUTE
router.get("/logout", (req, res)=>{
	req.logout();
	req.flash("success", "You just Logged Out");
	res.redirect("/foods")
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