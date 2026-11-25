import React, { useState, useEffect, useRef } from 'react';
import { METRIC_CONFIGS, ALERT_THRESHOLDS } from '../constants/mapConfigs';

export default function BulletinModal({ onClose, phuongData = [], selectedMetric, effectiveDateStr, enableAI, user }) {
  const cfg = METRIC_CONFIGS[selectedMetric] || METRIC_CONFIGS.NDVI;
  const alertCfg = ALERT_THRESHOLDS[selectedMetric] || ALERT_THRESHOLDS.NDVI;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const printStyleRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSS hỗ trợ in đúng trang bản tin khi bấm In Bản Tin (PDF)
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #bulletin-print-area, #bulletin-print-area * {
          visibility: visible !important;
        }
        #bulletin-print-area {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: auto !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          overflow: visible !important;
          z-index: 99999 !important;
        }
        .no-print-btn {
          display: none !important;
        }
      }
    `;
    document.head.appendChild(styleEl);
    printStyleRef.current = styleEl;
    return () => {
      if (printStyleRef.current) {
        document.head.removeChild(printStyleRef.current);
      }
    };
  }, []);

  const validItems = phuongData.filter(p => p.value !== null && p.value !== undefined && !isNaN(p.value));
  const values = validItems.map(p => Number(p.value));
  const avgVal = values.length > 0 ? (values.reduce((a, b) => a + b, 0) / values.length).toFixed(2) : 'N/A';
  const maxVal = values.length > 0 ? Math.max(...values).toFixed(2) : 'N/A';
  const minVal = values.length > 0 ? Math.min(...values).toFixed(2) : 'N/A';
  const dangerItems = validItems.filter(p => alertCfg.checkDanger(p.value));

  const handleExportCSV = () => {
    const header = ['STT,Khu Vuc,Quan Huyen,Chi So,Gia Tri,Trang Thai,Ngay Du Lieu,Nguon'];
    const rows = validItems.map((item, idx) => {
      const status = alertCfg.checkDanger(item.value) ? 'Canh bao cao' : 'Binh thuong';
      const src = enableAI ? 'AI Du bao' : 'Quan trac Ve tinh';
      return `${idx + 1},"${item.ten_phuong}","${item.ten_quan}",${selectedMetric},${Number(item.value).toFixed(3)},"${status}",${effectiveDateStr},"${src}"`;
    });
    const csvContent = '\uFEFF' + [header, ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `BanTin_GiamSat_${selectedMetric}_${effectiveDateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.75)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: isMobile ? '6px' : '16px',
        boxSizing: 'border-box',
        fontFamily: "'Times New Roman', Times, serif"
      }}
    >
      <div
        id="bulletin-print-area"
        onClick={(e) => e.stopPropagation()}
        style={{
          backgroundColor: '#ffffff',
          width: '100%',
          maxWidth: '960px',
          maxHeight: '94vh',
          borderRadius: '12px',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.45)',
          border: '1.5px solid #1e293b'
        }}
      >
        {/* Header: Tự động xếp 2 tầng gọn gàng trên Mobile */}
        <div style={{
          backgroundColor: '#0f172a',
          color: '#ffffff',
          padding: isMobile ? '10px 12px' : '14px 20px',
          display: 'flex',
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between',
          alignItems: isMobile ? 'stretch' : 'center',
          gap: isMobile ? '8px' : '12px',
          flexShrink: 0
        }}>
          <div>
            <h2 style={{
              margin: 0,
              fontSize: isMobile ? '15.5px' : '18.5px',
              letterSpacing: '0.3px',
              lineHeight: 1.25
            }}>
              BẢN TIN GIÁM SÁT MÔI TRƯỜNG ĐÔ THỊ TP.HCM
            </h2>
            <div style={{
              fontSize: isMobile ? '12px' : '13px',
              color: '#cbd5e1',
              marginTop: '3px',
              lineHeight: 1.35
            }}>
              Chỉ số: <strong style={{ color: '#38bdf8' }}>{cfg.name}</strong> | Ngày: <strong>{effectiveDateStr}</strong> | Nguồn: <strong>{enableAI ? 'AI Dự báo' : 'Vệ tinh MODIS'}</strong>
              {user?.full_name ? ` | Người lập: ${user.full_name}` : ''}
            </div>
          </div>

          <div
            className="no-print-btn"
            style={{
              display: 'flex',
              gap: '6px',
              flexShrink: 0
            }}
          >
            <button
              onClick={handleExportCSV}
              style={{
                flex: isMobile ? 1 : 'initial',
                backgroundColor: '#16a34a',
                color: '#ffffff',
                border: 'none',
                padding: isMobile ? '7px 8px' : '8px 13px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '13.5px',
                whiteSpace: 'nowrap',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              {isMobile ? '📊 Xuất CSV' : '📊 Xuất Báo Cáo (CSV)'}
            </button>

            <button
              onClick={() => window.print()}
              style={{
                flex: isMobile ? 1 : 'initial',
                backgroundColor: '#0284c7',
                color: '#ffffff',
                border: 'none',
                padding: isMobile ? '7px 8px' : '8px 13px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '13.5px',
                whiteSpace: 'nowrap',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              {isMobile ? '🖨️ In PDF' : '🖨️ In Bản Tin (PDF)'}
            </button>

            <button
              onClick={onClose}
              style={{
                backgroundColor: '#ef4444',
                color: '#ffffff',
                border: 'none',
                padding: isMobile ? '7px 11px' : '8px 13px',
                borderRadius: '6px',
                cursor: 'pointer',
                fontWeight: 'bold',
                fontSize: isMobile ? '12px' : '13.5px',
                whiteSpace: 'nowrap',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              ✕ Đóng
            </button>
          </div>
        </div>

        {/* Nội dung Bản tin */}
        <div style={{
          padding: isMobile ? '12px' : '18px 22px',
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          flex: 1
        }}>
          {/* 4 thẻ thống kê nhanh: 2x2 trên Mobile, 4x1 trên Desktop */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: isMobile ? 'repeat(2, 1fr)' : 'repeat(4, 1fr)',
            gap: isMobile ? '8px' : '12px',
            marginBottom: '14px'
          }}>
            <div style={{ padding: isMobile ? '10px' : '12px 14px', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #0284c7' }}>
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#475569', fontWeight: 'bold' }}>KHU VỰC CÓ DỮ LIỆU</div>
              <div style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>
                {validItems.length} / {phuongData.length}
              </div>
            </div>

            <div style={{ padding: isMobile ? '10px' : '12px 14px', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #16a34a' }}>
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#475569', fontWeight: 'bold' }}>TRUNG BÌNH VÙNG</div>
              <div style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>
                {avgVal}
              </div>
            </div>

            <div style={{ padding: isMobile ? '10px' : '12px 14px', borderRadius: '8px', backgroundColor: '#f1f5f9', borderLeft: '4px solid #f59e0b' }}>
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#475569', fontWeight: 'bold' }}>BIÊN ĐỘ (MIN – MAX)</div>
              <div style={{ fontSize: isMobile ? '16.5px' : '20px', fontWeight: 'bold', color: '#0f172a', marginTop: '3px' }}>
                {minVal} – {maxVal}
              </div>
            </div>

            <div style={{ padding: isMobile ? '10px' : '12px 14px', borderRadius: '8px', backgroundColor: '#fef2f2', borderLeft: '4px solid #dc2626' }}>
              <div style={{ fontSize: isMobile ? '11px' : '12px', color: '#991b1b', fontWeight: 'bold' }}>CẢNH BÁO CAO</div>
              <div style={{ fontSize: isMobile ? '18px' : '21px', fontWeight: 'bold', color: '#dc2626', marginTop: '3px' }}>
                {dangerItems.length} vùng
              </div>
            </div>
          </div>

          {/* Nhận định chuyên môn */}
          <div style={{
            backgroundColor: '#eff6ff',
            border: '1px solid #bfdbfe',
            borderRadius: '8px',
            padding: isMobile ? '10px 12px' : '12px 16px',
            marginBottom: '14px'
          }}>
            <div style={{ fontWeight: 'bold', color: '#1e3a8a', fontSize: isMobile ? '13.5px' : '14.5px', marginBottom: '4px' }}>
              NHẬN ĐỊNH & KHUYẾN NGHỊ CHUYÊN MÔN:
            </div>
            <div style={{ fontSize: isMobile ? '13px' : '14px', color: '#1e293b', lineHeight: 1.55 }}>
              • Ghi nhận <strong>{dangerItems.length}</strong> đơn vị hành chính vượt ngưỡng cảnh báo (<strong>{alertCfg.conditionText}</strong> – {alertCfg.title}).<br />
              • Giải pháp đề xuất: {alertCfg.advice}
            </div>
          </div>

          {/* Bảng số liệu chi tiết */}
          <div style={{ fontWeight: 'bold', fontSize: isMobile ? '13.5px' : '15px', marginBottom: '8px', color: '#0f172a' }}>
            BẢNG SỐ LIỆU CHI TIẾT ({validItems.length} ĐƠN VỊ HÀNH CHÍNH)
          </div>

          <div style={{ border: '1px solid #cbd5e1', borderRadius: '8px', overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: isMobile ? '12.5px' : '13.5px' }}>
              <thead>
                <tr style={{ backgroundColor: '#1e293b', color: '#ffffff', textAlign: 'left' }}>
                  <th style={{ padding: isMobile ? '8px 6px' : '10px 12px', width: '36px' }}>STT</th>
                  <th style={{ padding: isMobile ? '8px 6px' : '10px 12px' }}>Phường / Xã</th>
                  {!isMobile && <th style={{ padding: '10px 12px' }}>Quận / Huyện / TP</th>}
                  <th style={{ padding: isMobile ? '8px 6px' : '10px 12px', textAlign: 'right' }}>{selectedMetric}</th>
                  <th style={{ padding: isMobile ? '8px 6px' : '10px 12px', textAlign: 'center' }}>Mức độ</th>
                </tr>
              </thead>
              <tbody>
                {validItems.map((item, index) => {
                  const isDanger = alertCfg.checkDanger(item.value);
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: index % 2 === 0 ? '#ffffff' : '#f8fafc' }}>
                      <td style={{ padding: isMobile ? '7px 6px' : '8px 12px', color: '#475569' }}>{index + 1}</td>
                      <td style={{ padding: isMobile ? '7px 6px' : '8px 12px' }}>
                        <div style={{ fontWeight: 'bold', color: '#0f172a' }}>{item.ten_phuong}</div>
                        {isMobile && (
                          <div style={{ fontSize: '11px', color: '#64748b', marginTop: '1px' }}>{item.ten_quan}</div>
                        )}
                      </td>
                      {!isMobile && <td style={{ padding: '8px 12px', color: '#334155' }}>{item.ten_quan}</td>}
                      <td style={{
                        padding: isMobile ? '7px 6px' : '8px 12px',
                        fontWeight: 'bold',
                        textAlign: 'right',
                        color: isDanger ? '#dc2626' : '#0f172a'
                      }}>
                        {Number(item.value).toFixed(3)}
                      </td>
                      <td style={{ padding: isMobile ? '7px 6px' : '8px 12px', textAlign: 'center' }}>
                        <span style={{
                          display: 'inline-block',
                          padding: isMobile ? '2px 6px' : '3px 8px',
                          borderRadius: '4px',
                          fontSize: isMobile ? '11px' : '12px',
                          fontWeight: 'bold',
                          whiteSpace: 'nowrap',
                          backgroundColor: isDanger ? '#fee2e2' : '#dcfce7',
                          color: isDanger ? '#b91c1c' : '#15803d'
                        }}>
                          {isDanger ? 'Cảnh báo' : 'Bình thường'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}