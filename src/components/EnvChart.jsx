import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { METRIC_CONFIGS } from '../constants/mapConfigs';
import { getColorByMetric } from '../utils/colorUtils';

const METRIC_LINE_COLORS = {
  NDVI: { past: '#0284c7', forecast: '#16a34a', single: '#16a34a' },
  LST:  { past: '#f59e0b', forecast: '#dc2626', single: '#dc2626' },
  TVDI: { past: '#0d9488', forecast: '#ea580c', single: '#ea580c' }
};

export default function EnvChart({
  chartData,
  enableAI,
  selectedMetric,
  forecastMode,
  selectedPhuong,
  baseVal,
  activeTime,
  onSelectChartPoint
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const lineColors = METRIC_LINE_COLORS[selectedMetric] || METRIC_LINE_COLORS.NDVI;
  const titleAreaColor = baseVal !== null && baseVal !== undefined
    ? getColorByMetric(baseVal, selectedMetric)
    : '#0284c7';

  const hasData = Array.isArray(chartData) && chartData.length > 0;

  const handleChartClick = (state) => {
    if (!onSelectChartPoint) return;
    if (state && state.activeLabel) {
      const clickedPayload = state.activePayload?.[0]?.payload || null;
      onSelectChartPoint(String(state.activeLabel), clickedPayload);
    }
  };

  const handleDotClick = (dotProps) => {
    if (!onSelectChartPoint || !dotProps?.payload?.time) return;
    onSelectChartPoint(String(dotProps.payload.time), dotProps.payload);
  };

  const formatXAxisTick = (val) => {
    const s = String(val || '');
    if (isMobile && forecastMode === 'day' && s.length === 10) {
      return s.slice(5); // Trên điện thoại hiển thị MM-DD cho thoáng, không dính chữ
    }
    return s;
  };

  return (
    <div style={{
      height: '165px',
      minHeight: '155px',
      maxHeight: '175px',
      flexShrink: 0,
      backgroundColor: '#ffffff',
      borderTop: '2px solid #cbd5e1',
      padding: isMobile ? '4px 10px' : '4px 18px',
      display: 'flex',
      flexDirection: 'column',
      boxSizing: 'border-box'
    }}>
      <div style={{ textAlign: 'center', fontSize: isMobile ? '12.5px' : '13.5px', fontWeight: 'bold', marginBottom: '2px', color: '#1e293b', flexShrink: 0 }}>
        <span>Biểu đồ {enableAI ? 'Chuỗi thời gian & AI Dự báo' : 'Quan trắc Quá khứ'} {selectedMetric} ({forecastMode === 'day' ? 'Theo Ngày' : 'Theo Tháng'}) - </span>
        <span style={{ color: titleAreaColor }}>
          {selectedPhuong ? `${selectedPhuong.ten_phuong} (${selectedPhuong.ten_quan})` : 'Trung bình TP.HCM'}
        </span>
        {activeTime && (
          <span style={{ marginLeft: '8px', fontSize: '11.5px', backgroundColor: '#e0f2fe', color: '#0369a1', padding: '1px 7px', borderRadius: '10px', border: '1px solid #7dd3fc' }}>
            Đang hiển thị bản đồ kỳ: {activeTime}
          </span>
        )}
      </div>

      <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
        {!hasData ? (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#64748b',
            fontSize: '13px',
            fontStyle: 'italic',
            backgroundColor: '#f8fafc',
            borderRadius: '6px'
          }}>
            Đang tải dữ liệu chuỗi thời gian từ CSDL PostGIS...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={chartData}
              margin={{ top: 6, right: isMobile ? 12 : 20, left: -14, bottom: 0 }}
              onClick={handleChartClick}
              style={{ cursor: 'pointer' }}
            >
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <XAxis
                dataKey="time"
                tickFormatter={formatXAxisTick}
                minTickGap={isMobile ? 16 : 8}
                tick={{ fontSize: 11, fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", fill: '#334155' }}
              />
              <YAxis
                tick={{ fontSize: 11, fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif", fill: '#334155' }}
                domain={METRIC_CONFIGS[selectedMetric].domain}
              />
              <Tooltip
                formatter={(value, name) => [`${value} ${selectedMetric === 'LST' ? '°C' : ''}`, name]}
                labelFormatter={(label) => `Kỳ: ${label}`}
                contentStyle={{ fontFamily: "'Times New Roman', Times, serif", fontWeight: 'bold', borderRadius: '6px', fontSize: '12.5px' }}
              />
              <Legend
                verticalAlign="bottom"
                height={18}
                wrapperStyle={{ fontSize: '12px', fontWeight: 'bold', fontFamily: "'Times New Roman', Times, serif" }}
              />

              {enableAI ? (
                <>
                  <Line
                    type="monotone"
                    dataKey="Quá khứ"
                    stroke={lineColors.past}
                    strokeWidth={2.2}
                    dot={{ r: 3.5, fill: lineColors.past, cursor: 'pointer' }}
                    activeDot={{ r: 6, stroke: '#facc15', strokeWidth: 2, onClick: (_, payload) => handleDotClick(payload) }}
                    connectNulls={true}
                  />
                  <Line
                    type="monotone"
                    dataKey="AI Dự báo"
                    stroke={lineColors.forecast}
                    strokeWidth={2.2}
                    strokeDasharray="6 4"
                    dot={{ r: 4, fill: lineColors.forecast, cursor: 'pointer' }}
                    activeDot={{ r: 6.5, stroke: '#facc15', strokeWidth: 2, onClick: (_, payload) => handleDotClick(payload) }}
                    connectNulls={true}
                  />
                </>
              ) : (
                <Line
                  type="monotone"
                  dataKey="Quan trắc Quá khứ"
                  stroke={lineColors.single}
                  strokeWidth={2.2}
                  dot={{ r: 3.5, fill: lineColors.single, cursor: 'pointer' }}
                  activeDot={{ r: 6, stroke: '#facc15', strokeWidth: 2, onClick: (_, payload) => handleDotClick(payload) }}
                  connectNulls={true}
                />
              )}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}