import React, { useState, useEffect } from 'react';
import './App.css';
import TorchSwitch from './TorchSwitch';

function App() {
  const [links, setLinks] = useState(['']);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    setLinks(['']); // Limpia los inputs al recargar
  }, []);

  const cleanLink = (link) => {
    try {
      const url = new URL(link);
      return `${url.origin}${url.pathname}`;
    } catch {
      return ''; // Retorna vacío si no es un enlace válido
    }
  };

  const handleInputChange = (index, value) => {
    const newLinks = [...links];
    newLinks[index] = value;
    setLinks(newLinks);
  };

  const addLinkField = () => {
    setLinks([...links, '']);
  };

  const pasteFromClipboard = async (index) => {
    try {
      const text = await navigator.clipboard.readText();
      const newLinks = [...links];
      newLinks[index] = text;
      setLinks(newLinks);
    } catch (err) {
      console.error('Error reading clipboard:', err);
    }
  };

  const removeInputField = (index) => {
    const newLinks = links.filter((_, i) => i !== index);
    setLinks(newLinks);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const cleanedLinks = links.map(cleanLink).filter(Boolean);

      const response = await fetch('http://localhost:3001/scrape-videos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links: cleanedLinks }),
      });

      const data = await response.json();
      setResults(data.data);
    } catch (error) {
      console.error('Error fetching video data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (url, filename) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  const hasValidLinks = links.some((link) => cleanLink(link));

  return (
    <div className={`app ${darkMode ? 'dark-mode' : ''}`}>
      {loading && (
        <div className="spinner-overlay">
          <div className="spinner"></div>
        </div>
      )}
      <header className="header">
        <div className="title">TikTok Video Downloader</div>
        <TorchSwitch darkMode={darkMode} setDarkMode={setDarkMode} />
      </header>
      <main className="content">
        <div className="input-container">
          {links.map((link, index) => (
            <div key={index} className="input-wrapper">
              <input
                type="text"
                value={link}
                onChange={(e) => handleInputChange(index, e.target.value)}
                placeholder="Paste a TikTok video link"
                className={`input ${!cleanLink(link) ? 'input-error' : ''}`}
              />
              <button
                onClick={() => pasteFromClipboard(index)}
                className="paste-button"
                title="Paste from clipboard"
              >
                📋
              </button>
              <button
                onClick={() => removeInputField(index)}
                className="remove-button"
                title="Remove input"
              >
                ❌
              </button>
            </div>
          ))}
          <button onClick={addLinkField} className="add-button">+</button>
        </div>
        {hasValidLinks && (
          <button onClick={handleSubmit} className="downloader-button">
            Download Videos
          </button>
        )}
<div className="results">
  {results.map((result, index) => (
    <div key={index} className={`card-horizontal ${darkMode ? 'dark-mode' : ''}`}>
      {result.thumbnail && (
        <img
          src={result.thumbnail}
          alt="Thumbnail"
          className="thumbnail-horizontal"
        />
      )}
      <div className="card-info">
        <p
          className="video-title"
          title={result.title || 'Untitled'}
        >
          {result.title || 'Untitled'}
        </p>
        <a
          href={result.link}
          target="_blank"
          rel="noopener noreferrer"
          className="video-link"
        >
          {result.link}
        </a>
        {result.downloadLink && (
          <button
            className={`download-button ${darkMode ? 'dark-mode' : ''}`}
            onClick={() => handleDownload(result.downloadLink, `video-${index + 1}.mp4`)}
          >
            Download
          </button>
        )}
      </div>
    </div>
  ))}
</div>


      </main>
      <footer className="footer">
        <p>© 2024 TikTok Downloader</p>
        <div className="footer-icons">
          <a href="https://github.com/" target="_blank" rel="noopener noreferrer">GitHub</a>
          <a href="https://twitter.com/" target="_blank" rel="noopener noreferrer">Twitter</a>
          <a href="https://linkedin.com/" target="_blank" rel="noopener noreferrer">LinkedIn</a>
        </div>
      </footer>
    </div>
  );
}

export default App;
