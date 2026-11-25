import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminModal({ onClose, user }) {
  const [usersList, setUsersList] = useState([]);
  const [dbStats, setDbStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const [uRes, sRes] = await Promise.all([
        axios.get('/api/admin/users'),
        axios.get('/api/admin/stats')
      ]);
      setUsersList(uRes.data || []);
      setDbStats(sRes.data || null);
    } catch (e) {
      console.error('Lỗi tải dữ liệu Admin:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, []);

  const handleToggleActive = async (targetUser) => {
    if (targetUser.username === 'admin') {
      alert('Không thể khóa tài khoản Quản trị viên gốc (admin)!');
      return;
    }
    try {
      await axios.put(`/api/admin/users/${targetUser.user_id}`, {
        role: targetUser.role,
        is_active: !targetUser.is_active
      });
      fetchAdminData();
    } catch (e) {
      alert('Lỗi cập nhật trạng thái tài khoản!');
    }
  };

  const handleChangeRole = async (targetUser, newRole) => {
    try {
      await axios.put(`/api/admin/users/${targetUser.user_id}`, {
        role: newRole,
        is_active: targetUser.is_active
      });
      fetchAdminData();
    } catch (e) {
      alert('Lỗi cập nhật vai trò!');
    }
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.78)',
        zIndex: 9999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '6px' : '16px',
        boxSizing: 'border-box',
        fontFamily: "'Times New Roman', Times, serif"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '880px',
          maxHeight: '94vh',
          backgroundColor: '#f8fafc',
          borderRadius: '12px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1.5px solid #1e293b'
        }}
      >
        {/* Header cố định đồng bộ */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: isMobile ? '11px 14px' : '14px 20px',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          gap: '10px',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '15.5px' : '18.5px',
              letterSpacing: '0.3px',
              lineHeight: 1.25
            }}>
              ⚙️ QUẢN TRỊ HỆ THỐNG & PHÂN QUYỀN
            </h2>
            <div style={{
              fontSize: isMobile ? '12px' : '13px',
              color: '#cbd5e1',
              marginTop: '3px'
            }}>
              Quản trị viên: <strong style={{ color: '#38bdf8' }}>{user?.full_name || 'Admin'}</strong> ({user?.username || 'admin'})
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              borderRadius: '7px',
              padding: isMobile ? '6px 11px' : '7px 14px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontSize: isMobile ? '12.5px' : '13.5px',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ✕ Đóng
          </button>
        </div>

        {/* Thân nội dung cuộn dọc */}
        <div style={{
          padding: isMobile ? '12px' : '18px 22px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          gap: '16px'
        }}>
          {/* Thống kê tổng quan CSDL PostgreSQL */}
          {dbStats && (
            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? '1fr' : 'repeat(3, 1fr)',
              gap: isMobile ? '8px' : '12px'
            }}>
              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bae6fd',
                borderLeft: '4px solid #0284c7',
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: isMobile ? 'space-between' : 'flex-start',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={{ fontSize: '12px', color: '#0369a1', fontWeight: 'bold' }}>QUAN TRẮC VỆ TINH</div>
                <div style={{ fontSize: isMobile ? '17px' : '21px', fontWeight: 'bold', color: '#0c4a6e', marginTop: isMobile ? 0 : '4px' }}>
                  {Number(dbStats.obs_count || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '12.5px', fontWeight: 'normal' }}>bản ghi</span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #bbf7d0',
                borderLeft: '4px solid #16a34a',
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: isMobile ? 'space-between' : 'flex-start',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'bold' }}>DỮ LIỆU AI DỰ BÁO</div>
                <div style={{ fontSize: isMobile ? '17px' : '21px', fontWeight: 'bold', color: '#14532d', marginTop: isMobile ? 0 : '4px' }}>
                  {Number(dbStats.forecast_count || 0).toLocaleString('vi-VN')} <span style={{ fontSize: '12.5px', fontWeight: 'normal' }}>bản ghi</span>
                </div>
              </div>

              <div style={{
                backgroundColor: '#ffffff',
                border: '1px solid #fde047',
                borderLeft: '4px solid #eab308',
                padding: isMobile ? '10px 12px' : '12px 16px',
                borderRadius: '8px',
                display: 'flex',
                justifyContent: isMobile ? 'space-between' : 'flex-start',
                flexDirection: isMobile ? 'row' : 'column',
                alignItems: isMobile ? 'center' : 'flex-start'
              }}>
                <div style={{ fontSize: '12px', color: '#a16207', fontWeight: 'bold' }}>KHU VỰC GIÁM SÁT</div>
                <div style={{ fontSize: isMobile ? '17px' : '21px', fontWeight: 'bold', color: '#713f12', marginTop: isMobile ? 0 : '4px' }}>
                  {dbStats.area_count || 168} <span style={{ fontSize: '12.5px', fontWeight: 'normal' }}>phường / xã</span>
                </div>
              </div>
            </div>
          )}

          {/* Danh sách tài khoản & phân quyền */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '10px',
            border: '1px solid #cbd5e1',
            padding: isMobile ? '12px' : '16px'
          }}>
            <div style={{
              fontSize: isMobile ? '14.5px' : '16px',
              fontWeight: 'bold',
              color: '#0f172a',
              marginBottom: '12px',
              paddingBottom: '8px',
              borderBottom: '1px solid #e2e8f0'
            }}>
              👥 Danh sách Tài khoản & Phân quyền ({usersList.length} tài khoản)
            </div>

            {loading ? (
              <p style={{ textAlign: 'center', color: '#64748b', margin: '16px 0' }}>Đang tải danh sách người dùng...</p>
            ) : isMobile ? (
              /* Giao diện Thẻ gọn gàng trên Điện thoại (không cần cuộn ngang) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {usersList.map((u) => (
                  <div
                    key={u.user_id}
                    style={{
                      border: '1px solid #cbd5e1',
                      borderRadius: '8px',
                      padding: '10px 12px',
                      backgroundColor: '#f8fafc',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '8px'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '8px' }}>
                      <div>
                        <div style={{ fontWeight: 'bold', fontSize: '14.5px', color: '#0f172a' }}>
                          {u.full_name}
                        </div>
                        <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 'bold' }}>
                          @{u.username} <span style={{ color: '#64748b', fontWeight: 'normal' }}>(ID: {u.user_id})</span>
                        </div>
                      </div>

                      <span style={{
                        padding: '3px 8px',
                        borderRadius: '12px',
                        fontSize: '11.5px',
                        fontWeight: 'bold',
                        whiteSpace: 'nowrap',
                        backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                        color: u.is_active ? '#166534' : '#991b1b'
                      }}>
                        {u.is_active ? 'Hoạt động' : 'Đã khóa'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <select
                        value={u.role}
                        disabled={u.username === 'admin'}
                        onChange={(e) => handleChangeRole(u, e.target.value)}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          borderRadius: '6px',
                          border: '1px solid #cbd5e1',
                          backgroundColor: '#ffffff',
                          fontSize: '13px',
                          fontWeight: 'bold',
                          color: '#0f172a',
                          fontFamily: "'Times New Roman', Times, serif"
                        }}
                      >
                        <option value="ADMIN">ADMIN (Quản trị viên)</option>
                        <option value="CHUYEN_GIA">CHUYEN_GIA (Chuyên gia GIS)</option>
                        <option value="NGUOI_DUNG">NGUOI_DUNG (Tra cứu)</option>
                      </select>

                      {u.username !== 'admin' && (
                        <button
                          onClick={() => handleToggleActive(u)}
                          style={{
                            backgroundColor: u.is_active ? '#f59e0b' : '#16a34a',
                            color: '#ffffff',
                            border: 'none',
                            borderRadius: '6px',
                            padding: '6px 10px',
                            fontSize: '12.5px',
                            fontWeight: 'bold',
                            cursor: 'pointer',
                            whiteSpace: 'nowrap',
                            fontFamily: "'Times New Roman', Times, serif"
                          }}
                        >
                          {u.is_active ? 'Khóa' : 'Mở khóa'}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              /* Giao diện Bảng chuẩn trên Máy tính */
              <div style={{ width: '100%', overflowX: 'auto', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '14px' }}>
                  <thead>
                    <tr style={{ backgroundColor: '#0f172a', color: '#ffffff', textAlign: 'left' }}>
                      <th style={{ padding: '10px 12px', width: '50px' }}>ID</th>
                      <th style={{ padding: '10px 12px' }}>Tên đăng nhập</th>
                      <th style={{ padding: '10px 12px' }}>Họ và tên</th>
                      <th style={{ padding: '10px 12px' }}>Vai trò (Role)</th>
                      <th style={{ padding: '10px 12px' }}>Trạng thái</th>
                      <th style={{ padding: '10px 12px', textAlign: 'center' }}>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {usersList.map((u, idx) => (
                      <tr key={u.user_id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: idx % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold' }}>{u.user_id}</td>
                        <td style={{ padding: '10px 12px', fontWeight: 'bold', color: '#0284c7' }}>{u.username}</td>
                        <td style={{ padding: '10px 12px' }}>{u.full_name}</td>
                        <td style={{ padding: '10px 12px' }}>
                          <select
                            value={u.role}
                            disabled={u.username === 'admin'}
                            onChange={(e) => handleChangeRole(u, e.target.value)}
                            style={{
                              padding: '5px 8px',
                              borderRadius: '6px',
                              border: '1px solid #cbd5e1',
                              fontWeight: 'bold',
                              fontFamily: "'Times New Roman', Times, serif"
                            }}
                          >
                            <option value="ADMIN">ADMIN (Quản trị viên)</option>
                            <option value="CHUYEN_GIA">CHUYEN_GIA (Chuyên gia GIS)</option>
                            <option value="NGUOI_DUNG">NGUOI_DUNG (Tra cứu)</option>
                          </select>
                        </td>
                        <td style={{ padding: '10px 12px' }}>
                          <span style={{
                            padding: '3px 9px',
                            borderRadius: '12px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            backgroundColor: u.is_active ? '#dcfce7' : '#fee2e2',
                            color: u.is_active ? '#166534' : '#991b1b'
                          }}>
                            {u.is_active ? 'Đang hoạt động' : 'Đã khóa'}
                          </span>
                        </td>
                        <td style={{ padding: '10px 12px', textAlign: 'center' }}>
                          {u.username !== 'admin' && (
                            <button
                              onClick={() => handleToggleActive(u)}
                              style={{
                                backgroundColor: u.is_active ? '#f59e0b' : '#16a34a',
                                color: '#ffffff',
                                border: 'none',
                                borderRadius: '6px',
                                padding: '5px 11px',
                                fontSize: '12.5px',
                                fontWeight: 'bold',
                                cursor: 'pointer',
                                fontFamily: "'Times New Roman', Times, serif"
                              }}
                            >
                              {u.is_active ? 'Khóa tài khoản' : 'Mở khóa'}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}