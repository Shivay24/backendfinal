var express=require("express");
var app=express();
const fs=require("fs");
const mongoose = require("mongoose");
const session = require("express-session");
const multer = require("multer");
const path = require("path");
const passport = require("passport");
const GoogleStrategy = require("passport-google-oauth20").Strategy;
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const JWT_SECRET = "your_very_secret_key_here";

// Configure Multer for image uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const dir = './public/uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        cb(null, Date.now() + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Session middleware
app.use(session({
    secret: "your-secret-key",
    resave: false,
    saveUninitialized: true
}));

app.use(cookieParser());

// JWT Authentication Middleware
const authenticateJWT = (req, resp, next) => {
    const token = req.cookies.token;
    if (token) {
        jwt.verify(token, JWT_SECRET, (err, user) => {
            if (err) {
                return resp.redirect("/signin");
            }
            req.user = user;
            // Also sync session for backward compatibility with existing views
            req.session.username = user.username;
            req.session.profilePic = user.profilePic;
            next();
        });
    } else {
        resp.redirect("/signin");
    }
};

// Initialize Passport
app.use(passport.initialize());
app.use(passport.session());

// Define User Schema
const userSchema = new mongoose.Schema({
    username: { type: String, required: true },
    password: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    city: String,
    phone: String,
    profilePic: String
});

const User = mongoose.model('User', userSchema);

// Define Booking Schema
const bookingSchema = new mongoose.Schema({
    fname: { type: String, required: true },
    last: { type: String, required: true },
    email: { type: String, required: true },
    city: String,
    phone: String,
    desti: { type: String, required: true },
    bookingDate: { type: Date, default: Date.now }
});

const Booking = mongoose.model('Booking', bookingSchema);

// Define Feedback Schema
const feedbackSchema = new mongoose.Schema({
    uname: { type: String, required: true },
    email: { type: String, required: true },
    feedback: { type: String, required: true },
    date: { type: Date, default: Date.now }
});

const Feedback = mongoose.model('Feedback', feedbackSchema);

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id);
        done(null, user);
    } catch (err) {
        done(err, null);
    }
});

// Google Strategy Configuration
// Note: Replace these placeholders with your actual Google credentials
passport.use(new GoogleStrategy({
    clientID: "27808634132-6qqo8et73rffdennog8oel7vigm7cbp6.apps.googleusercontent.com",
    clientSecret: "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",
    callbackURL: "http://localhost:805/auth/google/callback"
},
async (accessToken, refreshToken, profile, done) => {
    try {
        let user = await User.findOne({ email: profile.emails[0].value });
        if (!user) {
            user = new User({
                username: profile.displayName,
                email: profile.emails[0].value,
                password: "google-login",
                profilePic: profile.photos[0].value
            });
            await user.save();
        }
        return done(null, user);
    } catch (err) {
        return done(err, null);
    }
}));

mongoose.connect("mongodb://localhost:27017/backendfinal")
    .then(() => console.log("Connected to MongoDB"))
    .catch(err => console.error("Could not connect to MongoDB", err));

app.set("view engine","ejs");

app.get("/",function(req,resp){
    req.session.destroy();
    resp.clearCookie("token");
    resp.render("home",{
        title: "home"
    });
})

app.use(express.static("public"));
app.use(express.urlencoded({ extended: true }));

app.get("/signup",function(req,resp){
    resp.render("signup",{
        title: "signup"
    });
})

// Google Auth Routes
app.get("/auth/google", passport.authenticate("google", { scope: ["profile", "email"] }));

