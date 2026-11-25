import React, { useState } from 'react';
import axios from 'axios';

export default function LoginModal({ onClose, onLoginSuccess }) {
  const [usernameInput, setUsernameInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg('');

    if (!usernameInput.trim() || !passwordInput.trim()) {
      setErrorMsg('Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu.');
      return;
    }

    setIsLoading(true);
    try {
      const res = await axios.post('/api/login', {
        username: usernameInput.trim(),
        password: passwordInput.trim()
      });

      if (res.data?.status === 'success' && res.data?.user) {
        const u = res.data.user;
        onLoginSuccess({
          user_id: u.user_id,
          username: u.username,
          name: u.full_name,
          full_name: u.full_name,
          role: u.role
        });
        onClose();
      }
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        setErrorMsg(err.response.data?.detail || 'Sai tên đăng nhập hoặc mật khẩu.');
      } else {
        setErrorMsg('Không thể kết nối đến máy chủ xác thực (Backend FastAPI).');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', backgroundColor: 'rgba(15, 23, 42, 0.75)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', backdropFilter: 'blur(4px)', padding: '16px', boxSizing: 'border-box' }}>
      <div style={{ width: '410px', maxWidth: '100%', backgroundColor: '#ffffff', borderRadius: '16px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3)', padding: '24px', position: 'relative', border: '1px solid #e2e8f0', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
        <button 
          onClick={onClose}
          style={{ position: 'absolute', top: '16px', right: '16px', background: 'none', border: 'none', cursor: 'pointer', color: '#64748b', fontWeight: 'bold', fontSize: '18px' }}
        >
          ✕
        </button>

        <div style={{ textAlign: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '22px', fontWeight: 'bold', color: '#0f172a', margin: 0 }}>Đăng Nhập Hệ Thống</h2>
          <p style={{ fontSize: '14px', color: '#64748b', marginTop: '4px' }}>Xác thực phân quyền CSDL PostgreSQL</p>
        </div>

        {errorMsg && (
          <div style={{ backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#b91c1c', padding: '10px 12px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', fontWeight: 'bold' }}>
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Tên tài khoản:</label>
            <input 
              type="text" 
              required 
              placeholder="admin / chuyengia / khach" 
              value={usernameInput}
              onChange={e => setUsernameInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '15px', outline: 'none', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}
            />
          </div>

          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '15px', fontWeight: 'bold', color: '#334155', marginBottom: '6px' }}>Mật khẩu:</label>
            <input 
              type="password" 
              required 
              placeholder="••••••••" 
              value={passwordInput}
              onChange={e => setPasswordInput(e.target.value)}
              style={{ width: '100%', padding: '10px 12px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '15px', outline: 'none', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}
            />
          </div>

          <button 
            type="submit" 
            disabled={isLoading}
            style={{ width: '100%', backgroundColor: isLoading ? '#93c5fd' : '#2563eb', color: '#ffffff', border: 'none', padding: '12px', borderRadius: '8px', fontSize: '16px', fontWeight: 'bold', cursor: isLoading ? 'not-allowed' : 'pointer', fontFamily: "'Times New Roman', Times, serif", boxShadow: '0 4px 12px rgba(37,99,235,0.3)' }}
          >
            {isLoading ? 'Đang xác thực...' : 'Xác Nhận Đăng Nhập'}
          </button>
        </form>

        <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px dashed #e2e8f0', fontSize: '12.5px', color: '#64748b', textAlign: 'center' }}>
          Tài khoản mẫu trong CSDL: <strong>admin</strong> / <strong>chuyengia</strong> / <strong>khach</strong> (MK: <code>123456</code>)
        </div>
      </div>
    </div>
  );
}