var express = require("express");
var router = express.Router();
const { body, validationResult } = require("express-validator");
const bcrypt = require("bcrypt");
const usermodel = require("../models/user");
const jwt = require("jsonwebtoken");

/* GET users listing. */
router.get("/register", function (req, res, next) {
  res.render("register");
});

router.post(        // register the user
  "/register",
  body("username").trim().isLength({ min: 3 }),
  body("email").trim().isEmail(),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        messages: "invalid data",
      });
    } else {         // if valid form of data is given
      const { username, email, password } = req.body;

      // check existing username or email
      const exists = await usermodel.findOne({
        $or: [{ username: username }, { email: email }]
      });

      if (exists) {
        return res.status(400).json({message: "email or username already in use"})
      }

      const hashpassword = await bcrypt.hash(password, 10);

      await usermodel.create({
        username,
        email,
        password: hashpassword,
      });

      return res.redirect("/users/login");     // redirect to login
    }
  }
);

router.get("/login", function (req, res, next) {
  res.render("login");
});

router.post(         // login the user
  "/login",
  body("username").trim().isLength({ min: 3 }),
  body("password").isLength({ min: 6 }),
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({
        errors: errors.array(),
        messages: "invalid data",
      });
    } else {      // if valid form of data is given
      const { username, password } = req.body;
      const user = await usermodel.findOne({ username: username });

      if (!user) {
        return res.status(400).json({
          message: "username or password is incorrect",
        });
      } else {         // if that user exists
        const ismatch = await bcrypt.compare(password, user.password);

        if (!ismatch) {
          return res.status(400).json({
            message: "username or password is incorrect",
          });
        } else {        // if all data given is correct
          const token = jwt.sign(         // generate token
            {
              userID: user._id,
              username: user.username,
            },
            process.env.JWT_SECRET
          );

          res.cookie("token", token);        // save the token in cookies

          return res.redirect("/home")      // show the homepage
        }
      }
    }
  }
);


module.exports = router;
