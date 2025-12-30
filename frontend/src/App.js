import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = 'http://localhost:5000/api/articles';

// Function to format markdown-like content to proper HTML
function formatContent(text) {
  if (!text) return '';
  
  let formatted = text;
  
  // Convert **bold** to <strong>
  formatted = formatted.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  
  // Convert *italic* to <em>
  formatted = formatted.replace(/\*(.+?)\*/g, '<em>$1</em>');
  
  // Convert ### headings
  formatted = formatted.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  formatted = formatted.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  formatted = formatted.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  
  // Convert bullet points
  formatted = formatted.replace(/^[•\-\*] (.+)$/gm, '<li>$1</li>');
  
  // Wrap consecutive <li> in <ul>
  formatted = formatted.replace(/(<li>.*<\/li>\n?)+/g, '<ul>$&</ul>');
  
  // Convert numbered lists
  formatted = formatted.replace(/^\d+\. (.+)$/gm, '<li>$1</li>');
  
  // Convert --- to <hr>
  formatted = formatted.replace(/^---+$/gm, '<hr>');
  
  // Convert line breaks to paragraphs
  const paragraphs = formatted.split(/\n\n+/);
  formatted = paragraphs
    .map(p => {
      p = p.trim();
      if (!p) return '';
      if (p.startsWith('<h') || p.startsWith('<ul') || p.startsWith('<ol') || p.startsWith('<hr')) {
        return p;
      }
      return `<p>${p.replace(/\n/g, '<br>')}</p>`;
    })
    .join('');
  
  return formatted;
}

function App() {
  const [articles, setArticles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [showUpdated, setShowUpdated] = useState(false);

  useEffect(() => {
    fetchArticles();
  }, []);

  const fetchArticles = async () => {
    try {
      const response = await axios.get(API_URL);
      setArticles(response.data);
    } catch (error) {
      console.error('Error fetching articles:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredArticles = () => {
    switch (activeTab) {
      case 'original':
        return articles;
      case 'updated':
        return articles.filter(a => a.updatedContent);
      default:
        return articles;
    }
  };

  const truncateContent = (content, length = 250) => {
    if (!content) return '';
    // Remove markdown formatting for preview
    let clean = content
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/^#{1,3} /gm, '')
      .replace(/^[•\-\*] /gm, '');
    return clean.length > length ? clean.substring(0, length) + '...' : clean;
  };

  const openModal = (article, showUpdatedVersion) => {
    setSelectedArticle(article);
    setShowUpdated(showUpdatedVersion && article.updatedContent);
  };

  const closeModal = () => {
    setSelectedArticle(null);
    setShowUpdated(false);
  };

  if (loading) {
    return (
      <div className="container">
        <div className="header">
          <h1>📚 BeyondChats Articles</h1>
          <p>View original and AI-updated versions of blog articles</p>
        </div>
        <div className="loading">
          <div className="loading-spinner"></div>
          Loading articles...
        </div>
      </div>
    );
  }

  return (
    <div className="container">
      {/* Header */}
      <div className="header">
        <h1>📚 BeyondChats Articles</h1>
        <p>View original and AI-updated versions of blog articles</p>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'all' ? 'active' : ''}`}
          onClick={() => setActiveTab('all')}
        >
          All ({articles.length})
        </button>
        <button 
          className={`tab-btn ${activeTab === 'original' ? 'active' : ''}`}
          onClick={() => setActiveTab('original')}
        >
          Original
        </button>
        <button 
          className={`tab-btn ${activeTab === 'updated' ? 'active' : ''}`}
          onClick={() => setActiveTab('updated')}
        >
          AI Updated ({articles.filter(a => a.updatedContent).length})
        </button>
      </div>

      {/* Articles Grid */}
      {filteredArticles().length === 0 ? (
        <div className="empty-state">
          <h3>No articles found</h3>
          <p>Run the scraper to fetch articles from BeyondChats</p>
        </div>
      ) : (
        <div className="articles-grid">
          {filteredArticles().map((article) => (
            <div key={article._id} className="article-card">
              <div className="article-header">
                <h2>{article.title}</h2>
              </div>
              
              <div className="article-body">
                <div className="article-content">
                  {truncateContent(article.originalContent)}
                </div>
              </div>
              
              <div className="article-footer">
                <div className="btn-group">
                  <button 
                    className="btn btn-original"
                    onClick={() => openModal(article, false)}
                  >
                    📄 Original
                  </button>
                  {article.updatedContent && (
                    <button 
                      className="btn btn-updated"
                      onClick={() => openModal(article, true)}
                    >
                      ✨ AI Updated
                    </button>
                  )}
                </div>
                <span className={`badge ${article.updatedContent ? 'updated' : 'original'}`}>
                  {article.updatedContent ? '✓ Enhanced' : 'Original'}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      {selectedArticle && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <button className="modal-close" onClick={closeModal}>×</button>
              <h2>{selectedArticle.title}</h2>
              
              {selectedArticle.updatedContent && (
                <div className="modal-tabs">
                  <button 
                    className={`modal-tab ${!showUpdated ? 'active' : ''}`}
                    onClick={() => setShowUpdated(false)}
                  >
                    📄 Original
                  </button>
                  <button 
                    className={`modal-tab updated-tab ${showUpdated ? 'active' : ''}`}
                    onClick={() => setShowUpdated(true)}
                  >
                    ✨ AI Updated
                  </button>
                </div>
              )}
            </div>
            
            <div className="modal-body">
              <div 
                className="formatted-content"
                dangerouslySetInnerHTML={{ 
                  __html: formatContent(
                    showUpdated ? selectedArticle.updatedContent : selectedArticle.originalContent
                  ) 
                }}
              />
              
              {showUpdated && selectedArticle.references && selectedArticle.references.length > 0 && (
                <div className="references">
                  <h4>📎 References</h4>
                  {selectedArticle.references.map((ref, index) => (
                    <a key={index} href={ref} target="_blank" rel="noopener noreferrer">
                      {index + 1}. {ref}
                    </a>
                  ))}
                </div>
              )}
              
              <a 
                href={selectedArticle.sourceUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="source-btn"
              >
                🔗 View Original on BeyondChats
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
