const Food     = require("../models/food"),
	  Comment  = require("../models/comment"),
      Review = require("../models/review");



const mw = {};

mw.chkFoodOwnership = (req, res, next)=>{
	Food.findById(req.params.id, (err, food)=>{
		if(err || !food){
			console.log(err);
			req.flash('error', 'sorry that meal doesnt exist');
			res.redirect('/foods');
		} else if (food.author.id.equals(req.user._id) || req.user.isAdmin){
			req.food = food;
			next();
		} else {
			req.flash('error', 'You don\'t have the permission to do that');
			res.redirect('/food/' + req.params.id);
		}
	});
}

mw.chkCommentOwnership = (req, res, next)=>{
	Comment.findById(req.params.comment_id, (err, comment)=>{
		if(err || !comment){
			console.log(err);
			req.flash('error', 'sorry that meal doesnt exist');
			res.redirect('/foods');
		} else if (comment.author.id.equals(req.user._id) || req.user.isAdmin){
			req.comment = comment;
			next();
		} else {
			req.flash('error', 'You don\'t have the permission to do that');
			res.redirect('/food/' + req.params.id);
		}
	});
};

mw.isLoggedIn = (req, res, next)=>{
	if(req.isAuthenticated()){
		return next();
	}
	req.flash('error', "you need to be logged in to do that");
	res.redirect('/login');
}

mw.checkReviewOwnership = function(req, res, next) {
    if(req.isAuthenticated()){
        Review.findById(req.params.review_id, function(err, foundReview){
            if(err || !foundReview){
                res.redirect("back");
            }  else {
                // does user own the comment?
                if(foundReview.author.id.equals(req.user._id)) {
                    next();
                } else {
                    req.flash("error", "You don't have permission to do that");
                    res.redirect("back");
                }
            }
        });
    } else {
        req.flash("error", "You need to be logged in to do that");
        res.redirect("back");
    }
};

mw.checkReviewExistence = function (req, res, next) {
    if (req.isAuthenticated()) {
        Food.findById(req.params.id).populate("reviews").exec(function (err, food) {
            if (err || !food) {
                req.flash("error", "food not found.");
                res.redirect("back");
            } else {
                // check if req.user._id exists in food.reviews
                let foundUserReview = food.reviews.some(function (review) {
                    return review.author.id.equals(req.user._id);
                });
                if (foundUserReview) {
                    req.flash("error", "You already wrote a review.");
                    return res.redirect("/foods/" + food._id);
                }
                // if the review was not found, go to the next middleware
                next();
            }
        });
    } else {
        req.flash("error", "You need to login first.");
        res.redirect("back");
    }
};

module.exports = mw