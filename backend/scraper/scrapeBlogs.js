const axios = require("axios");
const cheerio = require("cheerio");
const Article = require("../models/Article");

const BASE_URL = "https://beyondchats.com/blogs/";

// Function to find the last page number
async function getLastPageNumber() {
  try {
    const response = await axios.get(BASE_URL);
    const $ = cheerio.load(response.data);
    
    // Find pagination links and get the highest page number
    let lastPage = 1;
    $("a").each((i, el) => {
      const href = $(el).attr("href") || "";
      const match = href.match(/\/blogs\/page\/(\d+)/);
      if (match) {
        const pageNum = parseInt(match[1]);
        if (pageNum > lastPage) lastPage = pageNum;
      }
    });
    
    return lastPage;
  } catch (error) {
    console.error("Error finding last page:", error.message);
    return 15; 
  }
}

// Function to extract articles from a page
async function getArticlesFromPage(pageUrl) {
  const articles = [];
  try {
    const response = await axios.get(pageUrl);
    const $ = cheerio.load(response.data);
    
    // Find all article links - look for h2 tags with links inside
    $("h2").each((i, el) => {
      const link = $(el).find("a").first();
      if (link.length) {
        const href = link.attr("href");
        const title = link.text().trim();
        
        // Only include beyondchats blog articles
        if (href && href.includes("beyondchats.com/blogs/") && title && !href.includes("/tag/")) {
          articles.push({ title, url: href });
        }
      }
    });
    
  } catch (error) {
    console.error(`Error fetching page ${pageUrl}:`, error.message);
  }
  return articles;
}

// Function to scrape article content
async function scrapeArticleContent(url) {
  try {
    const response = await axios.get(url);
    const $ = cheerio.load(response.data);
    
    let content = "";
    
    // Try article tag first
    if ($("article").length) {
      content = $("article").text().trim();
    }
    // Try main content area
    else if ($(".entry-content").length) {
      content = $(".entry-content").text().trim();
    }
    // Try post content
    else if ($(".post-content").length) {
      content = $(".post-content").text().trim();
    }
    // Fallback to body
    else {
      content = $("body").text().trim();
    }
    
    // Clean up content
    content = content.replace(/\s+/g, " ").substring(0, 10000);
    return content;
    
  } catch (error) {
    console.error(`Error scraping content from ${url}:`, error.message);
    return "";
  }
}

async function scrapeBlogs() {
  console.log("Scraping started...");
  
  // Step 1: Find the last page
  console.log("Finding last page of blogs...");
  const lastPage = await getLastPageNumber();
  console.log(`Last page found: ${lastPage}\n`);
  
  // Step 2: Collect articles from last pages until we have 5
  let allArticles = [];
  let currentPage = lastPage;
  
  while (allArticles.length < 5 && currentPage > 0) {
    const pageUrl = currentPage === 1 ? BASE_URL : `${BASE_URL}page/${currentPage}/`;
    console.log(`Fetching articles from page ${currentPage}...`);
    
    const pageArticles = await getArticlesFromPage(pageUrl);
    
    // Remove duplicates based on URL
    for (const article of pageArticles) {
      if (!allArticles.some(a => a.url === article.url)) {
        allArticles.push(article);
      }
    }
    
    currentPage--;
    await new Promise(r => setTimeout(r, 500)); // Small delay
  }
  
  // Take only the first 5 (oldest articles from last pages)
  const oldestArticles = allArticles.slice(0, 5);
  console.log(`\nFound ${oldestArticles.length} oldest articles to scrape:\n`);
  
  // Step 3: Scrape each article and save to database
  for (const article of oldestArticles) {
    try {
      // Check if already exists
      const exists = await Article.findOne({ sourceUrl: article.url });
      if (exists) {
        console.log(`Already exists: ${article.title}`);
        continue;
      }
      
      console.log(`Scraping: ${article.title}`);
      const content = await scrapeArticleContent(article.url);
      
      if (!content) {
        console.log(`  ⚠ No content found, skipping...`);
        continue;
      }
      
      // Save to database
      await Article.create({
        title: article.title,
        originalContent: content,
        sourceUrl: article.url,
      });
      
      console.log(`  ✓ Saved to database\n`);
      
      // Delay between requests
      await new Promise(r => setTimeout(r, 1000));
      
    } catch (error) {
      console.error(`Error processing ${article.title}:`, error.message);
    }
  }
  
  console.log("Scraping completed!");
}

module.exports = scrapeBlogs;
