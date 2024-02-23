/* eslint-disable */
const express = require('express');
var request = require('request');
var rp = require('request-promise-native');

module.exports = function (app) {
    var mapsRoute = express.Router();

    mapsRoute.route('/api').get((req, res) => {
        res.send({ key: process.env.GOOGLE_MAPS_API_KEY });
    });

    mapsRoute.route('/api/directions').get((req, res) => {
        const { origin, destination } = req.query;
        const now = new Date();
        const utcNow = new Date(now.getTime() + now.getTimezoneOffset() * 60000);
        const japanTime = new Date(new Date(utcNow.getTime() + 9 * 3600000).setHours(8));
        const formattedDate = japanTime.toISOString().split('T')[0]; // YYYY-MM-DD
        const formattedTime = japanTime.toTimeString().split(' ')[0]; // HH:MM:SS
        const url = `https://transit.land/api/v2/routing/otp/plan?fromPlace=${origin}&toPlace=${destination}&date=${formattedDate}&time=${formattedTime}&api_key=${process.env.TRANSIT_LAND_API_KEY}`

        try {
            request(url, function (error, response, body) {
                res.send(body);
            });
        } catch (err) {
            res.send(err);
        }
    });

    return mapsRoute;
}