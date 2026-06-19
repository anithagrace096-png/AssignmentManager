import { useState, useEffect } from 'react';
import './App.css';

const API_BASE_URL = 'http://localhost:7000/api/assignments';


// Predefined subjects for suggestions
const DEFAULT_SUBJECTS = [
  'Database Systems',
  'Operating Systems',
  'Compiler Design',
  'Computer Networks',
  'Software Engineering',
  'Artificial Intelligence'
];

const MOCK_ASSIGNMENTS = [
  {
    _id: 'mock-1',
    title: 'Database Normalization Practice',
    subject: 'Database Systems',
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    studentName: 'Sarah Jenkins',
    notes: 'Solve exercises on 1NF, 2NF, and 3NF decomposition.'
  },
  {
    _id: 'mock-2',
    title: 'Process Scheduling Lab 3',
    subject: 'Operating Systems',
    dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Late',
    studentName: 'Alex Mercer',
    notes: 'Implement Round Robin and Shortest Job First algorithms in C.'
  },
  {
    _id: 'mock-3',
    title: 'Lexical Analyzer Implementation',
    subject: 'Compiler Design',
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Submitted',
    studentName: 'Elena Rostova',
    notes: 'Lexer using Flex tool. Checked and approved by TA.'
  },
  {
    _id: 'mock-4',
    title: 'Socket Programming Client-Server',
    subject: 'Computer Networks',
    dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    status: 'Pending',
    studentName: 'David Kim',
    notes: 'Create simple TCP chat room application.'
  }
];

