import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, useMap } from 'react-leaflet';
import L from 'leaflet';
import { METRIC_CONFIGS } from '../constants/mapConfigs';
import { getColorByMetric } from '../utils/colorUtils';

// Tự động căn khung nhìn vừa khít toàn bộ ranh giới hành chính TP.HCM
function AutoFitHCMBounds({ geoBoundary, isMobile }) {
  const map = useMap();

  useEffect(() => {
    if (!map) return;
    const timer = setTimeout(() => {
      map.invalidateSize();
      if (geoBoundary && Array.isArray(geoBoundary.features) && geoBoundary.features.length > 0) {
        try {
          const tempLayer = L.geoJSON(geoBoundary);
          const bounds = tempLayer.getBounds();
          if (bounds.isValid()) {
            map.fitBounds(bounds, {
              paddingTopLeft: isMobile ? [12, 12] : [24, 24],
              paddingBottomRight: isMobile ? [12, 95] : [215, 24]
            });
            return;
          }
        } catch (e) {
          console.warn('AutoFitHCMBounds fallback:', e);
        }
      }
      map.setView([10.75, 106.72], isMobile ? 9.2 : 9.8);
    }, 150);

    return () => clearTimeout(timer);
  }, [map, geoBoundary, isMobile]);

  return null;
}

