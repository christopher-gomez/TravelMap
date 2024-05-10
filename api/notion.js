/* eslint-disable */
const express = require("express");
var request = require("request");
var rp = require("request-promise-native");
const { Client } = require("@notionhq/client");

// Initializing a client
const notion = new Client({
  auth: process.env.NOTION_TOKEN,
});

module.exports = function (app) {
  var notionRoute = express.Router();

  notionRoute.route("/users").get(async (req, res) => {
    const response = await notion.users.list({});
    res.send(response);
  });

  notionRoute.route("/database/:id?").get(async (req, res) => {
    try {
      const id = req.params.id || process.env.FAMILY_NOTION_DATABASE_ID;
      const response = await notion.databases.retrieve({
        database_id: id,
      });
      res.send(response);
    } catch (error) {
      console.error(error.body);
      res.status(500).send(error.body);
    }
  });

  notionRoute.route("/database/:id?").post(async (req, res) => {
    try {
      const id = req.params.id || process.env.FAMILY_NOTION_DATABASE_ID;

      const response = await notion.databases.query({
        database_id: id,
        filter: req.body.filter,
        sorts: req.body.sorts,
        start_cursor:
          req.body.start_cursor !== null ? req.body.start_cursor : undefined,
      });

      res.send(response);
    } catch (error) {
      console.error(error.body);
      res.status(500).send(error.body);
    }
  });

  notionRoute.route("/page/:id?").get(async (req, res) => {
    try {
      const id = req.params.id || process.env.FAMILY_NOTION_PAGE_ID;

      const response = await notion.pages.retrieve({
        page_id: id,
      });
      res.send(response);
    } catch (error) {
      console.error(error.body);
      res.status(500).send(error.body);
    }
  });

  notionRoute.route("/page/:id").patch(async (req, res) => {
    try {
      const id = req.params.id;

      const response = await notion.pages.update({
        page_id: id,
        ...req.body
      });

      res.send(response);
    } catch (error) {
      console.error(error.body);
      res.status(500).send(error.body);
    }
  });

  notionRoute.route("/page").post(async (req, res) => {
    try {
      const response = await notion.pages.create({
        parent: { database_id: process.env.FAMILY_NOTION_DATABASE_ID },
        properties: req.body.properties,
      });

      res.send(response);
    } catch (error) {
      console.error(error.body);
      res.status(500).send(error.body);
    }
  });

  return notionRoute;
};
