'use client';

import { useState, useEffect, useRef } from 'react';

export default function Home() {
  // State Management
  const [apiKey, setApiKey] = useState('');
  const [logs, setLogs] = useState([]);
  const [identities, setIdentities] = useState(['onboarding@resend.dev']);
  const [currentView, setCurrentView] = useState('dashboard');
  const [contentType, setContentType] = useState('html'); 
  const [engineStatus, setEngineStatus] = useState('OFFLINE');
  const [to, setTo] = useState('');
  const [subject, setSubject] = useState('');
  const [content, setContent] = useState('');
  const [from, setFrom] = useState('onboarding@resend.dev');
  const [isSending, setIsSending] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [selectedLog, setSelectedLog] = useState(null);
  const [isAddingIdentity, setIsAddingIdentity] = useState(false);
  const [newIdentity, setNewIdentity] = useState('');

  const previewRef = useRef(null);

  // Initialization
  useEffect(() => {
    const savedKey = localStorage.getItem('resend_api_key') || '';
    const savedLogs = JSON.parse(localStorage.getItem('dispatch_logs') || '[]');
    const savedIdentities = JSON.parse(localStorage.getItem('verified_identities') || '["onboarding@resend.dev"]');

    setApiKey(savedKey);
    setLogs(savedLogs);
    setIdentities(savedIdentities);

    checkEngineStatus();
    const interval = setInterval(checkEngineStatus, 5000);
    return () => clearInterval(interval);
  }, []);

  // Sync localStorage
  useEffect(() => {
    localStorage.setItem('dispatch_logs', JSON.stringify(logs));
  }, [logs]);

  useEffect(() => {
    localStorage.setItem('verified_identities', JSON.stringify(identities));
  }, [identities]);

  // Update Preview
  useEffect(() => {
    if (previewRef.current) {
      const doc = previewRef.current.contentDocument || previewRef.current.contentWindow.document;
      doc.open();
      if (contentType === 'text') {
        const escaped = content.replace(/[&<>"']/g, (m) => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
        }[m]));
        doc.write(`
          <html>
            <head>
              <style>
                body { font-family: 'Inter', sans-serif; padding: 40px; background: #f8fafc; color: #1e293b; line-height: 1.6; }
                pre { background: white; border: 2px solid #000; padding: 20px; box-shadow: 4px 4px 0px 0px #000; white-space: pre-wrap; word-break: break-all; }
              </style>
            </head>
            <body>
              <pre>${escaped || 'Type something...'}</pre>
            </body>
          </html>
        `);
      } else {
        doc.write(content || `
          <div style="font-family: 'Space Grotesk', sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; background: #f8fafc; color: #64748b; border: 2px dashed #cbd5e1; margin: 20px;">
            <p>Start typing HTML to see live rendering...</p>
          </div>
        `);
      }
      doc.close();
    }
  }, [content, contentType]);

  const checkEngineStatus = async () => {
    try {
      const res = await fetch(`/api/status?t=${Date.now()}`);
      if (res.ok) setEngineStatus('ONLINE');
      else setEngineStatus('OFFLINE');
    } catch {
      setEngineStatus('OFFLINE');
    }
  };

  const showToast = (message, type = 'success') => {
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!apiKey) {
      showToast('API Key Required', 'error');
      setCurrentView('settings');
      return;
    }

    setIsSending(true);
    const payload = { from, to, subject, [contentType]: content };

    try {
      const response = await fetch('/api/send', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = await response.json();
      const logEntry = {
        timestamp: new Date().toISOString(),
        recipient: payload.to,
        subject: payload.subject,
        status: response.ok ? 'SUCCESS' : 'ERROR',
        code: response.status,
        response: JSON.stringify(result),
      };

      setLogs((prev) => [logEntry, ...prev]);

      if (response.ok) {
        showToast('Transmission Successful', 'success');
        setTo('');
        setSubject('');
        setContent('');
        setCurrentView('dashboard');
      } else {
        showToast(result.message || 'Transmission Failed', 'error');
      }
    } catch (error) {
      const logEntry = {
        timestamp: new Date().toISOString(),
        recipient: payload.to,
        subject: payload.subject,
        status: 'OFFLINE',
        code: 'FAIL',
        response: error.message,
      };
      setLogs((prev) => [logEntry, ...prev]);
      showToast('System Link Failure', 'error');
    } finally {
      setIsSending(false);
    }
  };

  const stats = {
    total: logs.length,
    success: logs.filter((l) => l.status === 'SUCCESS').length,
    rate: logs.length > 0 ? Math.round((logs.filter((l) => l.status === 'SUCCESS').length / logs.length) * 100) : 0,
  };

  const SidebarItem = ({ id, icon, label }) => (
    <button 
      className={`nav-item ${currentView === id ? 'active' : ''}`} 
      onClick={() => setCurrentView(id)}
    >
      <span className="material-symbols-outlined">{icon}</span>
      <span>{label}</span>
    </button>
  );

  return (
    <div className="app-container">
      {/* Sidebar Navigation */}
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-logo">M</div>
          <h1 className="font-headline" style={{ fontSize: '1.5rem' }}>MailDispatch</h1>
          <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.25rem' }}>CORE ENGINE V1.2</p>
        </div>
        
        <nav className="nav-list">
          <SidebarItem id="dashboard" icon="grid_view" label="Dashboard" />
          <SidebarItem id="compose" icon="send" label="Composer" />
          <SidebarItem id="logs" icon="database" label="Dispatch Logs" />
          <SidebarItem id="settings" icon="settings" label="System Keys" />
        </nav>

        <div style={{ marginTop: 'auto' }}>
          <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => setCurrentView('compose')}>
            NEW DISPATCH
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="main-content">
        <header className="header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <h2 className="font-headline" style={{ fontSize: '1.25rem', textTransform: 'uppercase' }}>
              {currentView === 'dashboard' ? 'Overview' : currentView}
            </h2>
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
            <div className={`status-badge ${apiKey ? 'status-success' : ''}`}>
              <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>{apiKey ? 'check_circle' : 'key_off'}</span>
              API: {apiKey ? 'READY' : 'MISSING'}
            </div>
            <div className={`status-badge ${engineStatus === 'ONLINE' ? 'status-success' : ''}`}>
              <span className={`material-symbols-outlined ${engineStatus === 'ONLINE' ? '' : 'rotating'}`} style={{ fontSize: '1rem' }}>
                {engineStatus === 'ONLINE' ? 'bolt' : 'sync'}
              </span>
              CORE: {engineStatus}
            </div>
            <div style={{ width: 44, height: 44, border: 'var(--border-thin)', background: 'var(--accent)', boxShadow: '2px 2px 0px 0px var(--primary)', overflow: 'hidden' }}>
              <img src="https://api.dicebear.com/7.x/bottts/svg?seed=MailDispatch" alt="Avatar" />
            </div>
          </div>
        </header>

        <div className="view-container">
          {/* View: Dashboard */}
          {currentView === 'dashboard' && (
            <div className="fade-in">
              <div className="grid grid-cols-3">
                <div className="card card-accent">
                  <label style={{ color: 'var(--primary)', opacity: 0.7 }}>Total Transmissions</label>
                  <h3 style={{ fontSize: '4rem', marginTop: '1rem' }}>{stats.total}</h3>
                </div>
                <div className="card">
                  <label>Reliability Rate</label>
                  <h3 style={{ fontSize: '4rem', marginTop: '1rem', color: stats.rate > 90 ? 'var(--success)' : 'inherit' }}>
                    {stats.rate}%
                  </h3>
                </div>
                <div className="card">
                  <label>System Health</label>
                  <div style={{ marginTop: '2rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                      <span className="mono" style={{ fontSize: '0.7rem' }}>ENGINE STABILITY</span>
                      <span className="mono" style={{ fontSize: '0.7rem' }}>99.9%</span>
                    </div>
                    <div style={{ height: 8, background: 'var(--surface-muted)', border: '1px solid var(--primary)' }}>
                      <div style={{ width: '99.9%', height: '100%', background: 'var(--accent)' }}></div>
                    </div>
                  </div>
                </div>
              </div>

              <div style={{ marginTop: '4rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '2rem' }}>
                  <div>
                    <h3 className="font-headline" style={{ fontSize: '1.75rem' }}>RECENT DISPATCHES</h3>
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>Real-time transmission monitoring</p>
                  </div>
                  <button className="btn btn-secondary" style={{ padding: '0.5rem 1.5rem', fontSize: '0.7rem' }} onClick={() => setCurrentView('logs')}>
                    ARCHIVE
                  </button>
                </div>
                
                <div className="table-wrapper">
                  <table>
                    <thead>
                      <tr>
                        <th>TIMESTAMP</th>
                        <th>RECIPIENT</th>
                        <th>SUBJECT</th>
                        <th>STATUS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.slice(0, 5).map((log, i) => (
                        <tr key={i} className="clickable-row" onClick={() => setSelectedLog(log)}>
                          <td className="mono" style={{ color: 'var(--text-muted)' }}>{new Date(log.timestamp).toLocaleTimeString()}</td>
                          <td style={{ fontWeight: 700 }}>{log.recipient}</td>
                          <td>{log.subject}</td>
                          <td>
                            <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`} style={{ fontSize: '0.6rem' }}>
                              {log.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {logs.length === 0 && (
                        <tr>
                          <td colSpan="4" style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
                            <span className="material-symbols-outlined" style={{ fontSize: '3rem', marginBottom: '1rem', display: 'block', opacity: 0.2 }}>inbox</span>
                            NO TRANSMISSION HISTORY DETECTED
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* View: Compose */}
          {currentView === 'compose' && (
            <div className="grid grid-cols-2 fade-in" style={{ alignItems: 'start' }}>
              <div className="card">
                <h3 className="font-headline" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>NEW TRANSMISSION</h3>
                <form onSubmit={handleSend}>
                  <div className="form-group">
                    <label>Identity Origin</label>
                    {isAddingIdentity ? (
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <input type="email" value={newIdentity} onChange={(e) => setNewIdentity(e.target.value)} placeholder="new@domain.com" />
                        <button type="button" className="btn btn-primary" style={{ padding: '0 1.5rem' }} onClick={() => {
                          if (newIdentity) {
                            setIdentities([...identities, newIdentity]);
                            setFrom(newIdentity);
                            setNewIdentity('');
                            setIsAddingIdentity(false);
                            showToast('Identity Linked', 'success');
                          }
                        }}>SAVE</button>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 1.5rem' }} onClick={() => setIsAddingIdentity(false)}>X</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', gap: '1rem' }}>
                        <select value={from} onChange={(e) => setFrom(e.target.value)} style={{ flex: 1 }}>
                          {identities.map(id => <option key={id} value={id}>{id}</option>)}
                        </select>
                        <button type="button" className="btn btn-secondary" style={{ padding: '0 1.5rem' }} onClick={() => setIsAddingIdentity(true)}>+</button>
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2" style={{ gap: '1.5rem' }}>
                    <div className="form-group">
                      <label>Recipient Node</label>
                      <input type="email" value={to} onChange={(e) => setTo(e.target.value)} placeholder="target@domain.com" required />
                    </div>
                    <div className="form-group">
                      <label>Subject Vector</label>
                      <input type="text" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="System Update" required />
                    </div>
                  </div>

                  <div className="form-group">
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <label>Payload Content</label>
                      <div style={{ display: 'flex', gap: '4px', background: 'var(--primary)', padding: '3px' }}>
                        <button type="button" 
                          className="btn" 
                          style={{ fontSize: '0.6rem', padding: '4px 10px', boxShadow: 'none', border: 'none', background: contentType === 'html' ? 'var(--accent)' : 'transparent', color: contentType === 'html' ? 'var(--primary)' : 'white' }}
                          onClick={() => setContentType('html')}
                        >HTML</button>
                        <button type="button" 
                          className="btn" 
                          style={{ fontSize: '0.6rem', padding: '4px 10px', boxShadow: 'none', border: 'none', background: contentType === 'text' ? 'var(--accent)' : 'transparent', color: contentType === 'text' ? 'var(--primary)' : 'white' }}
                          onClick={() => setContentType('text')}
                        >TEXT</button>
                      </div>
                    </div>
                    <textarea value={content} onChange={(e) => setContent(e.target.value)} rows="12" placeholder="Input payload sequence..." required></textarea>
                  </div>

                  <button type="submit" className="btn btn-primary" disabled={isSending} style={{ width: '100%' }}>
                    {isSending ? (
                      <><span className="material-symbols-outlined rotating">sync</span> INITIATING...</>
                    ) : (
                      <><span className="material-symbols-outlined">bolt</span> EXECUTE DISPATCH</>
                    )}
                  </button>
                </form>
              </div>

              <div className="preview-window" style={{ height: '700px' }}>
                <div className="preview-bar">
                  <div className="dot-group">
                    <div className="dot" style={{ background: '#ff5f56' }}></div>
                    <div className="dot" style={{ background: '#ffbd2e' }}></div>
                    <div className="dot" style={{ background: '#27c93f' }}></div>
                  </div>
                  <span>TRANSMISSION PREVIEW</span>
                  <div style={{ marginLeft: 'auto' }} className="mono">200 OK</div>
                </div>
                <iframe ref={previewRef} style={{ flex: 1, border: 'none' }}></iframe>
              </div>
            </div>
          )}

          {/* View: Logs */}
          {currentView === 'logs' && (
            <div className="fade-in">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div>
                  <h3 className="font-headline" style={{ fontSize: '1.75rem' }}>LOG ARCHIVE</h3>
                  <p style={{ color: 'var(--text-muted)' }}>Historical transmission sequence data</p>
                </div>
                <button className="btn btn-secondary" onClick={() => {
                   if(confirm('PURGE ARCHIVE?')) setLogs([]);
                }}>
                  PURGE ARCHIVE
                </button>
              </div>

              <div className="table-wrapper">
                <table>
                  <thead>
                    <tr>
                      <th>TIMESTAMP</th>
                      <th>RECIPIENT</th>
                      <th>SUBJECT</th>
                      <th>STATUS</th>
                      <th>RESPONSE</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log, i) => (
                      <tr key={i} className="clickable-row" onClick={() => setSelectedLog(log)}>
                        <td className="mono">{new Date(log.timestamp).toLocaleString()}</td>
                        <td style={{ fontWeight: 700 }}>{log.recipient}</td>
                        <td>{log.subject}</td>
                        <td>
                          <span className={`status-badge ${log.status === 'SUCCESS' ? 'status-success' : 'status-error'}`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="mono" style={{ fontSize: '0.7rem', opacity: 0.6 }}>{log.response.slice(0, 50)}...</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* View: Settings */}
          {currentView === 'settings' && (
            <div className="card fade-in" style={{ maxWidth: '600px', margin: '0 auto' }}>
              <h3 className="font-headline" style={{ fontSize: '1.5rem', marginBottom: '2rem' }}>SYSTEM CONFIGURATION</h3>
              <div className="form-group">
                <label>RESEND API ACCESS KEY</label>
                <input 
                  type="password" 
                  value={apiKey} 
                  onChange={(e) => setApiKey(e.target.value)} 
                  placeholder="re_xxxxxxxxxxxx" 
                />
                <p className="mono" style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '1rem' }}>
                  STORAGE: LOCAL BROWSER VAULT. NEVER EXPOSED TO EXTERNAL NODES.
                </p>
              </div>
              <button className="btn btn-primary" style={{ width: '100%' }} onClick={() => {
                localStorage.setItem('resend_api_key', apiKey);
                showToast('Configuration Updated', 'success');
              }}>
                UPDATE SYSTEM KEYS
              </button>
            </div>
          )}
        </div>
      </main>

      {/* Toast System */}
      <div className="toast-container">
        {toasts.map(t => (
          <div key={t.id} className="toast">
            <span className="material-symbols-outlined" style={{ color: t.type === 'success' ? 'var(--success)' : 'var(--error)' }}>
              {t.type === 'success' ? 'check_circle' : 'warning'}
            </span>
            <span>{t.message}</span>
          </div>
        ))}
      </div>

      {/* Detail Modal */}
      {selectedLog && (
        <div className="modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="modal-card" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="font-headline">TRANSMISSION DATA</h3>
              <button onClick={() => setSelectedLog(null)} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }}>
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>
            <div className="modal-body">
               <div className="grid grid-cols-2" style={{ gap: '2rem', marginBottom: '2rem' }}>
                  <div>
                    <label>NODE RECIPIENT</label>
                    <div className="mono" style={{ fontWeight: 800 }}>{selectedLog.recipient}</div>
                  </div>
                  <div>
                    <label>TIMESTAMP</label>
                    <div className="mono">{new Date(selectedLog.timestamp).toLocaleString()}</div>
                  </div>
                  <div style={{ gridColumn: 'span 2' }}>
                    <label>VECTOR SUBJECT</label>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900 }}>{selectedLog.subject}</div>
                  </div>
               </div>
               <label>RAW RESPONSE DATA</label>
               <pre className="mono" style={{ background: 'var(--primary)', color: 'var(--accent)', padding: '1.5rem', marginTop: '0.5rem', fontSize: '0.75rem', overflow: 'auto', border: 'var(--border-thin)' }}>
                 {JSON.stringify(JSON.parse(selectedLog.response), null, 4)}
               </pre>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        .fade-in {
          animation: fadeIn 0.4s ease-out;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
