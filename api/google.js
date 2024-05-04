/* eslint-disable */
const express = require("express");
var request = require("request");
var rp = require("request-promise-native");

module.exports = function (app) {
  var googleRoute = express.Router();

  googleRoute.route("/users").get((req, res) => {
    res.send([
      process.env.HANNA_EMAIL,
      process.env.ADAM_EMAIL,
      process.env.CHRIS_EMAIL,
    ]);
  });

  return googleRoute;
};