function App() {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  
  // Filtering & View state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  // Modal / Form state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    dueDate: '',
    status: 'Pending',
    studentName: '',
    notes: ''
  });

  // Load theme and assignments on start
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  useEffect(() => {
    fetchAssignments();
  }, []);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const response = await fetch(API_BASE_URL);
      if (!response.ok) {
        throw new Error('API server returned error code');
      }
      const data = await response.json();
      setAssignments(data);
      setIsDemoMode(false);
    } catch (err) {
      console.warn('Backend API connection failed, using offline demo mode:', err);
      // Fallback to local storage or mock assignments
      const stored = localStorage.getItem('local_assignments');
      if (stored) {
        setAssignments(JSON.parse(stored));
      } else {
        setAssignments(MOCK_ASSIGNMENTS);
        localStorage.setItem('local_assignments', JSON.stringify(MOCK_ASSIGNMENTS));
      }
      setIsDemoMode(true);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveLocalAssignments = (updatedList) => {
    setAssignments(updatedList);
    if (isDemoMode) {
      localStorage.setItem('local_assignments', JSON.stringify(updatedList));
    }
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  // Open modal for Create
  const handleOpenAddModal = () => {
    setEditingAssignment(null);
    setFormData({
      title: '',
      subject: DEFAULT_SUBJECTS[0],
      dueDate: new Date().toISOString().split('T')[0],
      status: 'Pending',
      studentName: '',
      notes: ''
    });
    setIsModalOpen(true);
  };

  // Open modal for Edit
  const handleOpenEditModal = (assignment) => {
    setEditingAssignment(assignment);
    setFormData({
      title: assignment.title,
      subject: assignment.subject,
      dueDate: new Date(assignment.dueDate).toISOString().split('T')[0],
      status: assignment.status,
      studentName: assignment.studentName,
      notes: assignment.notes || ''
    });
    setIsModalOpen(true);
  };

  // Handle Form Submission
  const handleSubmitForm = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.subject || !formData.dueDate || !formData.studentName) {
      alert('Please fill out all required fields.');
      return;
    }

    if (isDemoMode) {
      // Offline local mode
      if (editingAssignment) {
        const updated = assignments.map(a => 
          a._id === editingAssignment._id ? { ...a, ...formData } : a
        );
        handleSaveLocalAssignments(updated);
      } else {
        const newRecord = {
          _id: 'local-' + Date.now(),
          ...formData,
          createdAt: new Date().toISOString()
        };
        handleSaveLocalAssignments([...assignments, newRecord]);
      }
      setIsModalOpen(false);
    } else {
      // Connect to Real API
      try {
        const url = editingAssignment 
          ? `${API_BASE_URL}/${editingAssignment._id}` 
          : API_BASE_URL;
        const method = editingAssignment ? 'PUT' : 'POST';

        const res = await fetch(url, {
          method,
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });

        if (!res.ok) throw new Error('Failed to save assignment');
        
        await fetchAssignments();
        setIsModalOpen(false);
      } catch (err) {
        alert('Server error saving assignment. Switch to demo mode?');
        console.error(err);
      }
    }
  };

  // Quick Status Update
  const handleStatusChange = async (id, newStatus) => {
    if (isDemoMode) {
      const updated = assignments.map(a => 
        a._id === id ? { ...a, status: newStatus } : a
      );
      handleSaveLocalAssignments(updated);
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: newStatus })
        });
        if (!res.ok) throw new Error('Status update failed');
        await fetchAssignments();
      } catch (err) {
        console.error('Failed status update:', err);
      }
    }
  };

  // Delete Assignment
  const handleDeleteAssignment = async (id) => {
    if (!window.confirm('Are you sure you want to delete this submission record?')) {
      return;
    }

    if (isDemoMode) {
      const updated = assignments.filter(a => a._id !== id);
      handleSaveLocalAssignments(updated);
    } else {
      try {
        const res = await fetch(`${API_BASE_URL}/${id}`, {
          method: 'DELETE'
        });
        if (!res.ok) throw new Error('Delete failed');
        await fetchAssignments();
      } catch (err) {
        console.error('Failed deletion:', err);
      }
    }
  };

  // Check if an assignment is overdue (Pending status & date has passed)
  const getCalculatedStatus = (assignment) => {
    if (assignment.status === 'Pending') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const due = new Date(assignment.dueDate);
      due.setHours(0, 0, 0, 0);
      if (due < today) {
        return 'Late';
      }
    }
    return assignment.status;
  };

  // Dynamic Metrics Counts
  const totalCount = assignments.length;
  const submittedCount = assignments.filter(a => getCalculatedStatus(a) === 'Submitted').length;
  const pendingCount = assignments.filter(a => getCalculatedStatus(a) === 'Pending').length;
  const lateCount = assignments.filter(a => getCalculatedStatus(a) === 'Late').length;

  // Extract unique subjects list
  const uniqueSubjects = ['All', ...new Set(assignments.map(a => a.subject))];

  // Perform filtering & search
  const filteredAssignments = assignments.filter(a => {
    const calculatedStatus = getCalculatedStatus(a);
    
    // Search filter
    const matchesSearch = 
      a.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (a.notes && a.notes.toLowerCase().includes(searchQuery.toLowerCase()));

    // Subject filter
    const matchesSubject = selectedSubject === 'All' || a.subject === selectedSubject;

    // Status filter
    const matchesStatus = selectedStatus === 'All' || calculatedStatus === selectedStatus;

    return matchesSearch && matchesSubject && matchesStatus;
  });

  const formatDate = (dateStr) => {
    const options = { year: 'numeric', month: 'short', day: 'numeric' };
    return new Date(dateStr).toLocaleDateString('en-US', options);
  };

  return (
    <div className="app-container">
      {/* Upper Brand & Theme Bar */}
      <header className="app-header">
        <div className="brand-section">
          <div className="brand-icon">A</div>
          <div>
            <h1 className="brand-title">Assignment Tracker</h1>
            <span style={{ 
              fontSize: '0.75rem', 
              color: isDemoMode ? 'var(--color-pending)' : 'var(--color-submitted)',
              fontWeight: 700,
              textTransform: 'uppercase',
              display: 'flex',
              alignItems: 'center',
              gap: '0.25rem'
            }}>
              <span style={{ 
                display: 'inline-block',
                width: '6px', 
                height: '6px', 
                borderRadius: '50%', 
                backgroundColor: isDemoMode ? 'var(--color-pending)' : 'var(--color-submitted)'
              }}></span>
              {isDemoMode ? 'Demo Mode (Offline)' : 'Connected to Server'}
            </span>
          </div>
        </div>
        
        <div className="header-actions">
          <button 
            className="theme-toggle-btn" 
            onClick={toggleTheme} 
            title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Theme"
          >
            <i className={`fa-solid ${theme === 'dark' ? 'fa-sun' : 'fa-moon'}`}></i>
          </button>
          
          <button className="btn-primary" onClick={handleOpenAddModal}>
            <i className="fa-solid fa-plus"></i> Add Assignment
          </button>
        </div>
      </header>

      {/* Analytics Panel */}
      <section className="dashboard-grid" aria-label="Dashboard Summary Metrics">
        <div className="stat-card" style={{ '--card-accent': 'var(--primary)' }}>
          <div className="stat-header">
            <span className="stat-title">Total Submissions</span>
            <div className="stat-icon" style={{ '--stat-icon-bg': 'var(--primary-glow)', '--stat-icon-color': 'var(--primary)' }}>
              <i className="fa-solid fa-folder-open"></i>
            </div>
          </div>
          <div className="stat-value">{totalCount}</div>
          <div className="stat-desc">Assignments on records</div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-submitted)' }}>
          <div className="stat-header">
            <span className="stat-title">Submitted</span>
            <div className="stat-icon" style={{ '--stat-icon-bg': 'rgba(16, 185, 129, 0.1)', '--stat-icon-color': 'var(--color-submitted)' }}>
              <i className="fa-solid fa-circle-check"></i>
            </div>
          </div>
          <div className="stat-value">{submittedCount}</div>
          <div className="stat-desc">
            <i className="fa-solid fa-arrow-up" style={{ color: 'var(--color-submitted)' }}></i>
            {totalCount ? Math.round((submittedCount / totalCount) * 100) : 0}% Completed
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-pending)' }}>
          <div className="stat-header">
            <span className="stat-title">Pending</span>
            <div className="stat-icon" style={{ '--stat-icon-bg': 'rgba(245, 158, 11, 0.1)', '--stat-icon-color': 'var(--color-pending)' }}>
              <i className="fa-solid fa-clock"></i>
            </div>
          </div>
          <div className="stat-value">{pendingCount}</div>
          <div className="stat-desc">
            <i className="fa-solid fa-hourglass-half"></i> Awaiting completion
          </div>
        </div>

        <div className="stat-card" style={{ '--card-accent': 'var(--color-late)' }}>
          <div className="stat-header">
            <span className="stat-title">Late / Overdue</span>
            <div className="stat-icon" style={{ '--stat-icon-bg': 'rgba(239, 68, 68, 0.1)', '--stat-icon-color': 'var(--color-late)' }}>
              <i className="fa-solid fa-triangle-exclamation"></i>
            </div>
          </div>
          <div className="stat-value">{lateCount}</div>
          <div className="stat-desc" style={{ color: lateCount > 0 ? 'var(--color-late)' : 'var(--text-muted)' }}>
            {lateCount > 0 ? 'Urgent attention required' : 'No overdue submissions'}
          </div>
        </div>
      </section>

      {/* Navigation and Filtering panel */}
      <section className="controls-panel" aria-label="Controls Panel">
        <div className="search-filter-group">
          {/* Search bar */}
          <div className="search-input-wrapper">
            <i className="fa-solid fa-magnifying-glass"></i>
            <input 
              type="text" 
              placeholder="Search Student, Title..." 
              className="search-input" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          {/* Subject Filter Dropdown */}
          <select 
            className="select-dropdown"
            value={selectedSubject}
            onChange={(e) => setSelectedSubject(e.target.value)}
          >
            <option value="All">All Subjects</option>
            {uniqueSubjects.filter(s => s !== 'All').map(sub => (
              <option key={sub} value={sub}>{sub}</option>
            ))}
          </select>

          {/* Status Tabs */}
          <div className="tabs-group" role="tablist">
            {['All', 'Submitted', 'Pending', 'Late'].map((status) => (
              <button 
                key={status}
                role="tab"
                aria-selected={selectedStatus === status}
                className={`tab-btn ${selectedStatus === status ? 'active' : ''}`}
                onClick={() => setSelectedStatus(status)}
              >
                {status}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Toggle Group */}
        <div className="view-toggle-group">
          <button 
            className={`view-btn ${viewMode === 'grid' ? 'active' : ''}`}
            onClick={() => setViewMode('grid')}
            title="Card Grid View"
          >
            <i className="fa-solid fa-grid-2"></i>
            <i className="fa-solid fa-grip"></i>
          </button>
          <button 
            className={`view-btn ${viewMode === 'table' ? 'active' : ''}`}
            onClick={() => setViewMode('table')}
            title="List Table View"
          >
            <i className="fa-solid fa-table-list"></i>
            <i className="fa-solid fa-list"></i>
          </button>
        </div>
      </section>

      {/* Main Content Area */}
      <main style={{ flexGrow: 1 }}>
        {loading ? (
          <div className="loader-container">
            <div className="spinner"></div>
            <p>Loading submission records...</p>
          </div>
        ) : filteredAssignments.length === 0 ? (
          <div className="empty-state">
            <div className="empty-icon">
              <i className="fa-regular fa-clipboard"></i>
            </div>
            <h3 className="empty-title">No Submissions Found</h3>
            <p className="empty-desc">
              Try adjusting your search criteria, subject dropdown, or status filters.
            </p>
            <button className="btn-primary" style={{ marginTop: '0.5rem' }} onClick={handleOpenAddModal}>
              Add New Record
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <div className="assignments-grid">
            {filteredAssignments.map((assignment) => {
              const calcStatus = getCalculatedStatus(assignment);
              const isOverdue = calcStatus === 'Late' && assignment.status === 'Pending';
              
              return (
                <article 
                  key={assignment._id} 
                  className={`assignment-card ${calcStatus.toLowerCase()}`}
                >
                  <div className="card-header">
                    <span className="subject-badge">{assignment.subject}</span>
                    <span className={`status-badge ${calcStatus.toLowerCase()}`}>
                      <span style={{ 
                        width: '6px', 
                        height: '6px', 
                        borderRadius: '50%', 
                        backgroundColor: 'currentColor' 
                      }}></span>
                      {isOverdue ? 'Overdue' : calcStatus}
                    </span>
                  </div>

                  <h3 className="card-title">{assignment.title}</h3>

                  <div className="card-student">
                    <i className="fa-solid fa-user-graduate"></i>
                    <span>{assignment.studentName}</span>
                  </div>

                  {assignment.notes && (
                    <p className="card-notes">{assignment.notes}</p>
                  )}

                  <div className={`card-due-date ${isOverdue ? 'is-late' : ''}`}>
                    <i className="fa-regular fa-calendar-days"></i>
                    <span>
                      Due: {formatDate(assignment.dueDate)} 
                      {isOverdue && ' (Overdue)'}
                    </span>
                  </div>

                  <div className="card-actions">
                    {/* Inline Quick Status Switcher */}
                    <select
                      className={`status-select-inline ${calcStatus.toLowerCase()}`}
                      value={assignment.status}
                      onChange={(e) => handleStatusChange(assignment._id, e.target.value)}
                      style={{ marginRight: 'auto' }}
                      title="Update status"
                    >
                      <option value="Pending">Pending</option>
                      <option value="Submitted">Submitted</option>
                      <option value="Late">Late</option>
                    </select>

                    <button 
                      className="btn-icon" 
                      onClick={() => handleOpenEditModal(assignment)}
                      title="Edit details"
                    >
                      <i className="fa-solid fa-pen-to-square"></i>
                    </button>
                    <button 
                      className="btn-icon delete" 
                      onClick={() => handleDeleteAssignment(assignment._id)}
                      title="Delete record"
                    >
                      <i className="fa-solid fa-trash-can"></i>
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="assignments-table">
              <thead>
                <tr>
                  <th>Student Name</th>
                  <th>Assignment Title</th>
                  <th>Subject</th>
                  <th>Due Date</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredAssignments.map((assignment) => {
                  const calcStatus = getCalculatedStatus(assignment);
                  const isOverdue = calcStatus === 'Late' && assignment.status === 'Pending';
                  
                  return (
                    <tr key={assignment._id}>
                      <td>
                        <span style={{ fontWeight: 600, color: 'var(--text-title)' }}>
                          {assignment.studentName}
                        </span>
                      </td>
                      <td className="title-col">{assignment.title}</td>
                      <td>
                        <span className="subject-badge">{assignment.subject}</span>
                      </td>
                      <td>
                        <span className={isOverdue ? 'card-due-date is-late' : ''} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <i className="fa-regular fa-calendar-days"></i>
                          {formatDate(assignment.dueDate)}
                        </span>
                      </td>
                      <td>
                        <select
                          className={`status-select-inline ${calcStatus.toLowerCase()}`}
                          value={assignment.status}
                          onChange={(e) => handleStatusChange(assignment._id, e.target.value)}
                          title="Update status"
                        >
                          <option value="Pending">Pending</option>
                          <option value="Submitted">Submitted</option>
                          <option value="Late">Late</option>
                        </select>
                      </td>
                      <td>
                        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
                          <button 
                            className="btn-icon" 
                            onClick={() => handleOpenEditModal(assignment)}
                            title="Edit details"
                          >
                            <i className="fa-solid fa-pen-to-square"></i>
                          </button>
                          <button 
                            className="btn-icon delete" 
                            onClick={() => handleDeleteAssignment(assignment._id)}
                            title="Delete record"
                          >
                            <i className="fa-solid fa-trash-can"></i>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </main>

      {/* Add / Edit Form Modal */}
      {isModalOpen && (
        <div className="modal-overlay" onClick={() => setIsModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">
                {editingAssignment ? 'Edit Record' : 'Add Assignment Submission'}
              </h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>
                <i className="fa-solid fa-xmark"></i>
              </button>
            </div>

            <form onSubmit={handleSubmitForm}>
              <div className="form-group">
                <label htmlFor="studentName">Student Name *</label>
                <input 
                  type="text" 
                  id="studentName"
                  className="form-control"
                  required
                  placeholder="e.g. John Doe"
                  value={formData.studentName}
                  onChange={(e) => setFormData({ ...formData, studentName: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="title">Assignment Title *</label>
                <input 
                  type="text" 
                  id="title"
                  className="form-control"
                  required
                  placeholder="e.g. Lab 4 Processes"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="subject">Subject *</label>
                <input 
                  type="text" 
                  id="subject"
                  className="form-control"
                  required
                  list="subjects-list"
                  placeholder="Select or enter subject"
                  value={formData.subject}
                  onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                />
                <datalist id="subjects-list">
                  {DEFAULT_SUBJECTS.map(s => <option key={s} value={s} />)}
                </datalist>
              </div>

              <div className="form-group">
                <label htmlFor="dueDate">Due Date *</label>
                <input 
                  type="date" 
                  id="dueDate"
                  className="form-control"
                  required
                  value={formData.dueDate}
                  onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                />
              </div>

              <div className="form-group">
                <label htmlFor="status">Submission Status</label>
                <select 
                  id="status"
                  className="form-control"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                >
                  <option value="Pending">Pending</option>
                  <option value="Submitted">Submitted</option>
                  <option value="Late">Late</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="notes">Notes / Instructions</label>
                <textarea 
                  id="notes"
                  className="form-control"
                  rows="3"
                  placeholder="Optional details, submission formats..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                ></textarea>
              </div>

              <div className="form-actions">
                <button 
                  type="button" 
                  className="btn-secondary"
                  onClick={() => setIsModalOpen(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  {editingAssignment ? 'Save Changes' : 'Submit Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
