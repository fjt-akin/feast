const express         = require("express"),
	  app             = express(),
	  path            = require("path"),
	  bodyParser      = require("body-parser"),
	  mongoose        = require("mongoose"),
	  flash           = require("connect-flash"),
	  passport        = require("passport"),
	  LocalStrategy   = require("passport-local"),
	  methodOverride  = require("method-override"),
      Food            = require("./models/food"),
      Comment         = require("./models/comment"),
      User            = require("./models/user");
	  
	  	  
// requiring routes
  const foodRoutes    = require("./routes/foods"),
		commentRoutes = require("./routes/comments"),
		indexRoutes   = require("./routes/index"),
		reviewRoutes  = require("./routes/reviews")


  
  //SOCKET.IO SETUP
const server = require('http').createServer(app);
 global.io = require('socket.io')(server);
//anytime a user loads our website it calls this function and gives each user a personal socket that sends a message to the user

io.on('connection', socket =>{
 console.log('a user is connected')
})
  
  
  
mongoose.connect("mongodb://localhost:27017/feastOn", {useNewUrlParser: true, useUnifiedTopology: true, useFindAndModify: false}).then(()=>{
console.log("connected to DB!");
}).catch(err => {
console.log("ERROR", err.message);
});

const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const { window } = new JSDOM();
const { document } = (new JSDOM('')).window;
global.document = document;
const $ = require("jquery")(window);
 

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));
app.set("view engine", "ejs");
app.use(express.static(__dirname + "/public"));
app.use(methodOverride("_method"));
app.use(flash());
app.locals.moment = require('moment');

//PASSPORT CONFIGURATION
app.use(require("express-session")({
    secret: "Jesus is Lord",
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate()));
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(function(req, res, next){
   res.locals.currentUser = req.user;
	res.locals.error = req.flash("error");
	res.locals.success = req.flash("success");
   next();
});

app.use(function(req, res, next) {
    req.io = io;
    next();
	// then in any express route handler, you can use req.io.emit(...)
});

//REQUIRING ROUTES
app.use("/", indexRoutes);
app.use("/foods", foodRoutes);
app.use("/foods/:id/comments", commentRoutes);
app.use("/foods/:id/reviews", reviewRoutes);

server.listen(process.env.PORT || 3000, process.env.IP, ()=>{
	console.log("FeastOn 2 Server Running!!")
})