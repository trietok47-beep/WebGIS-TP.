import React from 'react';
import { ALERT_THRESHOLDS } from '../constants/mapConfigs';
import { getColorByMetric } from '../utils/colorUtils';

export default function AlertOverlay({
  showAlert,
  onClose,
  selectedMetric,
  phuongData,
  getValueForFeature,
  handleSelectArea
}) {
  if (!showAlert) return null;

  const config = ALERT_THRESHOLDS[selectedMetric];

  // Lọc và sắp xếp các khu vực vượt ngưỡng nguy cơ cao
  const evaluatedList = phuongData.map((p) => {
    const val = Number(getValueForFeature(p.feature, p.featureIdx));
    return { ...p, currentVal: val };
  });

  const highRiskAreas = evaluatedList
    .filter((item) => config.checkDanger(item.currentVal))
    .sort((a, b) => (config.sortAsc ? a.currentVal - b.currentVal : b.currentVal - a.currentVal));

  const riskPercent = phuongData.length > 0 
    ? ((highRiskAreas.length / phuongData.length) * 100).toFixed(1) 
    : 0;

  return (
    <div style={{
      position: 'absolute',
      top: '14px',
      left: '54px', // Nằm gọn cạnh nút Zoom (+/-) của Leaflet
      width: '340px',
      maxHeight: 'calc(100% - 70px)',
      backgroundColor: 'rgba(255, 255, 255, 0.96)',
      backdropFilter: 'blur(6px)',
      borderRadius: '12px',
      boxShadow: '0 10px 25px rgba(220, 38, 38, 0.25)',
      border: '2px solid #ef4444',
      zIndex: 1100,
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      fontFamily: "'Times New Roman', Times, serif"
    }}>
      {/* Header Bảng Cảnh Báo */}
      <div style={{
        background: 'linear-gradient(90deg, #dc2626 0%, #991b1b 100%)',
        color: '#ffffff',
        padding: '10px 14px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '16px' }}>⚠️</span>
          <span style={{ fontWeight: 'bold', fontSize: '15px' }}>ĐÁNH GIÁ NGUY CƠ CAO ({selectedMetric})</span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'rgba(255,255,255,0.2)',
            border: 'none',
            color: '#fff',
            borderRadius: '4px',
            padding: '2px 7px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '13px'
          }}
        >
          ✕
        </button>
      </div>

      {/* Tổng quan đánh giá */}
      <div style={{ padding: '12px 14px', backgroundColor: '#fef2f2', borderBottom: '1px solid #fecaca' }}>
        <div style={{ fontWeight: 'bold', color: '#991b1b', fontSize: '14px', marginBottom: '4px' }}>
          Hiện trạng: {config.title}
        </div>
        <div style={{ fontSize: '13px', color: '#7f1d1d', display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
          <span>Ngưỡng báo động: <b>{config.conditionText}</b></span>
          <span>Số vùng: <b>{highRiskAreas.length}/{phuongData.length} ({riskPercent}%)</b></span>
        </div>
        <div style={{ fontSize: '12px', color: '#475569', backgroundColor: '#ffffff', padding: '6px 8px', borderRadius: '6px', border: '1px solid #fee2e2', fontStyle: 'italic' }}>
          💡 <b>Khuyến nghị:</b> {config.advice}
        </div>
      </div>

      {/* Danh sách khu vực nguy cơ cao */}
      <div style={{ padding: '8px 14px', fontSize: '13px', fontWeight: 'bold', color: '#334155', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
        Danh sách khu vực trọng điểm (Click để định vị):
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '4px 0' }}>
        {highRiskAreas.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#16a34a', fontWeight: 'bold', fontSize: '14px' }}>
            ✅ Hiện tại chưa có khu vực nào vượt ngưỡng nguy hiểm!
          </div>
        ) : (
          highRiskAreas.map((item, idx) => {
            const color = getColorByMetric(item.currentVal, selectedMetric);
            return (
              <div
                key={item.id}
                onClick={() => handleSelectArea(item)}
                style={{
                  padding: '8px 14px',
                  borderBottom: '1px solid #f1f5f9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  cursor: 'pointer',
                  transition: 'background 0.2s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
              >
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px', color: '#0f172a' }}>
                    {idx + 1}. {item.ten_phuong}
                  </div>
                  <div style={{ fontSize: '12px', color: '#64748b' }}>{item.ten_quan}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <span style={{
                    backgroundColor: '#fee2e2',
                    color: '#dc2626',
                    border: `1px solid ${color}`,
                    padding: '2px 8px',
                    borderRadius: '12px',
                    fontSize: '13px',
                    fontWeight: 'bold'
                  }}>
                    {item.currentVal.toFixed(2)} {selectedMetric === 'LST' ? '°C' : ''}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}