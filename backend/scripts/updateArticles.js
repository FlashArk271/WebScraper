require("dotenv").config();
const mongoose = require("mongoose");
const axios = require("axios");
const cheerio = require("cheerio");
const Groq = require("groq-sdk");
const Article = require("../models/Article");

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// Search using Serper.dev (Google Search API)
async function searchWeb(query) {
  try {
    const response = await axios.post(
      "https://google.serper.dev/search",
      {
        q: query + " blog article",
        num: 10
      },
      {
        headers: {
          "X-API-KEY": process.env.SERPER_API_KEY,
          "Content-Type": "application/json"
        },
        timeout: 15000
      }
    );
    
    const results = response.data.organic || [];
    const links = [];
    
    for (const result of results) {
      const url = result.link;
      
      if (url && 
          !url.includes("beyondchats.com") &&
          !url.includes("youtube.com") &&
          !url.includes("facebook.com") &&
          !url.includes("twitter.com") &&
          !url.includes("linkedin.com") &&
          !url.includes("reddit.com") &&
          !url.includes("quora.com") &&
          !url.includes("pinterest.com") &&
          !url.includes("instagram.com") &&
          !url.includes("amazon.com") &&
          !url.includes("wikipedia.org")) {
        links.push(url);
      }
      
      if (links.length >= 2) break;
    }
    
    console.log(`   Serper found ${results.length} results, using ${links.length}`);
    return links;
    
  } catch (error) {
    console.error("   Serper API error:", error.response?.data?.message || error.message);
    return [];
  }
}

// Scrape content from a URL
async function scrapeContent(url) {
  try {
    const response = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
      },
      timeout: 10000
    });
    
    const $ = cheerio.load(response.data);
    
    // Remove unwanted elements
    $("script, style, nav, header, footer, aside, .sidebar, .comments, .advertisement").remove();
    
    // Try to get article content
    let content = "";
    
    if ($("article").length) {
      content = $("article").text();
    } else if ($(".post-content").length) {
      content = $(".post-content").text();
    } else if ($(".entry-content").length) {
      content = $(".entry-content").text();
    } else if ($("main").length) {
      content = $("main").text();
    } else {
      content = $("body").text();
    }
    
    // Clean up
    content = content.replace(/\s+/g, " ").trim().substring(0, 5000);
    return content;
    
  } catch (error) {
    console.error(`Error scraping ${url}:`, error.message);
    return "";
  }
}

// Use Groq LLM to update the article
async function updateArticleWithLLM(originalContent, referenceArticles) {
  const referencesText = referenceArticles
    .map((ref, i) => `Reference ${i + 1} (${ref.url}):\n${ref.content}`)
    .join("\n\n---\n\n");
  
  const prompt = `You are a professional content writer. Your task is to improve and update the following article based on the reference articles provided.

ORIGINAL ARTICLE:
${originalContent.substring(0, 3000)}

REFERENCE ARTICLES FROM TOP GOOGLE RESULTS:
${referencesText.substring(0, 4000)}

INSTRUCTIONS:
1. Improve the formatting, structure, and readability of the original article
2. Add relevant insights from the reference articles
3. Keep the main topic and message intact
4. Make it more engaging and professional
5. Add clear headings and bullet points where appropriate
6. Keep the content length similar to the original
7. Write in a professional but conversational tone

Return ONLY the improved article content. Do not include any explanations or meta-commentary.`;

  try {
    const completion = await groq.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "openai/gpt-oss-20b",
      temperature: 0.7,
      max_tokens: 4000,
    });
    
    return completion.choices[0]?.message?.content || "";
  } catch (error) {
    console.error("LLM error:", error.message);
    return "";
  }
}

// Main function
async function updateArticles() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("DB connected\n");
    
    // Get articles that haven't been updated yet
    const articles = await Article.find({ updatedContent: { $in: [null, ""] } });
    
    if (articles.length === 0) {
      console.log("No articles to update. All articles already have updated content.");
      process.exit(0);
    }
    
    console.log(`Found ${articles.length} articles to update\n`);
    
    for (const article of articles) {
      console.log(`\n========================================`);
      console.log(`Processing: ${article.title}`);
      console.log(`========================================\n`);
      
      // Step 1: Search Google via Serper API
      console.log("1. Searching Google (Serper)...");
      const searchQuery = article.title;
      const searchLinks = await searchWeb(searchQuery);
      
      if (searchLinks.length === 0) {
        console.log("   No search results found, skipping...");
        continue;
      }
      
      console.log(`   Found ${searchLinks.length} reference links:`);
      searchLinks.forEach((link, i) => console.log(`   ${i + 1}. ${link}`));
      
      // Step 2: Scrape content from reference articles
      console.log("\n2. Scraping reference articles...");
      const referenceArticles = [];
      
      for (const url of searchLinks) {
        console.log(`   Scraping: ${url.substring(0, 50)}...`);
        const content = await scrapeContent(url);
        
        if (content) {
          referenceArticles.push({ url, content });
          console.log(`   ✓ Got ${content.length} chars`);
        } else {
          console.log(`   ✗ Failed to scrape`);
        }
        
        await new Promise(r => setTimeout(r, 1000));
      }
      
      if (referenceArticles.length === 0) {
        console.log("   No reference content available, skipping...");
        continue;
      }
      
      // Step 3: Use LLM to update the article
      console.log("\n3. Calling Groq LLM to update article...");
      const updatedContent = await updateArticleWithLLM(
        article.originalContent,
        referenceArticles
      );
      
      if (!updatedContent) {
        console.log("   LLM returned empty response, skipping...");
        continue;
      }
      
      console.log(`   ✓ Generated ${updatedContent.length} chars`);
      
      // Step 4: Save to database with references
      console.log("\n4. Saving to database...");
      
      // Add references at the bottom
      const references = referenceArticles.map(r => r.url);
      const contentWithReferences = `${updatedContent}\n\n---\n\n**References:**\n${references.map((r, i) => `${i + 1}. ${r}`).join("\n")}`;
      
      await Article.findByIdAndUpdate(article._id, {
        updatedContent: contentWithReferences,
        references: references
      });
      
      console.log("   ✓ Saved successfully!\n");
      
      // Delay before next article
      await new Promise(r => setTimeout(r, 2000));
    }
    
    console.log("\n========================================");
    console.log("All articles processed!");
    console.log("========================================\n");
    
  } catch (error) {
    console.error("Error:", error);
  } finally {
    await mongoose.disconnect();
    process.exit(0);
  }
}

updateArticles();
