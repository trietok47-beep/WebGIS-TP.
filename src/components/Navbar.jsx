import React, { useState, useEffect } from 'react';

const ROLE_BADGES = {
  ADMIN: { shortLabel: 'ADMIN', bg: '#dc2626', color: '#ffffff' },
  CHUYEN_GIA: { shortLabel: 'CHUYÊN GIA', bg: '#059669', color: '#ffffff' },
  NGUOI_DUNG: { shortLabel: 'TRA CỨU', bg: '#475569', color: '#ffffff' }
};

export default function Navbar({
  selectedMetric,
  setSelectedMetric,
  isBackendConnected,
  dbSource,
  user,
  setUser,
  setShowLoginModal,
  onOpenBulletin,
  onOpenTreeBenefit,
  onOpenMapLayout,
  onOpenAdminPanel
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const role = user?.role || 'GUEST';
  const canUseExpertTools = role === 'ADMIN' || role === 'CHUYEN_GIA';
  const isAdmin = role === 'ADMIN';
  const badge = ROLE_BADGES[role];

  // =========================================================================
  // GIAO DIỆN MOBILEGIS (<= 768px)
  // =========================================================================
  if (isMobile) {
    return (
      <div style={{
        width: '100%',
        backgroundColor: '#0f172a',
        color: '#ffffff',
        display: 'flex',
        flexDirection: 'column',
        padding: '8px 10px',
        borderBottom: '2px solid #1e293b',
        flexShrink: 0,
        zIndex: 2000,
        gap: '7px',
        boxSizing: 'border-box'
      }}>
        {/* Tầng 1: Tên hệ thống + Trạng thái DB + Đăng nhập / Tài khoản */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px' }}>
          <div
            title="Hệ thống giám sát nhiệt độ bề mặt – lớp phủ thực vật – mức độ khô hạn tại TP.HCM"
            style={{
              flex: 1,
              minWidth: 0,
              fontSize: '13.5px',
              fontWeight: 'bold',
              color: '#f8fafc',
              lineHeight: '1.22',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
            }}
          >
            Giám sát Nhiệt độ – Thực vật – Khô hạn TP.HCM
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', flexShrink: 0 }}>
            <div
              title={dbSource}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#1e293b',
                padding: '4px 6px',
                borderRadius: '6px',
                fontSize: '11px',
                border: '1px solid #334155'
              }}
            >
              <span style={{
                width: '7px',
                height: '7px',
                borderRadius: '50%',
                backgroundColor: isBackendConnected ? '#22c55e' : '#ef4444'
              }} />
              <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>DB</span>
            </div>

            {user ? (
              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                backgroundColor: '#1e293b',
                padding: '3px 6px',
                borderRadius: '6px',
                border: '1px solid #475569'
              }}>
                <span style={{ fontSize: '11.5px', fontWeight: 'bold', color: '#f8fafc' }}>
                  {user.username}
                </span>
                {badge && (
                  <span style={{
                    fontSize: '9.5px',
                    backgroundColor: badge.bg,
                    color: badge.color,
                    padding: '1px 4px',
                    borderRadius: '4px',
                    fontWeight: 'bold'
                  }}>
                    {badge.shortLabel}
                  </span>
                )}
                <button
                  onClick={() => setUser(null)}
                  style={{
                    backgroundColor: '#475569',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    padding: '2px 6px',
                    fontSize: '11px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    fontFamily: "'Times New Roman', Times, serif"
                  }}
                >
                  Thoát
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowLoginModal(true)}
                style={{
                  backgroundColor: '#2563eb',
                  color: '#ffffff',
                  border: 'none',
                  padding: '5px 10px',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  fontFamily: "'Times New Roman', Times, serif"
                }}
              >
                Đăng nhập
              </button>
            )}
          </div>
        </div>

        {/* Tầng 2: Chỉ số + Bản tin + Trồng cây + Công cụ phân quyền */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '3px',
            backgroundColor: '#1e293b',
            padding: '4px 6px',
            borderRadius: '6px',
            border: '1px solid #334155',
            flexShrink: 0
          }}>
            <span style={{ fontSize: '11.5px', color: '#cbd5e1', fontWeight: 'bold' }}>Chỉ số:</span>
            <select
              value={selectedMetric}
              onChange={(e) => setSelectedMetric(e.target.value)}
              style={{
                backgroundColor: 'transparent',
                color: '#ffffff',
                border: 'none',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                outline: 'none',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              <option value="NDVI" style={{ color: '#0f172a' }}>NDVI (Thực vật)</option>
              <option value="LST" style={{ color: '#0f172a' }}>LST (Nhiệt độ)</option>
              <option value="TVDI" style={{ color: '#0f172a' }}>TVDI (Khô hạn)</option>
            </select>
          </div>

          <button
            onClick={onOpenBulletin}
            style={{
              backgroundColor: '#059669',
              color: '#ffffff',
              border: 'none',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            Bản tin
          </button>

          <button
            onClick={onOpenTreeBenefit}
            style={{
              backgroundColor: '#15803d',
              color: '#ffffff',
              border: '1px solid #4ade80',
              padding: '5px 8px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              flexShrink: 0,
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            🌳 Trồng cây
          </button>

          {canUseExpertTools && (
            <button
              onClick={onOpenMapLayout}
              style={{
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              Xuất bản đồ
            </button>
          )}

          {isAdmin && (
            <button
              onClick={onOpenAdminPanel}
              style={{
                backgroundColor: '#dc2626',
                color: '#ffffff',
                border: '1px solid #fca5a5',
                padding: '5px 8px',
                borderRadius: '6px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                flexShrink: 0,
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              ⚙ Quản trị
            </button>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // GIAO DIỆN MÁY TÍNH (> 768px)
  // =========================================================================
  return (
    <div style={{
      height: '64px',
      width: '100%',
      backgroundColor: '#0f172a',
      color: '#ffffff',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '0 14px',
      borderBottom: '2px solid #1e293b',
      flexShrink: 0,
      zIndex: 2000,
      gap: '12px',
      boxSizing: 'border-box'
    }}>
      <div
        title="Hệ thống giám sát nhiệt độ bề mặt – lớp phủ thực vật – mức độ khô hạn tại TP.HCM"
        style={{
          flex: 1,
          minWidth: 0,
          fontSize: '18.5px',
          fontWeight: 'bold',
          letterSpacing: '0.2px',
          color: '#f8fafc',
          lineHeight: '1.22',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden'
        }}
      >
        Hệ thống giám sát nhiệt độ bề mặt – lớp phủ thực vật – mức độ khô hạn tại TP.HCM
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          backgroundColor: '#1e293b',
          padding: '5px 8px',
          borderRadius: '6px',
          border: '1px solid #334155',
          whiteSpace: 'nowrap'
        }}>
          <span style={{ fontSize: '12.5px', color: '#cbd5e1', fontWeight: 'bold' }}>Chỉ số:</span>
          <select
            value={selectedMetric}
            onChange={(e) => setSelectedMetric(e.target.value)}
            style={{
              backgroundColor: 'transparent',
              color: '#ffffff',
              border: 'none',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              outline: 'none',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            <option value="NDVI" style={{ color: '#0f172a' }}>NDVI (Thực vật)</option>
            <option value="LST" style={{ color: '#0f172a' }}>LST (Nhiệt độ)</option>
            <option value="TVDI" style={{ color: '#0f172a' }}>TVDI (Khô hạn)</option>
          </select>
        </div>

        <button
          onClick={onOpenBulletin}
          style={{
            backgroundColor: '#059669',
            color: '#ffffff',
            border: 'none',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          Bản tin
        </button>

        <button
          onClick={onOpenTreeBenefit}
          style={{
            backgroundColor: '#15803d',
            color: '#ffffff',
            border: '1px solid #4ade80',
            padding: '6px 10px',
            borderRadius: '6px',
            fontSize: '13px',
            fontWeight: 'bold',
            cursor: 'pointer',
            whiteSpace: 'nowrap',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          🌳 Trồng cây
        </button>

        {canUseExpertTools && (
          <button
            onClick={onOpenMapLayout}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            Xuất bản đồ
          </button>
        )}

        {isAdmin && (
          <button
            onClick={onOpenAdminPanel}
            style={{
              backgroundColor: '#dc2626',
              color: '#ffffff',
              border: '1px solid #fca5a5',
              padding: '6px 10px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ⚙ Quản trị
          </button>
        )}

        <div
          title={dbSource}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            backgroundColor: '#1e293b',
            padding: '6px 8px',
            borderRadius: '6px',
            fontSize: '12px',
            border: '1px solid #334155',
            whiteSpace: 'nowrap'
          }}
        >
          <span style={{
            width: '7px',
            height: '7px',
            borderRadius: '50%',
            backgroundColor: isBackendConnected ? '#22c55e' : '#ef4444'
          }} />
          <span style={{ color: '#e2e8f0', fontWeight: 'bold' }}>PostGIS</span>
        </div>

        {user ? (
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            backgroundColor: '#1e293b',
            padding: '4px 8px',
            borderRadius: '6px',
            border: '1px solid #475569',
            whiteSpace: 'nowrap'
          }}>
            <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#f8fafc' }}>
              {user.username}
            </span>
            {badge && (
              <span style={{
                fontSize: '10.5px',
                backgroundColor: badge.bg,
                color: badge.color,
                padding: '2px 5px',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}>
                {badge.shortLabel}
              </span>
            )}
            <button
              onClick={() => setUser(null)}
              style={{
                backgroundColor: '#475569',
                color: '#fff',
                border: 'none',
                borderRadius: '4px',
                padding: '3px 7px',
                fontSize: '11.5px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              Thoát
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowLoginModal(true)}
            style={{
              backgroundColor: '#2563eb',
              color: '#ffffff',
              border: 'none',
              padding: '6px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            Đăng nhập
          </button>
        )}
      </div>
    </div>
  );
}