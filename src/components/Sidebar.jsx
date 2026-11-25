import React from 'react';
import { METRIC_CONFIGS } from '../constants/mapConfigs';
import { formatVNDate, formatVNMonth } from '../utils/dateUtils';
import { getColorByMetric } from '../utils/colorUtils';

const VN_MONTHS = [
  { val: '01', label: 'Tháng 01' },
  { val: '02', label: 'Tháng 02' },
  { val: '03', label: 'Tháng 03' },
  { val: '04', label: 'Tháng 04' },
  { val: '05', label: 'Tháng 05' },
  { val: '06', label: 'Tháng 06' },
  { val: '07', label: 'Tháng 07' },
  { val: '08', label: 'Tháng 08' },
  { val: '09', label: 'Tháng 09' },
  { val: '10', label: 'Tháng 10' },
  { val: '11', label: 'Tháng 11' },
  { val: '12', label: 'Tháng 12' }
];

const YEARS_LIST = Array.from({ length: 14 }, (_, i) => String(2017 + i)); // 2017 -> 2030

function VietnameseMonthPicker({ value, onChange, minMonth, maxMonth }) {
  const safeVal = value && value.includes('-') ? value : '2026-11';
  const [curYear, curMonth] = safeVal.split('-');

  const handleUpdate = (nextYear, nextMonth) => {
    let candidate = `${nextYear}-${nextMonth}`;
    if (minMonth && candidate < minMonth) candidate = minMonth;
    if (maxMonth && candidate > maxMonth) candidate = maxMonth;
    onChange(candidate);
  };

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: '1fr 1fr',
      gap: '6px',
      width: '100%'
    }}>
      <select
        value={curMonth}
        onChange={(e) => handleUpdate(curYear, e.target.value)}
        style={{
          width: '100%',
          minWidth: 0,
          padding: '7px 8px',
          borderRadius: '6px',
          border: '1.5px solid #93c5fd',
          backgroundColor: '#ffffff',
          fontSize: '13.5px',
          fontWeight: 'bold',
          color: '#1e3a8a',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Times New Roman', Times, serif",
          boxSizing: 'border-box'
        }}
      >
        {VN_MONTHS.map((m) => {
          const ym = `${curYear}-${m.val}`;
          const disabled = (minMonth && ym < minMonth) || (maxMonth && ym > maxMonth);
          return (
            <option key={m.val} value={m.val} disabled={disabled}>
              {m.label}
            </option>
          );
        })}
      </select>

      <select
        value={curYear}
        onChange={(e) => handleUpdate(e.target.value, curMonth)}
        style={{
          width: '100%',
          minWidth: 0,
          padding: '7px 8px',
          borderRadius: '6px',
          border: '1.5px solid #93c5fd',
          backgroundColor: '#ffffff',
          fontSize: '13.5px',
          fontWeight: 'bold',
          color: '#1e3a8a',
          outline: 'none',
          cursor: 'pointer',
          fontFamily: "'Times New Roman', Times, serif",
          boxSizing: 'border-box'
        }}
      >
        {YEARS_LIST.map((y) => {
          const minY = minMonth ? minMonth.slice(0, 4) : null;
          const maxY = maxMonth ? maxMonth.slice(0, 4) : null;
          const disabled = (minY && y < minY) || (maxY && y > maxY);
          return (
            <option key={y} value={y} disabled={disabled}>
              Năm {y}
            </option>
          );
        })}
      </select>
    </div>
  );
}

