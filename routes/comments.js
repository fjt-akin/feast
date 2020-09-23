const express    = require("express"),
	  router     = express.Router({mergeParams: true}),
	  Food       = require("../models/food"),
          Comment    = require("../models/comment"),
          User       = require("../models/user"),
	  mw         = require("../middleware"),
          moment     = require('moment');


//COMMENT NEW ROUTE
router.get("/new", mw.isLoggedIn, async (req, res)=>{
	//First of all find food by id
	Food.findById(req.params.id, (err, foundFood)=>{
	 if(err || !foundFood){
		 req.flash("error", err.message)
		 return res.redirect("back")
	 }	
	 res.render("comments/new",{food: foundFood})
   });
});

        

//COMMENT CREATE ROUTE
router.post("/", mw.isLoggedIn,  async (req, res, next)=>{
 try{
	 let foundFood = await Food.findById(req.params.id);
	 let comment = await Comment.create(req.body.comment);
	 comment.author.id = req.user._id;
	 comment.author.username = req.user.username;
	 comment.save();
	 foundFood.comments.push(comment);
	 foundFood.save();
	 req.flash("success", "successfully added comment")
     let currentUser = req.user
	 let now = moment(comment.createdAt).fromNow();
	res.json({
				comment: comment,
				food: foundFood,
				currentUser: currentUser,
				moment: now
				});
		
 } catch(err){
	 console.log(err)
	 req.flash("error", err.message)
	 res.redirect("/foods")
 }
})


//COMMENT EDIT ROUTE
router.get("/:comment_id/edit", mw.chkCommentOwnership,  (req, res)=>{
	console.log(req.comment)
	Food.findById(req.params.id, async (err, food)=>{
		if(err || !food){
			console.log(err);
			req.flash("error", "No food found");
			return res.redirect("back")
		}
		
		try{
			let comment = await Comment.findById(req.params.comment_id);
			res.render("comments/edit", {food_id: req.params.id, comment: comment})
		} catch(err){
			console.log(err);
			req.flash("error", err.message);
		}
	});
});

//COMMENT UPDATE
 router.put("/:comment_id", mw.chkCommentOwnership, (req, res)=>{
	 
Comment.findByIdAndUpdate(req.params.comment_id, req.body.comment, {new: true}, async  (err, updatedComment)=>{
	try {
		let food = await Food.findById(req.params.id);
		let currentUser = req.user
		let now = moment(updatedComment.createdAt).fromNow();
		 res.json({
						comment: updatedComment,
						food: food,
						currentUser: currentUser,
						moment: now
					});
} catch(err){
			res.redirect("back");
}
		}) 
	
});


//COMMENT DELETE ROUTE
router.delete("/:comment_id", mw.chkCommentOwnership, (req, res)=>{
		Comment.findByIdAndRemove(req.params.comment_id, async (err, comment)=>{
		if(err){
			console.log(err);
			return res.redirect("back");
		}
		try{
			let food = await Food.findById(req.params.id)
			let currentUser = req.user
			let now = moment(comment.createdAt).fromNow();
				res.json({
						comment: comment,
						currentUser: currentUser,
						moment: now,
					    food: food
						});		
		}catch(err){
			console.log(err);
		    req.flash("error", err.message);
			res.redirect("back");
		}
	})
});


module.exports = router;
