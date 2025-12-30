require("dotenv").config();
const mongoose = require("mongoose");
const scrapeBlogs = require("./scraper/scrapeBlogs");

mongoose.connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("DB connected");

    await scrapeBlogs();

    console.log("Scraping finished");
    process.exit();
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
