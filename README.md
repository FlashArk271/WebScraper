# 📚 BeyondChats Article Scraper & AI Updater

Scrapes articles from BeyondChats blog, enhances them using AI, and displays both versions in a React frontend.

## 🌐 Live Demo
**[https://beyondchats-articles.vercel.app](https://beyondchats-articles.vercel.app)**

---

## 🛠️ Tech Stack

| Layer | Technologies |
|-------|-------------|
| **Frontend** | React.js, Axios, CSS3 |
| **Backend** | Node.js, Express.js, Mongoose |
| **Database** | MongoDB Atlas |
| **Scraping** | Cheerio, Axios |
| **APIs** | Groq LLM, Serper (Google Search) |

---

## 🏗️ Architecture

```
┌────────────────┐      ┌─────────────────────────────────────────┐
│  BeyondChats   │      │              BACKEND                    │
│    /blogs      │      │                                         │
└───────┬────────┘      │  ┌─────────┐  ┌──────────┐  ┌────────┐ │
        │               │  │ Scraper │  │ Express  │  │ Update │ │
        │ Scrape        │  │ (Phase1)│  │  Server  │  │ Script │ │
        ▼               │  │         │  │          │  │(Phase2)│ │
   ┌─────────┐          │  └────┬────┘  └────┬─────┘  └───┬────┘ │
   │ Cheerio │──────────┼──────►│            │            │      │
   │  Parse  │          │       │     ┌──────┴──────┐     │      │
   └─────────┘          │       └────►│  MongoDB    │◄────┘      │
                        │             │   Atlas     │            │
                        │             └──────┬──────┘            │
                        └────────────────────┼───────────────────┘
                                             │
┌────────────────┐      ┌────────────────┐   │   ┌───────────────┐
│  Serper API    │◄─────│  Update Script │   │   │   Groq LLM    │
│ Google Search  │      │                │───┼──►│ AI Enhancement│
└────────────────┘      └────────────────┘   │   └───────────────┘
                                             │
                        ┌────────────────────┼───────────────────┐
                        │              FRONTEND                  │
                        │  ┌─────────────────▼────────────────┐  │
                        │  │         React.js App             │  │
                        │  │  • Article Cards                 │  │
                        │  │  • Original/Updated Toggle       │  │
                        │  │  • Markdown Formatting           │  │
                        │  └──────────────────────────────────┘  │
                        └────────────────────────────────────────┘
```

---

## 📁 Project Structure

```
BeyondChatA/
├── backend/
│   ├── models/Article.js         # MongoDB schema
│   ├── routes/articleRoutes.js   # CRUD APIs
│   ├── scraper/scrapeBlogs.js    # Scraper (Phase 1)
│   ├── scripts/updateArticles.js # AI updater (Phase 2)
│   ├── server.js                 # Express server
│   └── .env                      # Environment variables
├── frontend/
│   └── src/App.js                # React app
└── README.md
```

---

## 🚀 Local Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas account
- API Keys: [Groq](https://console.groq.com) | [Serper](https://serper.dev)

### 1. Clone & Install

```bash
git clone https://github.com/yourusername/BeyondChatA.git
cd BeyondChatA/backend && npm install
cd ../frontend && npm install
```

### 2. Configure `.env` (in `/backend`)

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/beyondchats
GROQ_API_KEY=gsk_xxxxxxxxxxxx
SERPER_API_KEY=xxxxxxxxxxxx
PORT=5000
```

### 3. Run the Project

```bash
# Terminal 1: Scrape articles (Phase 1)
cd backend && npm run scrape

# Terminal 2: Start backend server
npm start

# Terminal 3: AI enhancement (Phase 2)
npm run update

# Terminal 4: Start frontend
cd ../frontend && npm start
```

**Backend:** http://localhost:5000 | **Frontend:** http://localhost:3000



## 📜 Scripts

| Command | Description |
|---------|-------------|
| `npm run scrape` | Scrape 5 oldest articles from BeyondChats |
| `npm run update` | Enhance articles using AI |
| `npm start` | Start server/frontend |

---