export default function MapLayoutModal({
  onClose,
  geoBoundary,
  realValueMap,
  selectedMetric,
  effectiveDateStr,
  enableAI,
  user
}) {
  const metricCfg = METRIC_CONFIGS[selectedMetric] || METRIC_CONFIGS.NDVI;
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mapTitle, setMapTitle] = useState(
    `BẢN ĐỒ PHÂN BỐ ${metricCfg.name.toUpperCase()} TẠI TP. HỒ CHÍ MINH`
  );
  const [baseMapUrl, setBaseMapUrl] = useState(
    'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png'
  );
  const printStyleRef = useRef(null);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // CSS hỗ trợ in đúng trang bản đồ A4 khi bấm Xuất / In
  useEffect(() => {
    const styleEl = document.createElement('style');
    styleEl.innerHTML = `
      @media print {
        body * {
          visibility: hidden !important;
        }
        #gis-print-area, #gis-print-area * {
          visibility: visible !important;
        }
        #gis-print-area {
          position: fixed !important;
          inset: 0 !important;
          width: 100vw !important;
          height: 100vh !important;
          max-width: none !important;
          max-height: none !important;
          border-radius: 0 !important;
          box-shadow: none !important;
          padding: 12px 16px !important;
          z-index: 99999 !important;
        }
        .leaflet-control-attribution {
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

  const normalizeId = (raw) => {
    const s = String(raw ?? '').trim().replace('_0', '');
    if (/^[0-9a-fA-F]{20}$/.test(s)) {
      return `${parseInt(s.slice(-8), 16)}_0`;
    }
    return `${s}_0`;
  };

  const getFeatureValue = (feature, index) => {
    if (!feature) return null;
    const props = feature.properties || {};
    const rawId = props['system:index'] ?? props.id ?? props.area_id ?? index;
    const normId = normalizeId(rawId);
    const cleanId = normId.replace('_0', '');

    if (realValueMap && Object.keys(realValueMap).length > 0) {
      if (realValueMap[normId] !== undefined) return realValueMap[normId];
      if (realValueMap[cleanId] !== undefined) return realValueMap[cleanId];
      if (realValueMap[String(rawId)] !== undefined) return realValueMap[String(rawId)];
    }
    return null;
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(15, 23, 42, 0.85)',
      zIndex: 9999,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: isMobile ? '6px' : '14px',
      boxSizing: 'border-box',
      fontFamily: "'Times New Roman', Times, serif"
    }}>
      {/* Thanh điều khiển trên cùng: Tự xếp 2 tầng gọn gàng trên Mobile */}
      <div style={{
        width: '100%',
        maxWidth: '1240px',
        backgroundColor: '#1e293b',
        color: '#ffffff',
        padding: isMobile ? '8px 10px' : '10px 16px',
        borderRadius: '10px 10px 0 0',
        display: 'flex',
        flexDirection: isMobile ? 'column' : 'row',
        alignItems: isMobile ? 'stretch' : 'center',
        justifyContent: 'space-between',
        gap: isMobile ? '8px' : '12px',
        boxSizing: 'border-box',
        flexShrink: 0
      }}>
        {/* Ô nhập tiêu đề bản đồ */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flex: 1, minWidth: 0 }}>
          <span style={{ fontWeight: 'bold', fontSize: isMobile ? '13px' : '14.5px', whiteSpace: 'nowrap', flexShrink: 0 }}>
            Tiêu đề:
          </span>
          <input
            type="text"
            value={mapTitle}
            onChange={(e) => setMapTitle(e.target.value)}
            style={{
              flex: 1,
              minWidth: 0,
              padding: isMobile ? '5px 8px' : '6px 12px',
              borderRadius: '6px',
              border: 'none',
              fontSize: isMobile ? '13px' : '14px',
              fontWeight: 'bold',
              color: '#0f172a',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          />
        </div>

        {/* Nhóm chọn nền + Nút Xuất/In + Nút Đóng */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: isMobile ? 'space-between' : 'flex-end',
          gap: '6px',
          flexShrink: 0
        }}>
          <select
            value={baseMapUrl}
            onChange={(e) => setBaseMapUrl(e.target.value)}
            style={{
              flex: isMobile ? 1 : 'initial',
              minWidth: 0,
              padding: isMobile ? '6px 6px' : '7px 10px',
              borderRadius: '6px',
              border: 'none',
              fontSize: isMobile ? '12px' : '13.5px',
              fontWeight: 'bold',
              color: '#0f172a',
              fontFamily: "'Times New Roman', Times, serif",
              cursor: 'pointer'
            }}
          >
            <option value="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png">Nền Hành chính</option>
            <option value="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Light_Gray_Base/MapServer/tile/{z}/{y}/{x}">Nền Xám GIS</option>
            <option value="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}">Nền Vệ tinh</option>
          </select>

          <button
            onClick={handlePrint}
            style={{
              backgroundColor: '#0284c7',
              color: '#ffffff',
              border: 'none',
              padding: isMobile ? '6px 10px' : '7px 14px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: isMobile ? '12px' : '13.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            {isMobile ? '🖨️ Xuất PDF' : '🖨️ Xuất / In Bản Đồ (PDF)'}
          </button>

          <button
            onClick={onClose}
            style={{
              backgroundColor: '#ef4444',
              color: '#ffffff',
              border: 'none',
              padding: isMobile ? '6px 10px' : '7px 13px',
              borderRadius: '6px',
              fontWeight: 'bold',
              fontSize: isMobile ? '12px' : '13.5px',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ✕ Đóng
          </button>
        </div>
      </div>

      {/* Khung trang giấy bản đồ chuẩn GIS */}
      <div id="gis-print-area" style={{
        width: '100%',
        maxWidth: '1240px',
        flex: 1,
        minHeight: 0,
        backgroundColor: '#ffffff',
        borderRadius: '0 0 10px 10px',
        padding: isMobile ? '10px 12px' : '14px 20px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
        boxSizing: 'border-box'
      }}>
        {/* Tiêu đề trang bản đồ */}
        <div style={{
          textAlign: 'center',
          marginBottom: isMobile ? '8px' : '10px',
          borderBottom: '2px solid #0f172a',
          paddingBottom: isMobile ? '6px' : '8px',
          flexShrink: 0
        }}>
          <h1 style={{
            margin: 0,
            fontSize: isMobile ? '15.5px' : '20px',
            fontWeight: 'bold',
            color: '#0f172a',
            letterSpacing: '0.3px',
            lineHeight: 1.25
          }}>
            {mapTitle}
          </h1>
          <div style={{
            fontSize: isMobile ? '11.5px' : '13px',
            color: '#334155',
            marginTop: '4px',
            lineHeight: 1.35
          }}>
            Thời điểm: <strong>{effectiveDateStr}</strong> | Nguồn: <strong>{enableAI ? 'Mô hình AI Dự báo' : 'Vệ tinh MODIS (PostGIS)'}</strong> | Hệ quy chiếu: <strong>WGS 84 (EPSG:4326)</strong>
            {user?.full_name ? ` | Người lập: ${user.full_name}` : ''}
          </div>
        </div>

        {/* Khung bản đồ chính kèm các thành phần bản đồ học */}
        <div style={{
          flex: 1,
          minHeight: 0,
          position: 'relative',
          border: '2px solid #0f172a',
          overflow: 'hidden'
        }}>
          <MapContainer
            center={[10.75, 106.72]}
            zoom={isMobile ? 9.2 : 9.8}
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer key={baseMapUrl} url={baseMapUrl} />
            <AutoFitHCMBounds geoBoundary={geoBoundary} isMobile={isMobile} />

            {geoBoundary && (
              <GeoJSON
                key={`layout-geo-${selectedMetric}-${effectiveDateStr}-${JSON.stringify(realValueMap)}`}
                data={geoBoundary}
                style={(feature) => {
                  const idx = geoBoundary.features.indexOf(feature);
                  const val = getFeatureValue(feature, idx >= 0 ? idx : 0);
                  return {
                    color: '#0f172a',
                    weight: 0.95,
                    opacity: 0.9,
                    fillColor: getColorByMetric(val, selectedMetric),
                    fillOpacity: 0.88
                  };
                }}
              />
            )}
          </MapContainer>

          {/* Mũi tên chỉ hướng Bắc (North Arrow) */}
          <div style={{
            position: 'absolute',
            top: isMobile ? 8 : 14,
            right: isMobile ? 8 : 16,
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1.5px solid #0f172a',
            borderRadius: '6px',
            padding: isMobile ? '4px 8px' : '6px 12px',
            textAlign: 'center',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ fontSize: isMobile ? '13px' : '16px', fontWeight: 'bold', lineHeight: 1, color: '#0f172a' }}>▲</div>
            <div style={{ fontSize: isMobile ? '11px' : '13px', fontWeight: 'bold', color: '#0f172a', marginTop: '1px' }}>B</div>
          </div>

          {/* Thước tỷ lệ (Scale Bar) - Đặt góc trên trái trên Mobile để không bao giờ đụng chú giải */}
          <div style={{
            position: 'absolute',
            top: isMobile ? 8 : 'auto',
            bottom: isMobile ? 'auto' : 16,
            left: isMobile ? 8 : 16,
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.95)',
            border: '1.5px solid #0f172a',
            borderRadius: '6px',
            padding: isMobile ? '4px 8px' : '6px 12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '2px' }}>
              <div style={{ width: isMobile ? '28px' : '40px', height: '5px', backgroundColor: '#0f172a', border: '1px solid #0f172a' }} />
              <div style={{ width: isMobile ? '28px' : '40px', height: '5px', backgroundColor: '#ffffff', border: '1px solid #0f172a' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: isMobile ? '9.5px' : '11px', fontWeight: 'bold', color: '#0f172a' }}>
              <span>0</span>
              <span>15</span>
              <span>30 km</span>
            </div>
          </div>

          {/* Bảng Chú giải (Legend) - Gọn 2 cột trên Mobile, 1 cột chuẩn trên Desktop */}
          <div style={{
            position: 'absolute',
            bottom: isMobile ? 8 : 16,
            right: isMobile ? 8 : 16,
            left: isMobile ? 8 : 'auto',
            zIndex: 1000,
            backgroundColor: 'rgba(255,255,255,0.96)',
            border: '1.5px solid #0f172a',
            borderRadius: '6px',
            padding: isMobile ? '6px 8px' : '10px 14px',
            minWidth: isMobile ? 'auto' : '185px',
            boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
          }}>
            <div style={{
              fontSize: isMobile ? '11px' : '13px',
              fontWeight: 'bold',
              color: '#0f172a',
              borderBottom: '1px solid #cbd5e1',
              paddingBottom: '3px',
              marginBottom: '5px',
              textAlign: 'center'
            }}>
              CHÚ GIẢI ({metricCfg.name})
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: isMobile ? 'repeat(3, 1fr)' : '1fr',
              gap: isMobile ? '3px 6px' : '4px'
            }}>
              {metricCfg.palette.map((item, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: isMobile ? '10.5px' : '12px' }}>
                  <span style={{
                    display: 'inline-block',
                    width: isMobile ? '13px' : '18px',
                    height: isMobile ? '10px' : '12px',
                    backgroundColor: item.hex,
                    border: '1px solid #334155',
                    flexShrink: 0
                  }} />
                  <span style={{ color: '#1e293b', fontWeight: 'bold', whiteSpace: 'nowrap' }}>
                    {isMobile ? `${item.val}${metricCfg.unit}` : `Mức ${item.val}${metricCfg.unit}`}
                  </span>
                </div>
              ))}

              <div style={{
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                marginTop: isMobile ? 0 : '4px',
                paddingTop: isMobile ? 0 : '4px',
                borderTop: isMobile ? 'none' : '1px dashed #cbd5e1',
                fontSize: isMobile ? '10.5px' : '12px'
              }}>
                <span style={{
                  display: 'inline-block',
                  width: isMobile ? '13px' : '18px',
                  height: isMobile ? '10px' : '12px',
                  backgroundColor: '#cbd5e1',
                  border: '1px solid #334155',
                  flexShrink: 0
                }} />
                <span style={{ color: '#475569', whiteSpace: 'nowrap' }}>
                  {isMobile ? 'Không DL' : 'Mây che / Không dữ liệu'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}