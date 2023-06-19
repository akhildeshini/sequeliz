const express = require("express");
const app = express();
app.use(express.json());
const schedule = require("node-schedule");

const rules = new schedule.RecurrenceRule();



const job = schedule.scheduleJob(rules, function () {
  console.log("vidyalu and akhilu!");
},);
