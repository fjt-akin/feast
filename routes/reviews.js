const express = require("express");
const router = express.Router({mergeParams: true});
const Food = require("../models/food");
const Review = require("../models/review");
const mw = require("../middleware");


// Reviews Index
router.get("/", function (req, res) {
    Food.findById(req.params.id).populate({
        path: "reviews",
        options: {sort: {createdAt: -1}} // sorting the populated reviews array to show the latest first
    }).exec(function (err, food) {
        if (err || !food) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/index", {food: food});
    });
});


// Reviews New
router.get("/new", mw.isLoggedIn, mw.checkReviewExistence, function (req, res) {
    // middleware.checkReviewExistence checks if a user already reviewed the campground, only one review per user is allowed
    Food.findById(req.params.id, function (err, food) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/new", {food: food});

    });
});



// Reviews Create
router.post("/", mw.isLoggedIn, mw.checkReviewExistence, function (req, res) {
    //lookup food using ID
    Food.findById(req.params.id).populate("reviews").exec(function (err, food) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Review.create(req.body.review, function (err, review) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            //add author username/id and associated campground to the review
            review.author.id = req.user._id;
            review.author.username = req.user.username;
            review.food = food;
            //save review
            review.save();
            food.reviews.push(review);
            // calculate the new average review for the campground
            food.rating = calculateAverage(food.reviews);
            //save food
            food.save();
            req.flash("success", "Your review has been successfully added.");
            res.redirect('/foods/' + food._id);
        });
    });
});


// Reviews Edit
router.get("/:review_id/edit", mw.checkReviewOwnership, function (req, res) {
    Review.findById(req.params.review_id, function (err, foundReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        res.render("reviews/edit", {food_id: req.params.id, review: foundReview});
    });
});


// Reviews Update
router.put("/:review_id", mw.checkReviewOwnership, function (req, res) {
    Review.findByIdAndUpdate(req.params.review_id, req.body.review, {new: true}, function (err, updatedReview) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Food.findById(req.params.id).populate("reviews").exec(function (err, food) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate food average
            food.rating = calculateAverage(food.reviews);
            //save changes
            food.save();
            req.flash("success", "Your review was successfully edited.");
            res.redirect('/foods/' + food._id);
        });
    });
});


// Reviews Delete
router.delete("/:review_id", mw.checkReviewOwnership, function (req, res) {
    Review.findByIdAndRemove(req.params.review_id, function (err) {
        if (err) {
            req.flash("error", err.message);
            return res.redirect("back");
        }
        Food.findByIdAndUpdate(req.params.id, {$pull: {reviews: req.params.review_id}}, {new: true}).populate("reviews").exec(function (err, food) {
            if (err) {
                req.flash("error", err.message);
                return res.redirect("back");
            }
            // recalculate campground average
            food.rating = calculateAverage(food.reviews);
            //save changes
            food.save();
            req.flash("success", "Your review was deleted successfully.");
            res.redirect("/foods/" + req.params.id);
        });
    });
});



function calculateAverage(reviews) {
    if (reviews.length === 0) {
        return 0;
    }
    let sum = 0;
    reviews.forEach(function (element) {
        sum += element.rating;
    });
    return sum / reviews.length;
}

module.exports = router;