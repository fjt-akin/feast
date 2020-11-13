const express    = require("express"),
      router     = express.Router(),
      Food       = require("../models/food"),
      Comment    = require("../models/comment"),
      User       = require("../models/user"),
      Review     = require("../models/review"),
      multer     = require("multer"),
      mw         = require("../middleware");

const storage = multer.diskStorage({
  filename: function(req, file, callback) {
    callback(null, Date.now() + file.originalname);
  }
});
const imageFilter = function (req, file, cb) {
    // accept image files only
    if (!file.originalname.match(/\.(jpg|jpeg|png|gif)$/i)) {
        return cb(new Error('Only image files are allowed!'), false);
    }
    cb(null, true);
};
const upload = multer({ storage: storage, fileFilter: imageFilter})

const cloudinary = require('cloudinary');
cloudinary.config({ 
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY, 
  api_secret: process.env.API_SECRET
});

// INDEX ROUTE
router.get("/", (req, res)=>{
	let perPage = 9;
    let pageQuery = parseInt(req.query.page);
    let pageNumber = pageQuery ? pageQuery : 1;
	let noMatch = null;
	if(req.query.search){
	const regex = new RegExp(escapeRegex(req.query.search), 'gi');
	Food.find({name: regex}).sort({'_id': -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec((err, allFood)=>{
		Food.countDocuments({name: regex}).exec(function (err, count) {
		if(err){
			console.log(err);
			res.redirect('back')
		} else {
			if(allFood.length < 1){
				noMatch =  "No feastOn matches that query, please try again";
			}
			res.render("foods/index", {
				foods: allFood, 
				noMatch: noMatch,
				current: pageNumber,
                pages: Math.ceil(count / perPage),
				search: req.query.search
			});
		}
	  });
	});
	}else {
	   Food.find({}).sort({'_id': -1}).skip((perPage * pageNumber) - perPage).limit(perPage).exec((err, allFood)=>{
		   Food.countDocuments().exec(function (err, count) {
		if(err){
			console.log(err)
		} else {
			res.render("foods/index", {
				foods: allFood, 
				noMatch: noMatch,
				current: pageNumber,
                pages: Math.ceil(count / perPage),
				search: false
			});
		}
	  });
	})	
  }
});

//NEW ROUTE
router.get("/new", mw.isLoggedIn, (req, res)=>{
	res.render("foods/new");
})

//CREATE ROUTE (add new food to DB)
router.post("/", mw.isLoggedIn, upload.single('image'), (req, res)=>{
	cloudinary.v2.uploader.upload(req.file.path, async (err, result)=>{
		if(err){
			req.flash('error', err.message);
			return res.redirect('back');
		} 
		
		// add cloudinary url for the image to the food object under image property
		req.body.food.image = result.secure_url;
        // add image's public_id to food object 
		req.body.food.imageId = result.public_id;
		//add author to Food
		req.body.food.author = {
        id: req.user._id,
        username: req.user.username
      }
		
		try{
			let food = await Food.create(req.body.food);
			res.redirect("/foods");
		} catch(err){
			req.flash('error', err.message)
			res.redirect('back')
		}
	})
})


//SHOW ROUTE
router.get("/:id", (req, res)=>{
	Food.findById(req.params.id).populate("comments likes").populate({
        path: "reviews",
        options: {sort: {createdAt: -1}}}).exec((err, foundFood)=>{
			if(err || !foundFood){
				console.log("error");
				req.flash("error", "Sorry what you are looking for doesnt exist")
				return res.redirect('back');
			} 
			     console.log("found meal");
		         res.render("foods/show", {food: foundFood})
	 })
})

//EDIT ROUTE
router.get("/:id/edit", mw.isLoggedIn, mw.chkFoodOwnership, async (req, res)=>{
	try{
		let foundFood = await Food.findById(req.params.id);
		res.render("foods/edit", {food: foundFood})
	} catch(err){
		console.log(err)
	}
	
});

//UPDATE ROUTE
router.put("/:id", mw.chkFoodOwnership, upload.single('image'), (req, res)=>{
	delete req.body.food.rating;
	Food.findById(req.params.id, async (err, foundFood)=>{
		if(err || !foundFood){
			console.log(err);
			req.flash("error", err.message);
			res.redirect("back");
		} else {
			if(req.file){
				try{
					cloudinary.v2.uploader.destroy(foundFood.imageId);
					let result = await cloudinary.v2.uploader.upload(req.file.path);
					foundFood.imageId = result.public_id;
					foundFood.image = result.secure_url;
				}catch(err){
					req.flash("error", err.message);
					res.redirect("back");
				}
				foundFood.name = req.body.name;
				foundFood.description = req.body.description;
				foundFood.price = req.body.price
				foundFood.save();
				req.flash("success", "successfully updated");
				res.redirect("/foods/" + req.params.id);
			}
		}
	});
});


//DESTROY ROUTE
router.delete("/:id", mw.chkFoodOwnership, (req, res)=>{
	Food.findById(req.params.id, async (err, foundFood)=>{
		if(err || !foundFood){
			req.flash("error", err.message);
			return res.redirect("back")
		}
		try{
			await Comment.remove({"_id": {$in: foundFood.comments}});
			await Review.remove({"_id": {$in: foundFood.reviews}});
			await cloudinary.v2.uploader.destroy(foundFood.imageId);
			foundFood.remove();
			req.flash("success", "food deleted successfully!")
		    res.redirect("/foods")  
		}catch(err){
			console.log("error", err.message);
			req.flash("error", err.message);
			return res.redirect("back");
		}
	});
});



// FOOD LIKES
router.post("/:id/like", mw.isLoggedIn, (req, res)=>{
	Food.findById(req.params.id, (err, food)=>{
		if(err){
			console.log(err);
            return res.redirect("/foods");
		}
		//check if req.user.id exists
		let foundUserLike = food.likes.some(function(like){
			return like.equals(req.user._id)
		});
		
		if(foundUserLike){
        // user already liked, removing like 
			food.likes.pull(req.user._id)
		} else {
        // adding user 			
			food.likes.push(req.user)
		}
		
		food.save(function(err){
			if(err){
				console.log(err);
				req.flash("error", "something went wrong")
                return res.redirect("/foods");
			}
			let currentUser = req.user
			res.json({
				currentUser: currentUser,
				food: food
			})
			// res.redirect("/foods/" + food._id);
		});
	});
});

function escapeRegex(text) {
    return text.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
};

module.exports = router;