export default function Sidebar({
  sidebarWidth,
  enableAI,
  handleToggleAI,
  selectedMetric,
  forecastMode,
  setForecastMode,
  fromDate,
  setFromDate,
  toDate,
  setToDate,
  fromMonth,
  setFromMonth,
  toMonth,
  setToMonth,
  todayStr,
  currentMonthStr,
  selectedQuan,
  handleQuanChange,
  quanList,
  searchTerm,
  setSearchTerm,
  isPlaying,
  setIsPlaying,
  showAlert,
  setShowAlert,
  filteredPhuongList,
  selectedPhuong,
  handleSelectArea,
  getValueForFeature
}) {
  const isCompact = sidebarWidth < 280;

  return (
    <div style={{ 
      width: '100%',
      height: '100%',
      minHeight: 0,
      backgroundColor: '#ffffff', 
      display: 'flex', 
      flexDirection: 'column', 
      zIndex: 1000, 
      padding: isCompact ? '10px' : '16px',
      paddingBottom: '40px',
      overflowY: 'auto',
      overflowX: 'hidden',
      WebkitOverflowScrolling: 'touch',
      touchAction: 'pan-y',
      position: 'relative',
      boxSizing: 'border-box'
    }}>
      <div style={{ 
        backgroundColor: '#0f172a', 
        color: '#38bdf8', 
        padding: isCompact ? '8px 10px' : '10px 14px', 
        borderRadius: '10px', 
        fontSize: isCompact ? '12px' : '13px', 
        fontWeight: 'bold', 
        border: '1.5px solid #0284c7', 
        textAlign: 'center', 
        marginBottom: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
        flexShrink: 0
      }}>
        {enableAI ? 'AI Dự Báo' : 'Quan Trắc'} {selectedMetric} (
        {forecastMode === 'day' 
          ? `${formatVNDate(fromDate)} đến ${formatVNDate(toDate)}` 
          : `${formatVNMonth(fromMonth)} đến ${formatVNMonth(toMonth)}`}
        )
      </div>
      
      <div style={{ marginBottom: '12px', backgroundColor: enableAI ? '#eff6ff' : '#f1f5f9', padding: isCompact ? '10px' : '12px', borderRadius: '10px', border: enableAI ? '1px solid #bfdbfe' : '1px solid #cbd5e1', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '10px', paddingBottom: '8px', borderBottom: '1px solid #cbd5e1' }}>
          <span style={{ fontSize: isCompact ? '13.5px' : '15px', fontWeight: 'bold', color: enableAI ? '#1e40af' : '#475569' }}>
            {enableAI ? 'AI Dự Báo Môi Trường' : 'Quan Trắc Quá Khứ'}
          </span>

          <label style={{ display: 'flex', alignItems: 'center', cursor: 'pointer', gap: '5px', fontSize: '12.5px', fontWeight: 'bold', color: enableAI ? '#2563eb' : '#64748b', whiteSpace: 'nowrap' }}>
            <input 
              type="checkbox" 
              checked={enableAI} 
              onChange={e => handleToggleAI(e.target.checked)}
              style={{ width: '16px', height: '16px', cursor: 'pointer' }}
            />
            Bật AI Dự báo
          </label>
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '6px', marginBottom: '10px' }}>
          <span style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569' }}>Chế độ xem:</span>
          <div style={{ display: 'flex', backgroundColor: '#dbeafe', padding: '2px', borderRadius: '6px' }}>
            <button
              onClick={() => setForecastMode('day')}
              style={{
                backgroundColor: forecastMode === 'day' ? '#2563eb' : 'transparent',
                color: forecastMode === 'day' ? '#fff' : '#1e40af',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              Theo Ngày
            </button>
            <button
              onClick={() => setForecastMode('month')}
              style={{
                backgroundColor: forecastMode === 'month' ? '#2563eb' : 'transparent',
                color: forecastMode === 'month' ? '#fff' : '#1e40af',
                border: 'none',
                padding: '3px 8px',
                borderRadius: '5px',
                fontSize: '12px',
                fontWeight: 'bold',
                cursor: 'pointer',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              Theo Tháng
            </button>
          </div>
        </div>

        {forecastMode === 'day' ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>
                {enableAI ? 'Từ Ngày Dự Báo:' : 'Từ Ngày Quan Trắc:'}
              </label>
              <input 
                type="date" 
                value={fromDate} 
                min={enableAI ? todayStr : undefined}
                max={!enableAI ? todayStr : undefined}
                onChange={e => setFromDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #93c5fd', fontSize: '13.5px', fontWeight: 'bold', color: '#1e3a8a', outline: 'none', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}
              />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '2px' }}>
                {enableAI ? 'Đến Ngày Dự Báo:' : 'Đến Ngày Hiện Tại:'}
              </label>
              <input 
                type="date" 
                value={toDate} 
                min={enableAI ? todayStr : undefined}
                max={!enableAI ? todayStr : undefined}
                onChange={e => setToDate(e.target.value)}
                style={{ width: '100%', padding: '6px 8px', borderRadius: '6px', border: '1.5px solid #93c5fd', fontSize: '13.5px', fontWeight: 'bold', color: '#1e3a8a', outline: 'none', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}
              />
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                {enableAI ? 'Từ Tháng Dự Báo:' : 'Từ Tháng Quá Khứ:'}
              </label>
              <VietnameseMonthPicker
                value={fromMonth}
                onChange={setFromMonth}
                minMonth={enableAI ? currentMonthStr : undefined}
                maxMonth={!enableAI ? currentMonthStr : undefined}
              />
            </div>
            <div>
              <label style={{ fontSize: '12.5px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '4px' }}>
                {enableAI ? 'Đến Tháng Dự Báo:' : 'Đến Tháng Hiện Tại:'}
              </label>
              <VietnameseMonthPicker
                value={toMonth}
                onChange={setToMonth}
                minMonth={enableAI ? currentMonthStr : undefined}
                maxMonth={!enableAI ? currentMonthStr : undefined}
              />
            </div>
          </div>
        )}
      </div>

      <div style={{ marginBottom: '12px', flexShrink: 0 }}>
        <label style={{ fontSize: '14px', fontWeight: 'bold', color: '#475569', display: 'block', marginBottom: '6px' }}>
          Lọc theo Quận / Huyện:
        </label>
        <select value={selectedQuan} onChange={e => handleQuanChange(e.target.value)} style={{ width: '100%', padding: '9px 10px', borderRadius: '8px', border: '1.5px solid #cbd5e1', fontSize: '14px', fontWeight: 'bold', color: '#0f172a', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }}>
          <option value="ALL">-- Tất cả Quận / Huyện TP.HCM --</option>
          {quanList.map((q, idx) => <option key={idx} value={q}>{q}</option>)}
        </select>
      </div>

      <div style={{ display: 'flex', gap: '6px', marginBottom: '12px', flexShrink: 0 }}>
        <input type="text" placeholder="Tìm kiếm khu vực..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} style={{ flex: 1, minWidth: 0, padding: '9px 10px', border: '1.5px solid #cbd5e1', borderRadius: '8px', fontSize: '14px', fontFamily: "'Times New Roman', Times, serif", boxSizing: 'border-box' }} />
        <button style={{ backgroundColor: '#0284c7', border: 'none', color: '#fff', padding: '0 12px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold', flexShrink: 0 }}>Tìm</button>
      </div>

      {/* DẢI MÀU GEE */}
      <div style={{ backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '10px', marginBottom: '12px', fontSize: '13.5px', flexShrink: 0 }}>
        <div style={{ fontWeight: 'bold', marginBottom: '6px', color: '#1e293b', fontSize: '14px' }}>Dải màu {METRIC_CONFIGS[selectedMetric].name}:</div>
        <div style={{ 
          height: '14px', borderRadius: '4px', 
          background: `linear-gradient(to right, ${METRIC_CONFIGS[selectedMetric].palette.map(p => p.hex).join(', ')})`, 
          marginBottom: '6px', border: '1px solid #cbd5e1' 
        }}></div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '10.5px', color: '#334155', fontWeight: 'bold' }}>
          {METRIC_CONFIGS[selectedMetric].palette.map((p, idx) => (
            <span key={idx}>{Number(p.val).toFixed(selectedMetric === 'LST' ? 0 : 2)}</span>
          ))}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px', marginBottom: '12px', flexShrink: 0 }}>
        <button onClick={() => setIsPlaying(!isPlaying)} style={{ backgroundColor: '#0284c7', color: '#fff', border: 'none', padding: '9px 6px', borderRadius: '8px', cursor: 'pointer', fontSize: isCompact ? '13px' : '14.5px', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif" }}>
          {isPlaying ? 'Tạm dừng' : '► Trình chiếu'}
        </button>
        <button 
          onClick={() => setShowAlert(!showAlert)} 
          style={{ 
            backgroundColor: showAlert ? '#991b1b' : '#ef4444', 
            color: '#fff', 
            border: showAlert ? '2px solid #fca5a5' : 'none', 
            padding: '9px 6px', 
            borderRadius: '8px', 
            cursor: 'pointer', 
            fontSize: isCompact ? '13px' : '14.5px', 
            fontWeight: 'bold', 
            fontFamily: "'Times New Roman', Times, serif" 
          }}
        >
          {showAlert ? '✕ Đóng' : '⚠️ Cảnh báo'}
        </button>
      </div>

      <div style={{ fontWeight: 'bold', fontSize: '15px', borderBottom: '2px solid #e2e8f0', paddingBottom: '6px', marginBottom: '8px', display: 'flex', justifyContent: 'space-between', color: '#0f172a', flexShrink: 0 }}>
        <span>Bảng Xếp Hạng ({filteredPhuongList.length})</span>
        <span style={{ fontSize: '13.5px', color: '#1d4ed8', fontWeight: 'bold' }}>{selectedMetric}</span>
      </div>
      
      <div style={{ border: '1px solid #f1f5f9', borderRadius: '8px', flexShrink: 0 }}>
        {filteredPhuongList.map((p, index) => {
          const regionVal = getValueForFeature(p.feature, p.featureIdx);
          const regionColor = getColorByMetric(regionVal, selectedMetric);
          return (
            <div key={p.id} onClick={() => handleSelectArea(p)} style={{ padding: isCompact ? '10px' : '12px 14px', borderBottom: '1px solid #f1f5f9', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px', fontSize: isCompact ? '13.5px' : '15px', cursor: 'pointer', backgroundColor: selectedPhuong?.id === p.id ? '#cbd5e1' : '#fff', transition: 'background-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 }}>
                <span style={{ width: '13px', height: '13px', borderRadius: '3px', backgroundColor: regionColor, border: '1px solid #475569', display: 'inline-block', flexShrink: 0 }}></span>
                <div style={{ minWidth: 0 }}>
                  <div style={{ fontWeight: 'bold', color: '#0f172a', wordBreak: 'break-word' }}><b>{index + 1}.</b> {p.ten_phuong}</div>
                  <div style={{ fontSize: '12.5px', color: '#0284c7', fontWeight: 'bold' }}>{p.ten_quan}</div>
                </div>
              </div>
              <span style={{ color: regionColor, fontWeight: 'bold', fontSize: isCompact ? '13.5px' : '15px', flexShrink: 0 }}>
                {Number(regionVal).toFixed(2)} {selectedMetric === 'LST' ? '°C' : ''}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}