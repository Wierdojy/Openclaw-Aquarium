import React, { useState } from 'react';
import './SereneReader.css';

const SereneReader = () => {
  const [fontSize, setFontSize] = useState(18);
  const [isReading, setIsReading] = useState(false);
  const [currentBook, setCurrentBook] = useState(null);
  const [language, setLanguage] = useState('zh-CN'); // Chinese default

  // Sample books with Chinese content
  const sampleBooks = [
    { 
      id: 1, 
      title: '宁静阅读', 
      titleEn: 'Serene Reading',
      author: 'Marie Kondo', 
      progress: 45,
      content: '宁静阅读，享受每一页的时光。在数字噪音的世界中寻找一片净土。',
      contentEn: 'Serene reading, enjoy every page. Find a pure land in the world of digital noise.'
    },
    { 
      id: 2, 
      title: '正念阅读法', 
      titleEn: 'Mindful Reading',
      author: 'Thich Nhat Hanh', 
      progress: 72,
      content: '阅读不仅是一种获取信息的方式，更是一种修行的过程。每一字、每一句都值得我们全心投入。',
      contentEn: 'Reading is not only a way to get information, but also a process of cultivation. Every word, every sentence deserves our full attention.'
    },
    { 
      id: 3, 
      title: '数字极简主义', 
      titleEn: 'Digital Minimalism',
      author: 'Cal Newport', 
      progress: 20,
      content: '在数字时代，极简不仅是一种设计理念，更是一种生活方式。让阅读回归纯粹。',
      contentEn: 'In the digital age, minimalism is not only a design philosophy, but also a lifestyle. Let reading return to its purity.'
    },
  ];

  const handleBookSelect = (book) => {
    setCurrentBook(book);
    setIsReading(true);
  };

  const handleBack = () => {
    setIsReading(false);
    setCurrentBook(null);
  };

  const adjustFontSize = (increment) => {
    setFontSize(prev => Math.max(14, Math.min(24, prev + increment)));
  };

  const toggleLanguage = () => {
    setLanguage(prev => prev === 'zh-CN' ? 'en-US' : 'zh-CN');
  };

  return (
    <div className="serene-reader">
      <header className="reader-header">
        <h1>宁静阅读</h1>
        <p className="tagline">Find peace in every page · 在每一页中寻找宁静</p>
        <button onClick={toggleLanguage} className="lang-toggle">
          {language === 'zh-CN' ? 'EN' : '中文'}
        </button>
      </header>

      {!isReading ? (
        <main className="book-library">
          <h2>{language === 'zh-CN' ? '你的图书馆' : 'Your Library'}</h2>
          <div className="book-grid">
            {sampleBooks.map(book => (
              <div 
                key={book.id} 
                className="book-card"
                onClick={() => handleBookSelect(book)}
              >
                <div className="book-cover">
                  <span className="book-icon">📖</span>
                </div>
                <h3>{language === 'zh-CN' ? book.title : book.titleEn}</h3>
                <p className="author">by {book.author}</p>
                <div className="progress-bar">
                  <div 
                    className="progress-fill" 
                    style={{ width: `${book.progress}%` }}
                  />
                </div>
                <span className="progress-text">{book.progress}% {language === 'zh-CN' ? '完成' : 'complete'}</span>
              </div>
            ))}
          </div>
        </main>
      ) : (
        <main className="reading-view">
          <div className="reading-controls">
            <button onClick={handleBack} className="back-button">
              ← {language === 'zh-CN' ? '返回图书馆' : 'Back to Library'}
            </button>
            <div className="font-controls">
              <button onClick={() => adjustFontSize(-2)} className="font-button">
                A-
              </button>
              <span className="font-size">{fontSize}px</span>
              <button onClick={() => adjustFontSize(2)} className="font-button">
                A+
              </button>
            </div>
          </div>
          
          <article className="book-content" style={{ fontSize: `${fontSize}px` }}>
            <h2>{language === 'zh-CN' ? currentBook?.title : currentBook?.titleEn}</h2>
            <p className="author">by {currentBook?.author}</p>
            
            <div className="chapter">
              <h3>{language === 'zh-CN' ? '第一章：开始旅程' : 'Chapter 1: Beginning the Journey'}</h3>
              <p>
                {language === 'zh-CN' 
                  ? currentBook?.content 
                  : currentBook?.contentEn}
              </p>
              <p>
                {language === 'zh-CN' 
                  ? '当我们在宁静中阅读时，文字不再是简单的符号，而是通向内心平静的桥梁。每一个字都承载着智慧，每一页都带来宁静。'
                  : 'When we read in serenity, words are no longer simple symbols, but bridges to inner peace. Each word carries wisdom, each page brings tranquility.'
                }
              </p>
              <p>
                {language === 'zh-CN' 
                  ? '在快节奏的现代生活中，给自己一个安静的角落，让阅读成为一次心灵的旅行。'
                  : 'In the fast-paced modern life, give yourself a quiet corner, let reading become a journey of the soul.'
                }
              </p>
            </div>
          </article>

          <div className="reading-progress">
            <div className="progress-path" style={{ width: '60%' }}>
              <div className="progress-dot" />
            </div>
            <span className="progress-text">60% {language === 'zh-CN' ? '已读' : 'read'}</span>
          </div>
        </main>
      )}

      <footer className="reader-footer">
        <p>© 2024 宁静阅读 · Read Mindfully · 用心阅读</p>
      </footer>
    </div>
  );
};

export default SereneReader;
