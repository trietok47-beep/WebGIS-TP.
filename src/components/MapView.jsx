import React, { useEffect, useRef } from 'react';
import { MapContainer, TileLayer, GeoJSON, LayersControl } from 'react-leaflet';
import Map3D from '../Map3D';
import AlertOverlay from './AlertOverlay';
import { getColorByMetric } from '../utils/colorUtils';

export default function MapView({
  showChart,
  setShowChart,
  showAlert,
  setShowAlert,
  phuongData,
  handleSelectArea,
  mapDimension,
  setMapDimension,
  selectedMetric,
  effectiveDateStr,
  fromDate,
  fromMonth,
  forecastMode,
  selectedQuan,
  realValueMap,
  geoBoundary,
  getValueForFeature,
  mapRef,
  geoJsonRef,
  selectedPhuong,
  setSelectedPhuong,
  flyToArea
}) {
  const checkFeatureSelected = (feature, currentSelected) => {
    if (!currentSelected || !feature) return false;
    const props = feature.properties || {};
    const rawId = String(props['system:index'] ?? props.area_id ?? props.OBJECTID ?? props.FID ?? props.id ?? '').replace('_0', '');
    const selId = String(currentSelected.id ?? '').replace('_0', '');
    if (rawId && selId && rawId === selId) return true;
    return props.ten_phuong === currentSelected.ten_phuong && props.ten_quan === currentSelected.ten_quan;
  };

  // Luôn tính style từ dữ liệu mới nhất (không bị stale closure)
  const computeFeatureStyle = (feature) => {
    const featureIdx = geoBoundary?.features ? geoBoundary.features.indexOf(feature) : 0;
    const dynamicVal = getValueForFeature(feature, featureIdx >= 0 ? featureIdx : 0);
    const isHighlighted = checkFeatureSelected(feature, selectedPhuong);
    const isSelectedQuan = selectedQuan === 'ALL' || feature.properties?.ten_quan === selectedQuan;

    if (isHighlighted) {
      return {
        color: '#facc15',        // Viền vàng cố định cho khu vực đang chọn
        weight: 4.5,
        opacity: 1,
        fillColor: getColorByMetric(dynamicVal, selectedMetric),
        fillOpacity: 0.96
      };
    }

    return {
      color: '#0f172a',
      weight: isSelectedQuan ? 1.1 : 0.5,
      opacity: selectedPhuong ? 0.45 : 0.85,
      fillColor: getColorByMetric(dynamicVal, selectedMetric),
      fillOpacity: selectedPhuong ? 0.55 : 0.85
    };
  };

  // Ref luôn trỏ tới phiên bản mới nhất của computeFeatureStyle & selectedPhuong & getValueForFeature
  const computeStyleRef = useRef(computeFeatureStyle);
  const selectedPhuongRef = useRef(selectedPhuong);
  const getValueRef = useRef(getValueForFeature);

  computeStyleRef.current = computeFeatureStyle;
  selectedPhuongRef.current = selectedPhuong;
  getValueRef.current = getValueForFeature;

  // Cập nhật màu sắc & Popup mỗi khi dữ liệu ngày/chỉ số/vùng chọn thay đổi
  useEffect(() => {
    if (!geoJsonRef.current) return;
    geoJsonRef.current.eachLayer((layer) => {
      if (!layer.feature) return;
      layer.setStyle(computeStyleRef.current(layer.feature));

      const featureIdx = geoBoundary?.features ? geoBoundary.features.indexOf(layer.feature) : 0;
      const props = layer.feature.properties || {};
      const name = props.ten_phuong || 'Khu vực';
      const quanName = props.ten_quan || 'TP.HCM';
      const dynamicVal = getValueRef.current(layer.feature, featureIdx >= 0 ? featureIdx : 0);
      const hasData = dynamicVal !== null && dynamicVal !== undefined && !isNaN(Number(dynamicVal));

      layer.setPopupContent(`
        <div style="font-size:15px; font-family:'Times New Roman', Times, serif; padding:4px">
          <b>${name}</b><br/>
          <i>${quanName}</i><br/>
          <b>${selectedMetric}:</b> 
          <span style="color:${hasData ? '#0284c7' : '#64748b'}; font-weight:bold">
            ${hasData ? `${Number(dynamicVal).toFixed(2)} ${selectedMetric === 'LST' ? '°C' : ''}` : 'Chưa có dữ liệu'}
          </span>
        </div>
      `);

      if (checkFeatureSelected(layer.feature, selectedPhuong) && typeof layer.bringToFront === 'function') {
        layer.bringToFront();
      }
    });
  }, [selectedPhuong, selectedMetric, effectiveDateStr, fromDate, fromMonth, forecastMode, selectedQuan, realValueMap]);

  return (
    <div style={{ flex: 1, minHeight: 0, width: '100%', position: 'relative' }}>
      
      <AlertOverlay 
        showAlert={showAlert}
        onClose={() => setShowAlert(false)}
        selectedMetric={selectedMetric}
        phuongData={phuongData}
        getValueForFeature={getValueForFeature}
        handleSelectArea={handleSelectArea}
      />

      {/* Huy hiệu nhấn mạnh khu vực đang được chọn (Đồng nhất 2D & 3D) */}
      {selectedPhuong && (
        <div style={{
          position: 'absolute',
          top: 14,
          left: mapDimension === '3D' ? 20 : 56,
          zIndex: 1000,
          backgroundColor: 'rgba(15, 23, 42, 0.92)',
          color: '#ffffff',
          padding: '7px 14px',
          borderRadius: '8px',
          border: '2px solid #facc15',
          boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontSize: '14px'
        }}>
          <span>
            Đang chọn: <strong style={{ color: '#facc15' }}>{selectedPhuong.ten_phuong}</strong> ({selectedPhuong.ten_quan})
          </span>
          <button
            onClick={() => {
              setSelectedPhuong(null);
              if (mapRef.current) mapRef.current.closePopup();
            }}
            style={{
              backgroundColor: '#ef4444',
              color: '#fff',
              border: 'none',
              borderRadius: '4px',
              padding: '2px 8px',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '12px'
            }}
            title="Bỏ chọn khu vực"
          >
            ✕ Bỏ chọn
          </button>
        </div>
      )}

      {/* Nút chuyển đổi 2D / 3D */}
      <div style={{ 
        position: 'absolute', 
        top: 14, 
        right: 20, 
        zIndex: 1000, 
        backgroundColor: '#ffffff', 
        borderRadius: '8px', 
        padding: '6px 12px', 
        boxShadow: '0 4px 14px rgba(0,0,0,0.25)', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '10px',
        border: '1px solid #cbd5e1'
      }}>
        <span style={{ 
          backgroundColor: mapDimension === '3D' ? '#7c3aed' : '#f97316', 
          color: '#fff', 
          padding: '4px 8px', 
          borderRadius: '6px', 
          fontSize: '13px', 
          fontWeight: 'bold' 
        }}>
          {mapDimension}
        </span>
        <button
          onClick={() => setMapDimension(mapDimension === '2D' ? '3D' : '2D')}
          style={{
            border: 'none',
            background: 'none',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold',
            color: '#0f172a',
            padding: '2px 4px',
            fontFamily: "'Times New Roman', Times, serif"
          }}
        >
          {mapDimension === '2D' ? 'Lớp bản đồ 3D' : 'Lớp bản đồ 2D'}
        </button>
      </div>

      {mapDimension === '3D' ? (
        <Map3D 
          key={`map3d-${selectedMetric}-${selectedQuan}`}
          geoData={geoBoundary} 
          metricType={selectedMetric} 
          getValueFn={getValueForFeature} 
          getColorByMetric={getColorByMetric}
          selectedQuan={selectedQuan}
          selectedPhuong={selectedPhuong}
          setSelectedPhuong={setSelectedPhuong}
        />
      ) : (
        <MapContainer center={[10.78, 106.82]} zoom={9.5} ref={mapRef} style={{ height: '100%', width: '100%' }}>
          <LayersControl position="topright">
            <LayersControl.BaseLayer checked name="Bản đồ Đường phố (OSM)">
              <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            </LayersControl.BaseLayer>
            <LayersControl.BaseLayer name="Google Satellite (Vệ tinh)">
              <TileLayer url="https://mt1.google.com/vt/lyrs=s&x={x}&y={y}&z={z}" />
            </LayersControl.BaseLayer>
          </LayersControl>

          {geoBoundary && (
            <GeoJSON 
              ref={geoJsonRef}
              key="hcm-boundary-layer"
              data={geoBoundary}
              style={(feature) => computeStyleRef.current(feature)}
              onEachFeature={(feature, layer) => {
                const featureIdx = geoBoundary.features.indexOf(feature);
                const props = feature.properties || {};
                const name = props.ten_phuong || 'Khu vực';
                const quanName = props.ten_quan || 'TP.HCM';
                const dynamicVal = getValueRef.current(feature, featureIdx >= 0 ? featureIdx : 0);
                const hasData = dynamicVal !== null && dynamicVal !== undefined && !isNaN(Number(dynamicVal));
                
                layer.bindPopup(`
                  <div style="font-size:15px; font-family:'Times New Roman', Times, serif; padding:4px">
                    <b>${name}</b><br/>
                    <i>${quanName}</i><br/>
                    <b>${selectedMetric}:</b> 
                    <span style="color:${hasData ? '#0284c7' : '#64748b'}; font-weight:bold">
                      ${hasData ? `${Number(dynamicVal).toFixed(2)} ${selectedMetric === 'LST' ? '°C' : ''}` : 'Chưa có dữ liệu'}
                    </span>
                  </div>
                `);
                layer.on({
                  mouseover: (e) => {
                    if (!checkFeatureSelected(feature, selectedPhuongRef.current)) {
                      e.target.setStyle({ weight: 2.5, color: '#38bdf8' });
                    }
                  },
                  mouseout: (e) => {
                    // Gọi qua Ref để luôn lấy đúng màu dữ liệu hiện tại (không bao giờ biến thành màu xám)
                    e.target.setStyle(computeStyleRef.current(feature));
                    if (checkFeatureSelected(feature, selectedPhuongRef.current) && typeof e.target.bringToFront === 'function') {
                      e.target.bringToFront();
                    }
                  },
                  click: () => {
                    const currentVal = getValueRef.current(feature, featureIdx >= 0 ? featureIdx : 0);
                    const validVal = currentVal !== null && currentVal !== undefined && !isNaN(Number(currentVal));
                    const rawId = String(props['system:index'] ?? props.area_id ?? props.OBJECTID ?? props.FID ?? props.id ?? featureIdx).replace('_0', '');
                    const normId = /^[0-9a-fA-F]{20}$/.test(rawId) ? `${parseInt(rawId.slice(-8), 16)}_0` : `${rawId}_0`;
                    const areaObj = {
                      id: normId,
                      ten_phuong: name,
                      ten_quan: quanName,
                      value: validVal ? Number(currentVal).toFixed(2) : null,
                      featureIdx: featureIdx,
                      feature: feature
                    };
                    setSelectedPhuong(areaObj);
                    if (typeof layer.bringToFront === 'function') layer.bringToFront();
                    flyToArea(feature, layer);
                  }
                });
              }}
            />
          )}
        </MapContainer>
      )}

      <button onClick={() => setShowChart(!showChart)} style={{ position: 'absolute', bottom: 14, right: 14, zIndex: 1000, backgroundColor: '#ffffff', border: '1.5px solid #cbd5e1', padding: '7px 14px', borderRadius: '8px', cursor: 'pointer', fontSize: '13.5px', fontWeight: 'bold', color: '#1e293b', fontFamily: "'Times New Roman', Times, serif" }}>
        {showChart ? '▼ Ẩn biểu đồ' : '▲ Hiện biểu đồ'}
      </button>
    </div>
  );
}