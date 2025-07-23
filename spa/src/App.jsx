import React, { useState, useEffect } from 'react';
import { Upload, Search, Plus, List, User, Settings, Puzzle } from 'lucide-react';

const API_BASE = import.meta.env.DEV ? '/api' : '';

function App() {
  const [activeTab, setActiveTab] = useState('puzzles');
  const [puzzles, setPuzzles] = useState([]);
  const [searchResults, setSearchResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('');

  // Form states
  const [searchQuery, setSearchQuery] = useState('');
  const [playerName, setPlayerName] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [uploadedImageUrl, setUploadedImageUrl] = useState('');
  const [newPuzzle, setNewPuzzle] = useState({
    name: '',
    description: '',
    tags: '',
    pieces: '',
    svg: ''
  });

  useEffect(() => {
    if (activeTab === 'puzzles') {
      fetchPuzzles();
    }
  }, [activeTab]);

  const showMessage = (msg, type = 'success') => {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(''), 5000);
  };

  const fetchPuzzles = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/puzzles`);
      const data = await response.json();
      setPuzzles(data);
    } catch (error) {
      showMessage('Failed to fetch puzzles', 'error');
    } finally {
      setLoading(false);
    }
  };

  const searchPuzzles = async () => {
    if (!searchQuery.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/search?q=${encodeURIComponent(searchQuery)}`);
      const data = await response.json();
      setSearchResults(data);
      showMessage(`Found ${data.length} puzzles`);
    } catch (error) {
      showMessage('Search failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const registerPlayer = async () => {
    if (!playerName.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: playerName })
      });
      
      if (response.ok) {
        showMessage('Player registered successfully!');
        setPlayerName('');
      } else {
        const error = await response.json();
        showMessage(error.error || 'Registration failed', 'error');
      }
    } catch (error) {
      showMessage('Registration failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const verifyAdmin = async () => {
    if (!adminPassword.trim()) return;
    
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/verify-admin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: adminPassword })
      });
      
      if (response.ok) {
        setIsAdminVerified(true);
        showMessage('Admin verified successfully!');
      } else {
        showMessage('Invalid admin credentials', 'error');
      }
    } catch (error) {
      showMessage('Admin verification failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const uploadImage = async (file) => {
    if (!file) return;
    
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      
      const response = await fetch(`${API_BASE}/upload-image`, {
        method: 'POST',
        body: formData
      });
      
      const data = await response.json();
      if (response.ok) {
        setUploadedImageUrl(data.url);
        setNewPuzzle(prev => ({ ...prev, svg: data.url }));
        showMessage('Image uploaded successfully!');
      } else {
        showMessage(data.error || 'Upload failed', 'error');
      }
    } catch (error) {
      showMessage('Upload failed', 'error');
    } finally {
      setLoading(false);
    }
  };

  const addPuzzle = async () => {
    if (!newPuzzle.name || !newPuzzle.pieces) {
      showMessage('Name and pieces are required', 'error');
      return;
    }
    
    if (!isAdminVerified) {
      showMessage('Admin verification required', 'error');
      return;
    }
    
    setLoading(true);
    try {
      const puzzleData = {
        puzzleId: `puzzle-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: newPuzzle.name,
        description: newPuzzle.description,
        tags: newPuzzle.tags.split(',').map(tag => tag.trim()).filter(Boolean),
        pieces: parseInt(newPuzzle.pieces),
        svg: newPuzzle.svg
      };
      
      const response = await fetch(`${API_BASE}/add-puzzle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(puzzleData)
      });
      
      if (response.ok) {
        showMessage('Puzzle added successfully!');
        setNewPuzzle({ name: '', description: '', tags: '', pieces: '', svg: '' });
        setUploadedImageUrl('');
        fetchPuzzles();
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to add puzzle', 'error');
      }
    } catch (error) {
      showMessage('Failed to add puzzle', 'error');
    } finally {
      setLoading(false);
    }
  };

  const simulateScore = async (puzzleId) => {
    if (!playerName.trim()) {
      showMessage('Please enter a player name first', 'error');
      return;
    }
    
    const randomTime = Math.floor(Math.random() * 300) + 30; // 30-330 seconds
    
    try {
      const response = await fetch(`${API_BASE}/score`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: playerName,
          puzzleId,
          timeSeconds: randomTime
        })
      });
      
      if (response.ok) {
        showMessage(`Score saved! Completion time: ${randomTime}s`);
      } else {
        const error = await response.json();
        showMessage(error.error || 'Failed to save score', 'error');
      }
    } catch (error) {
      showMessage('Failed to save score', 'error');
    }
  };

  const renderPuzzleGrid = (puzzleList) => (
    <div className="grid">
      {puzzleList.map(puzzle => (
        <div key={puzzle.id} className="puzzle-item">
          <h3>{puzzle.name}</h3>
          <p>{puzzle.description}</p>
          <div className="tags">
            {puzzle.tags.map(tag => (
              <span key={tag} className="tag">{tag}</span>
            ))}
          </div>
          <p><strong>Pieces:</strong> {puzzle.pieces}</p>
          {puzzle.svg && (
            <p><a href={puzzle.svg} target="_blank" rel="noopener noreferrer">View SVG</a></p>
          )}
          <div className="actions">
            <button 
              className="btn btn-small"
              onClick={() => simulateScore(puzzle.id)}
              disabled={!playerName.trim()}
            >
              Simulate Score
            </button>
          </div>
        </div>
      ))}
    </div>
  );

  return (
    <div className="container">
      <div className="header">
        <h1>🧩 Puzzle Game Admin Panel</h1>
        <p>Manage puzzles, test endpoints, and simulate gameplay</p>
      </div>

      {message && (
        <div className={`alert alert-${messageType}`}>
          {message}
        </div>
      )}

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'puzzles' ? 'active' : ''}`}
          onClick={() => setActiveTab('puzzles')}
        >
          <List size={18} />
          View Puzzles
        </button>
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          <Search size={18} />
          Search Puzzles
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          <Plus size={18} />
          Add Puzzle
        </button>
        <button 
          className={`tab ${activeTab === 'upload' ? 'active' : ''}`}
          onClick={() => setActiveTab('upload')}
        >
          <Upload size={18} />
          Upload Image
        </button>
        <button 
          className={`tab ${activeTab === 'test' ? 'active' : ''}`}
          onClick={() => setActiveTab('test')}
        >
          <User size={18} />
          Test Player
        </button>
        <button 
          className={`tab ${activeTab === 'admin' ? 'active' : ''}`}
          onClick={() => setActiveTab('admin')}
        >
          <Settings size={18} />
          Admin
        </button>
      </div>

      {activeTab === 'puzzles' && (
        <div className="card">
          <h2><Puzzle size={24} /> All Puzzles</h2>
          <button className="btn" onClick={fetchPuzzles} disabled={loading}>
            Refresh Puzzles
          </button>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            renderPuzzleGrid(puzzles)
          )}
        </div>
      )}

      {activeTab === 'search' && (
        <div className="card">
          <h2><Search size={24} /> Search Puzzles</h2>
          <div className="search-bar">
            <input
              type="text"
              placeholder="Search by name, description, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && searchPuzzles()}
            />
            <button className="btn" onClick={searchPuzzles} disabled={loading || !searchQuery.trim()}>
              Search
            </button>
          </div>
          {loading ? (
            <div className="loading"><div className="spinner"></div></div>
          ) : (
            renderPuzzleGrid(searchResults)
          )}
        </div>
      )}

      {activeTab === 'add' && (
        <div className="card">
          <h2><Plus size={24} /> Add New Puzzle</h2>
          {!isAdminVerified && (
            <div className="alert alert-error">
              Admin verification required to add puzzles
            </div>
          )}
          <div className="form-group">
            <label>Puzzle Name *</label>
            <input
              type="text"
              value={newPuzzle.name}
              onChange={(e) => setNewPuzzle(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Enter puzzle name"
            />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea
              value={newPuzzle.description}
              onChange={(e) => setNewPuzzle(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Enter puzzle description"
              rows={3}
            />
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input
              type="text"
              value={newPuzzle.tags}
              onChange={(e) => setNewPuzzle(prev => ({ ...prev, tags: e.target.value }))}
              placeholder="e.g. logic, easy, maze"
            />
          </div>
          <div className="form-group">
            <label>Number of Pieces *</label>
            <input
              type="number"
              value={newPuzzle.pieces}
              onChange={(e) => setNewPuzzle(prev => ({ ...prev, pieces: e.target.value }))}
              placeholder="16"
            />
          </div>
          <div className="form-group">
            <label>SVG URL</label>
            <input
              type="url"
              value={newPuzzle.svg}
              onChange={(e) => setNewPuzzle(prev => ({ ...prev, svg: e.target.value }))}
              placeholder="https://example.com/puzzle.svg"
            />
            {uploadedImageUrl && (
              <p style={{ marginTop: '0.5rem', color: '#28a745' }}>
                ✓ Using uploaded image: {uploadedImageUrl}
              </p>
            )}
          </div>
          <button 
            className="btn" 
            onClick={addPuzzle} 
            disabled={loading || !isAdminVerified}
          >
            Add Puzzle
          </button>
        </div>
      )}

      {activeTab === 'upload' && (
        <div className="card">
          <h2><Upload size={24} /> Upload SVG Image</h2>
          <div 
            className="file-upload"
            onDrop={(e) => {
              e.preventDefault();
              const file = e.dataTransfer.files[0];
              if (file && file.type === 'image/svg+xml') {
                uploadImage(file);
              } else {
                showMessage('Please upload an SVG file', 'error');
              }
            }}
            onDragOver={(e) => e.preventDefault()}
          >
            <input
              type="file"
              accept=".svg,image/svg+xml"
              onChange={(e) => {
                const file = e.target.files[0];
                if (file) uploadImage(file);
              }}
              style={{ display: 'none' }}
              id="file-input"
            />
            <label htmlFor="file-input" style={{ cursor: 'pointer' }}>
              <Upload size={48} style={{ margin: '0 auto 1rem', display: 'block' }} />
              <p>Click to upload or drag and drop SVG files here</p>
            </label>
          </div>
          {uploadedImageUrl && (
            <div style={{ marginTop: '1rem' }}>
              <h3>Uploaded Image:</h3>
              <p><a href={uploadedImageUrl} target="_blank" rel="noopener noreferrer">{uploadedImageUrl}</a></p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'test' && (
        <div className="card">
          <h2><User size={24} /> Test Player Registration & Scoring</h2>
          <div className="form-group">
            <label>Player Name</label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              placeholder="Enter player name"
            />
          </div>
          <div className="actions">
            <button 
              className="btn" 
              onClick={registerPlayer} 
              disabled={loading || !playerName.trim()}
            >
              Register Player
            </button>
            <button 
              className="btn btn-secondary" 
              onClick={() => {
                if (playerName.trim()) {
                  fetch(`${API_BASE}/scores/${playerName}`)
                    .then(r => r.json())
                    .then(scores => {
                      showMessage(`${playerName} has completed ${scores.length} puzzles`);
                    });
                }
              }}
              disabled={!playerName.trim()}
            >
              View Player Scores
            </button>
          </div>
          <p style={{ marginTop: '1rem', color: '#666' }}>
            After registering, you can click "Simulate Score" on any puzzle to test the scoring system.
          </p>
        </div>
      )}

      {activeTab === 'admin' && (
        <div className="card">
          <h2><Settings size={24} /> Admin Panel</h2>
          {!isAdminVerified ? (
            <div>
              <div className="form-group">
                <label>Admin Password</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Enter admin password"
                />
              </div>
              <button 
                className="btn" 
                onClick={verifyAdmin} 
                disabled={loading || !adminPassword.trim()}
              >
                Verify Admin
              </button>
            </div>
          ) : (
            <div>
              <div className="alert alert-success">
                ✓ Admin verified! You can now add new puzzles.
              </div>
              <button 
                className="btn btn-secondary" 
                onClick={() => {
                  setIsAdminVerified(false);
                  setAdminPassword('');
                }}
              >
                Logout Admin
              </button>
            </div>
          )}
        </div>
      )}

      {loading && (
        <div className="loading">
          <div className="spinner"></div>
        </div>
      )}
    </div>
  );
}

export default App;