/* eslint-disable */
const express = require('express');
var request = require('request');
var rp = require('request-promise-native');

module.exports = function (app) {
	var mapsRoute = express.Router();

    mapsRoute.route('/api').get((req, res) => {
        res.send({ key: process.env.GOOGLE_MAPS_API_KEY });
    });

	return mapsRoute;
}