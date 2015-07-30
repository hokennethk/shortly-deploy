var request = require('request');
var crypto = require('crypto');
var bcrypt = require('bcrypt-nodejs');
var util = require('../lib/utility');

var db = require('../app/config');
var User = require('../app/models/user');
var Link = require('../app/models/link');
// var Users = require('../app/collections/users');
// var Links = require('../app/collections/links');

exports.renderIndex = function(req, res) {
  res.render('index');
};

exports.signupUserForm = function(req, res) {
  res.render('signup');
};

exports.loginUserForm = function(req, res) {
  res.render('login');
};

exports.logoutUser = function(req, res) {
  req.session.destroy(function(){
    res.redirect('/login');
  });
};

exports.fetchLinks = function(req, res) {
  Link.find(function(err, links){
    if(err) {
      return console.error(err);
    }
    res.send(200, links);
  });
};

exports.saveLink = function(req, res) {
  var uri = req.body.url;

  if (!util.isValidUrl(uri)) {
    console.log('Not a valid url: ', uri);
    return res.send(404);
  }


  Link.findOne({ url:uri }, function(err, link) {
    if (err) {
      return console.error(err);
    }
    if (link) {
      res.send(200, link);
    } else {
      util.getUrlTitle(uri, function(err, title) {
        if (err) {
          console.error('Error reading URL heading: ', err);
          return res.send(404);
        }

        var link = new Link({
          url: uri,
          title: title,
          base_url: req.headers.origin
        });

        link.save(function(err, newLink) {
          if (err) {
            return console.error(err);
          }
          // Links.add(newLink);
          res.send(200, newLink);
        });
      });  
    }
  });
};

exports.loginUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({ username: username }, function(err, user) {
    if (err) {
      return console.error(err);
    }

    if (!user) {
      res.redirect('/login');
      console.log("who are you???")
    } else {
      user.comparePassword(password, function(match) {
        if (match) {
          util.createSession(req, res, user);
        } else {
          console.log("the user is: ", user)
          console.log("password didn't match")
          res.redirect('/login');
        }
      })
    }
  })
};

exports.signupUser = function(req, res) {
  var username = req.body.username;
  var password = req.body.password;

  User.findOne({username: username}, function(err, user){
    if(err){
      return console.error(err);
    }
    if (!user) {
      var newUser = new User({
        username: username,
        password: password
      });
      newUser.save(function(err, newUser) {
        if (err) {
          return console.error(err);
        }
        util.createSession(req, res, newUser);
        // Users.add(newUser);
      });
    } else {
      console.log('Account already exists');
      res.redirect('/signup');
    } 
  });
};

exports.navToLink = function(req, res) {
  Link.findOne({code: req.params[0]}, function(err, link){
    if(err){
      return console.error(err);
    }
    if (!link) {
      res.redirect('/');
    } else {
      link.visits = link.visits + 1;
      link.save(function(err) {
        if (err) { return console.error(err); }
        return res.redirect(link.url);
      });
    }
  });
};