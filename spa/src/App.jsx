import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Edit, Trash2, UploadCloud, X } from 'lucide-react';

const API_BASE = '/api';

function App() {
  const [puzzles, setPuzzles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPuzzle, setEditingPuzzle] = useState(null);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 4000);
  };

  const fetchPuzzles = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/puzzles`);
      if (!response.ok) throw new Error('Failed to fetch');
      const data = await response.json();
      setPuzzles(data);
    } catch (error) {
      showMessage('Failed to fetch puzzles.', 'error');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPuzzles();
  }, [fetchPuzzles]);

  const openModal = (puzzle = null) => {
    setEditingPuzzle(puzzle);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPuzzle(null);
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this puzzle?')) return;

    try {
      const response = await fetch(`${API_BASE}/puzzles/${id}`, { method: 'DELETE' });
      if (!response.ok) throw new Error('Failed to delete');
      showMessage('Puzzle deleted successfully!');
      fetchPuzzles();
    } catch (error) {
      showMessage('Failed to delete puzzle.', 'error');
    }
  };

  return (
    <div className="container">
      <header className="header">
        <h1>🧩 Simple Asset Manager</h1>
        <p>Manage your puzzle assets with ease</p>
      </header>

      {message.text && (
        <div className={`alert alert-${message.type}`}>{message.text}</div>
      )}

      <div className="toolbar">
        <button className="btn btn-primary" onClick={() => openModal()}>
          <Plus size={18} /> Add New Puzzle
        </button>
      </div>

      {loading && <div className="loading"><div className="spinner"></div></div>}

      <div className="puzzle-grid">
        {puzzles.map(puzzle => (
          <PuzzleCard key={puzzle.id} puzzle={puzzle} onEdit={openModal} onDelete={handleDelete} />
        ))}
      </div>

      {isModalOpen && (
        <PuzzleModal
          puzzle={editingPuzzle}
          onClose={closeModal}
          onSuccess={() => {
            fetchPuzzles();
            closeModal();
          }}
          showMessage={showMessage}
        />
      )}
    </div>
  );
}

const PuzzleCard = ({ puzzle, onEdit, onDelete }) => {
  const imageFiles = puzzle.img?.filter(file => /\.(jpe?g|png|gif|webp)$/i.test(file)) || [];

  return (
    <div className="puzzle-card">
      <div className="card-images">
        {imageFiles.length > 0 ? (
          imageFiles.map(img => (
            <img key={img} src={`https://puzzle-assets.agility-maint.net/${img}`} alt={puzzle.name} className="card-img-thumbnail" />
          ))
        ) : (
          <div className="card-img-placeholder">No Images</div>
        )}
      </div>
      <div className="card-content">
        <h3>{puzzle.name}</h3>
        <p className="desc">{puzzle.description}</p>
        <div className="details">
          <span><strong>Level:</strong> {puzzle.level}</span>
          <span><strong>Pieces:</strong> {puzzle.pieces}</span>
        </div>
        <div className="tags">
          {puzzle.tags.map(tag => <span key={tag} className="tag">{tag}</span>)}
        </div>
      </div>
      <div className="card-actions">
        <button className="btn-icon" onClick={() => onEdit(puzzle)}><Edit size={18} /></button>
        <button className="btn-icon btn-danger" onClick={() => onDelete(puzzle.id)}><Trash2 size={18} /></button>
      </div>
    </div>
  );
};

const PuzzleModal = ({ puzzle, onClose, onSuccess, showMessage }) => {
  const [formData, setFormData] = useState({
    name: puzzle?.name || '',
    desc: puzzle?.description || '',
    pieces: puzzle?.pieces || '',
    level: puzzle?.level || 'Easy',
    tags: puzzle?.tags?.join(', ') || '',
  });
  const [files, setFiles] = useState([]);
  const [existingFiles, setExistingFiles] = useState(puzzle?.img || []);
  const [isSaving, setIsSaving] = useState(false);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setFiles([...e.target.files]);
  };
  
  const removeExistingFile = (fileToRemove) => {
    setExistingFiles(existingFiles.filter(f => f !== fileToRemove));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    
    const data = new FormData();
    Object.keys(formData).forEach(key => data.append(key, formData[key]));
    
    files.forEach(file => data.append('files', file));
    data.append('existingFiles', JSON.stringify(existingFiles));

    const url = puzzle ? `${API_BASE}/puzzles/${puzzle.id}` : `${API_BASE}/puzzles`;
    const method = puzzle ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, { method, body: data });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.message || 'Save failed');
      }
      showMessage(`Puzzle ${puzzle ? 'updated' : 'added'} successfully!`);
      onSuccess();
    } catch (error) {
      showMessage(error.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="modal-backdrop">
      <div className="modal">
        <div className="modal-header">
          <h2>{puzzle ? 'Edit Puzzle' : 'Add New Puzzle'}</h2>
          <button onClick={onClose} className="btn-icon"><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} className="modal-body">
          <div className="form-group">
            <label>Name *</label>
            <input name="name" value={formData.name} onChange={handleInputChange} required disabled={isSaving} />
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="desc" value={formData.desc} onChange={handleInputChange} rows={3} disabled={isSaving}></textarea>
          </div>
          <div className="form-row">
            <div className="form-group">
              <label>Pieces *</label>
              <input name="pieces" type="number" value={formData.pieces} onChange={handleInputChange} required disabled={isSaving} />
            </div>
            <div className="form-group">
              <label>Level</label>
              <select name="level" value={formData.level} onChange={handleInputChange} disabled={isSaving}>
                <option>Easy</option>
                <option>Medium</option>
                <option>Hard</option>
              </select>
            </div>
          </div>
          <div className="form-group">
            <label>Tags (comma-separated)</label>
            <input name="tags" value={formData.tags} onChange={handleInputChange} disabled={isSaving} />
          </div>
          <div className="form-group">
            <label>Images & Files</label>
            <div className="file-input-wrapper">
              <UploadCloud size={18} />
              <span>{files.length > 0 ? `${files.length} file(s) selected` : 'Choose files...'}</span>
              <input type="file" multiple onChange={handleFileChange} disabled={isSaving} />
            </div>
          </div>
          
          {existingFiles.length > 0 && (
            <div className="form-group">
              <label>Current Files</label>
              <div className="file-list">
                {existingFiles.map(file => (
                  <div key={file} className="file-item">
                    <span>{file.split('/').pop()}</span>
                    <button type="button" onClick={() => removeExistingFile(file)} disabled={isSaving}><X size={14} /></button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={isSaving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={isSaving}>
              {isSaving ? (
                <>
                  <span className="spinner-sm"></span>
                  <span>Saving...</span>
                </>
              ) : (
                'Save Puzzle'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default App;
