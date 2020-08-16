require("dotenv").config()
const express = require('express');
const router = express.Router();
const gravatar = require('gravatar');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const passport = require('passport');


// Load User Model
const User = require('../models/User');

router.get('/test', (req, res) => {
  res.json('route hit')
  console.log('route hit')
})

// STRETCH: SEARCH FOR USERS VIA SEARCH BAR
router.get('/search', (req, res) => {
    User.find({})
    .then(searchedUser => {
        if (!searchedUser) {
            res.send('no user by that name, please try again')
        } else {
            res.send(searchedUser)
        }
    }).catch(error => {
        res.send({message: 'Server error, please try again'})
        console.log(error)
    })
})

router.get('/teachers', (req, res) => {
  User.find({})
    .then(teachers => {
      if (User.isTeacher == "True") {
        res.send(teachers)
      }
      else {
        res.send('No Teachers at this time.')
      }
    }) .catch(error => {
      res.send({message: 'Server error, please try again'})
      console.log(error)
    })
})

// GET api/users/current (Private)
router.get('/current', passport.authenticate('jwt', { session: false }), (req, res) => {

  res.json({
    id: req.user.id,
    name: req.user.name,
    email: req.user.email,
    avatar: req.user.avatar,
  })
});


// GET api/users/register (Public)
router.post('/register', (req, res) => {
  // Find User By Email
  User.findOne({ email: req.body.email })
    .then(user => {
      if(user) {
        return res.status(400).json({email: 'Email already exists'});
      } else {
        // Get avatar from Gravatar
        const avatar = gravatar.url(req.body.email, {
          s: '200', // avatar size option
          r: 'pg', // avatar rating option
          d: 'mm', // default avatar option
        });

        // Create new user
        const newUser = new User({
          name: req.body.name,
          email: req.body.email,
          avatar,
          password: req.body.password,
          isTeacher: req.body.isTeacher,
          bio: req.body.bio,
          instrumentsPlayed: req.body.instrumentsPlayed
        });

        //console.log(req.body.name)

        // Salt and Hash password with bcryptjs, then save new user
        bcrypt.genSalt(10, function (err, salt) {
          bcrypt.hash(newUser.password, salt, function (err, hash) {
            if(err) throw err;
            
            newUser.password = hash;
            newUser.save()
              .then(user => res.json(user))
              .catch(err => console.log(err));
          })
        })
      }
    })
});

// GET api/users/login (Public)

router.post('/login', (req, res) => {
  const email = req.body.email;
  const password = req.body.password;
  // Find User by email
  User.findOne({ email })
    .then(user => {
      // Check for user
      if(!user) {
        return res.status(404).json({ email: 'User not found' })
      }

      // Check password
      bcrypt.compare(password, user.password)
        .then(isMatch => {
          if(isMatch) {
            // User matched, send JSON Web Token

            // Create token payload (you can include anything you want)
            const payload = { id: user.id, name: user.name, avatar: user.avatar }

            // Sign token
            jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: 3600 }, (err, token) => {
              res.json({ success: true, token: 'Bearer ' + token })
            });
          } else {
            return res.status(400).json({ password: 'Password or email is incorrect' })
          }
        })
    })
});

router.put ('/:id', (req, res) => {
  User.findOneAndUpdate({ _id: req.params.id },
      req.body,
      {new: true}
      )
      .then(updatedUser => {
          res.send(updatedUser)
      })
      .catch(error => {
          res.send({message: 'Server error'})
          console.error(error)
  })
})


module.exports = router;