app.get("/auth/google/callback", 
    passport.authenticate("google", { failureRedirect: "/signin" }),
    (req, resp) => {
        const token = jwt.sign(
            { id: req.user._id, username: req.user.username, profilePic: req.user.profilePic },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        resp.cookie("token", token, { httpOnly: true });
        req.session.username = req.user.username;
        req.session.profilePic = req.user.profilePic;
        resp.redirect("/mainx");
    }
);

// signup form submission
app.post("/signupd", upload.single('profilePic'), async function(req, resp) {
    let email = req.body.txtEmail;
    let pwd = req.body.txtpassword;
    let uname = req.body.txtuname;
    let city = req.body.txtcity;
    let phone = req.body.txtphone;
    let profilePic = req.file ? '/uploads/' + req.file.filename : null;

    try {
        const user = new User({ 
            username: uname, 
            password: pwd, 
            email, 
            city, 
            phone,
            profilePic
        });
        
        await user.save();
        
        const token = jwt.sign(
            { id: user._id, username: user.username, profilePic: user.profilePic },
            JWT_SECRET,
            { expiresIn: "1h" }
        );
        resp.cookie("token", token, { httpOnly: true });
        
        req.session.username = uname;
        req.session.profilePic = profilePic;
        resp.render("main", {
            title: "main",
            username: uname,
            profilePic: profilePic
        });
    } catch (err) {
        console.error('Error saving user to MongoDB', err);
        if (err.code === 11000) {
            return resp.send('Email already exists');
        }
        resp.status(500).send('Failed to save user');
    }
});

app.get("/signin",function(req,resp){
    resp.render("signin",{
        title: "signin"
    });
})

app.get("/destination", authenticateJWT, function(req, resp) {
    resp.render("destination",{
        title: "destination",
        username: req.session.username,
        profilePic: req.session.profilePic
    });
})

const destinationData = {
    goa: {
        name: "Goa",
        image: "/images/destination/goa1.jpg",
        extraImages: ["/images/destination/goa1.jpg", "/images/destination/goa1.jpg"],
        description: "Goa is a state in western India with coastlines stretching along the Arabian Sea. Its long history as a Portuguese colony prior to 1961 is evident in its preserved 17th-century churches and the area’s tropical spice plantations. Goa is also known for its beaches, ranging from popular stretches at Baga and Palolem to those in laid-back fishing villages such as Agonda.",
        highlights: ["Beaches", "Nightlife", "Seafood", "Water Sports", "Old Goa Churches"]
    },
    kerala: {
        name: "Kerala",
        image: "/images/destination/kerala1.jpg",
        extraImages: ["/images/destination/kerala1.jpg", "/images/destination/kerala1.jpg"],
        description: "Kerala, a state on India's tropical Malabar Coast, has nearly 600km of Arabian Sea shoreline. It's known for its palm-lined beaches and backwaters, a network of canals. Inland are the Western Ghats, mountains whose slopes support tea, coffee and spice plantations as well as wildlife.",
        highlights: ["Backwaters", "Ayurveda", "Houseboats", "Tea Gardens", "Kathakali"]
    },
    mysore: {
        name: "Mysore",
        image: "/images/destination/mysore1.jpg",
        extraImages: ["/images/destination/mysore1.jpg", "/images/destination/mysore1.jpg"],
        description: "Mysuru (formerly Mysore), a city in India's southwestern Karnataka state, was the capital of the Kingdom of Mysore from 1399 until 1947. In its center is opulent Mysore Palace, seat of the former ruling Wodeyar dynasty.",
        highlights: ["Mysore Palace", "Chamundi Hill", "Brindavan Gardens", "Mysore Zoo"]
    },
    ladakh: {
        name: "Ladakh",
        image: "/images/destination/ladakh1.jpg",
        extraImages: ["/images/destination/ladakh1.jpg", "/images/destination/ladakh1.jpg"],
        description: "Ladakh is a region administered by India as a union territory, and constituting a part of the larger region of Kashmir, which has been the subject of dispute between India, Pakistan, and China since 1947.",
        highlights: ["Leh Palace", "Pangong Lake", "Magnetic Hill", "Shanti Stupa"]
    },
    agra: {
        name: "Agra",
        image: "/images/destination/tajmahal1.jpg",
        extraImages: ["/images/destination/tajmahal1.jpg", "/images/destination/tajmahal1.jpg"],
        description: "Agra is a city in northern India’s Uttar Pradesh state. It's home to the iconic Taj Mahal, a mausoleum built for the Mughal ruler Shah Jahan’s wife, Mumtaz Mahal (who died in childbirth in 1631).",
        highlights: ["Taj Mahal", "Agra Fort", "Fatehpur Sikri", "Mehtab Bagh"]
    },
    india_gate: {
        name: "India Gate",
        image: "/images/destination/india_gate1.jpg",
        extraImages: ["/images/destination/india_gate1.jpg", "/images/destination/india_gate1.jpg"],
        description: "The India Gate (formerly known as the All India War Memorial) is a war memorial located astride the Rajpath, on the eastern edge of the 'ceremonial axis' of New Delhi, formerly called Kingsway.",
        highlights: ["War Memorial", "Rajpath", "Garden", "Lighting"]
    },
    hampi: {
        name: "Hampi",
        image: "/images/destination/hampi1.jpg",
        extraImages: ["/images/destination/hampi1.jpg", "/images/destination/hampi1.jpg"],
        description: "Hampi is an ancient village in the south Indian state of Karnataka. It’s dotted with numerous ruined temple complexes from the Vijayanagara Empire.",
        highlights: ["Virupaksha Temple", "Vittala Temple", "Lotus Mahal", "Elephant Stables"]
    },
    rajasthan: {
        name: "Rajasthan",
        image: "/images/destination/rajasthan1.jpg",
        extraImages: ["/images/destination/rajasthan1.jpg", "/images/destination/rajasthan1.jpg"],
        description: "Rajasthan is a state in northern India. It covers 342,239 square kilometres or 10.4 per cent of India's total geographical area. It is the largest Indian state by area and the seventh largest by population.",
        highlights: ["Amer Fort", "Hawa Mahal", "City Palace", "Jaisalmer Fort"]
    },
    manali: {
        name: "Manali",
        image: "/images/destination/manali1.jpg",
        extraImages: ["/images/destination/manali1.jpg", "/images/destination/manali1.jpg"],
        description: "Manali is a high-altitude Himalayan resort town in India’s northern Himachal Pradesh state. It has a reputation as a backpacking center and honeymoon destination.",
        highlights: ["Rohtang Pass", "Solang Valley", "Hadimba Devi Temple", "Old Manali"]
    },
    srinagar: {
        name: "Srinagar",
        image: "/images/destination/srinagar1.jpg",
        extraImages: ["/images/destination/srinagar1.jpg", "/images/destination/srinagar1.jpg"],
        description: "Srinagar is the largest city and the summer capital of Jammu and Kashmir, India. It lies in the Kashmir Valley on the banks of the Jhelum River, a tributary of the Indus, and Dal and Anchar lakes.",
        highlights: ["Dal Lake", "Shalimar Bagh", "Nishat Bagh", "Shankaracharya Temple"]
    },
    amritsar: {
        name: "Amritsar",
        image: "/images/destination/amritsar1.jpg",
        extraImages: ["/images/destination/amritsar1.jpg", "/images/destination/amritsar1.jpg"],
        description: "Amritsar is a city in the northwestern Indian state of Punjab, 28 kilometers from the border with Pakistan. At the center of its walled old town, the gilded Golden Temple (Harmandir Sahib) is the holiest gurdwara (religious complex) of the Sikh religion.",
        highlights: ["Golden Temple", "Jallianwala Bagh", "Wagah Border", "Partition Museum"]
    },
    jogfalls: {
        name: "Jog Falls",
        image: "/images/destination/jogfalls1.jpg",
        extraImages: ["/images/destination/jogfalls1.jpg", "/images/destination/jogfalls1.jpg"],
        description: "Jog Falls is a waterfall on the Sharavati river located in the Western Ghats Sagara taluk, Shimoga district and its adjoining Uttara Kannada district of Karnataka, India.",
        highlights: ["Waterfall", "Sharavati River", "Western Ghats", "Sagara"]
    }
};

app.post("/destination_info", function(req, resp) {
    const place = Object.keys(req.body)[0]; // Get the key (e.g., 'goa', 'kerala')
    const destination = destinationData[place];
    
    if (destination) {
        resp.render("destination_info", {
            title: destination.name,
            destination: destination,
            username: req.session.username,
            profilePic: req.session.profilePic
        });
    } else {
        resp.send("Destination information not found.");
    }
});

app.get("/booking", authenticateJWT, function(req, resp) {
    resp.render("booking",{
        title: "booking",
        username: req.session.username,
        profilePic: req.session.profilePic
    });
})

app.get("/book", authenticateJWT, async function(req, resp) {
    let email = req.query.femail;
    let city = req.query.city;
    let phone = req.query.fphone;
    let desti = req.query.fdesti;
    let last = req.query.flast;
    let fname = req.query.ffname;

    try {
        const booking = new Booking({
            fname: fname,
            last: last,
            email: email,
            city: city,
            phone: phone,
            desti: desti
        });

        await booking.save();
        resp.send("congratulations!! Your request has been send and will be updated very soon");
    } catch (err) {
        console.error('Error saving booking to MongoDB', err);
        resp.status(500).send("An error occurred while processing your booking: " + err.message);
    }
});

app.get("/feedback", authenticateJWT, function(req, resp) {
    resp.render("feedback",{
        title: "feedback",
        username: req.session.username,
        profilePic: req.session.profilePic
    });
})

// feedback form submission
app.get("/feed", authenticateJWT, async function(req, resp) {
    let email = req.query.txtemail;
    let uname = req.query.uname;
    let feedback = req.query.feedback;

    try {
        const newFeedback = new Feedback({
            uname: uname,
            email: email,
            feedback: feedback
        });

        await newFeedback.save();
        resp.send("thnku sir");
    } catch (err) {
        console.error('Error saving feedback to MongoDB', err);
        resp.status(500).send("An error occurred while saving your feedback: " + err.message);
    }
});

app.get("/login", async function(req, resp) {
    let email = req.query.txtemail;
    let pwd = req.query.txtpassword;

    try {
        const user = await User.findOne({ email: email, password: pwd });
        if (user) {
            const token = jwt.sign(
                { id: user._id, username: user.username, profilePic: user.profilePic },
                JWT_SECRET,
                { expiresIn: "1h" }
            );
            resp.cookie("token", token, { httpOnly: true });

            req.session.username = user.username;
            req.session.profilePic = user.profilePic;
            resp.render("main", {
                title: "main",
                username: user.username,
                profilePic: user.profilePic
            });
        } else {
            resp.send("Invalid email or password");
        }
    } catch (err) {
        console.error('Error during login', err);
        resp.status(500).send("An error occurred during login");
    }
});

app.get("/gallery", authenticateJWT, function(req, resp) {
    resp.render("gallery",{
        title: "gallery",
        username: req.session.username,
        profilePic: req.session.profilePic
    });
})

app.get("/profile", authenticateJWT, async function(req, resp) {
    try {
        const user = await User.findOne({ username: req.session.username });
        resp.render("profile", {
            title: "Profile",
            user: user,
            username: req.session.username,
            profilePic: req.session.profilePic,
            message: req.session.profileMessage
        });
        delete req.session.profileMessage;
    } catch (err) {
        resp.status(500).send("Error loading profile");
    }
});

app.post("/profile/update", authenticateJWT, upload.single('profilePic'), async function(req, resp) {
    try {
        const user = await User.findOne({ username: req.session.username });
        if (!user) return resp.send("User not found");

        // Update fields
        user.username = req.body.username;
        if (req.body.newPassword) {
            user.password = req.body.newPassword;
        }
        if (req.file) {
            user.profilePic = '/uploads/' + req.file.filename;
        }

        await user.save();
        
        // Update session
        req.session.username = user.username;
        req.session.profilePic = user.profilePic;
        
        req.session.profileMessage = { type: 'success', text: 'Profile updated successfully!' };
        resp.redirect("/profile");
    } catch (err) {
        console.error(err);
        req.session.profileMessage = { type: 'error', text: 'Error updating profile' };
        resp.redirect("/profile");
    }
});

app.get("/mainx", authenticateJWT, function(req, resp) { 
    resp.render("main",{
        title: "main",
        username: req.session.username,
        profilePic: req.session.profilePic
    });
})

app.listen(805,function(){
    console.log("server started");
})
