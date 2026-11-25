import React, { useState, useEffect, useMemo } from 'react';
import DeckGL from '@deck.gl/react';
import { GeoJsonLayer, BitmapLayer } from '@deck.gl/layers';
import { TileLayer } from '@deck.gl/geo-layers';
import { FlyToInterpolator } from '@deck.gl/core';

const INITIAL_VIEW_STATE = {
  longitude: 106.82,
  latitude: 10.75,
  zoom: 8.8,
  pitch: 45,
  bearing: 0,
};

const parseColorToRGB = (colorStr, alpha = 220) => {
  if (!colorStr) return [203, 213, 225, alpha];

  if (colorStr.startsWith('rgb')) {
    const matches = colorStr.match(/\d+/g);
    if (matches && matches.length >= 3) {
      return [Number(matches[0]), Number(matches[1]), Number(matches[2]), alpha];
    }
  }

  if (colorStr.startsWith('#')) {
    const cleanHex = colorStr.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return [r, g, b, alpha];
  }

  return [203, 213, 225, alpha];
};

// Tính tâm hình học (Centroid) của một Feature Polygon / MultiPolygon để bay camera 3D tới
const getFeatureCenter = (feature) => {
  if (!feature || !feature.geometry) return null;
  const coords = [];
  const collectCoords = (arr) => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') {
      coords.push(arr);
    } else {
      arr.forEach(collectCoords);
    }
  };
  collectCoords(feature.geometry.coordinates);
  if (coords.length === 0) return null;

  let minLng = Infinity, maxLng = -Infinity, minLat = Infinity, maxLat = -Infinity;
  coords.forEach(([lng, lat]) => {
    if (lng < minLng) minLng = lng;
    if (lng > maxLng) maxLng = lng;
    if (lat < minLat) minLat = lat;
    if (lat > maxLat) maxLat = lat;
  });
  return {
    longitude: (minLng + maxLng) / 2,
    latitude: (minLat + maxLat) / 2
  };
};

export default function Map3D({
  geoData,
  metricType,
  getValueFn,
  getColorByMetric,
  selectedQuan,
  selectedPhuong,
  setSelectedPhuong
}) {
  const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);

  // Kiểm tra feature có khớp với khu vực đang được chọn không
  const isFeatureSelected = (feature) => {
    if (!selectedPhuong || !feature) return false;
    const props = feature.properties || {};
    const rawId = String(props['system:index'] ?? props.id ?? props.area_id ?? '').replace('_0', '');
    const selId = String(selectedPhuong.id ?? '').replace('_0', '');
    if (rawId && selId && rawId === selId) return true;
    return props.ten_phuong === selectedPhuong.ten_phuong && props.ten_quan === selectedPhuong.ten_quan;
  };

  // Tự động bay camera 3D tới khu vực đang được chọn (từ Sidebar hoặc Click trên bản đồ)
  useEffect(() => {
    if (!selectedPhuong || !geoData?.features) return;
    const targetFeature = selectedPhuong.feature || geoData.features.find(f => isFeatureSelected(f));
    const center = getFeatureCenter(targetFeature);
    if (center) {
      setViewState(prev => ({
        ...prev,
        longitude: center.longitude,
        latitude: center.latitude,
        zoom: 12.2,
        pitch: 52,
        transitionDuration: 900,
        transitionInterpolator: new FlyToInterpolator()
      }));
    }
  }, [selectedPhuong]);

  // Tự động zoom camera 3D theo Quận/Huyện khi lọc Quận/Huyện
  useEffect(() => {
    if (!geoData?.features) return;
    if (!selectedQuan || selectedQuan === 'ALL') {
      setViewState(prev => ({
        ...prev,
        longitude: INITIAL_VIEW_STATE.longitude,
        latitude: INITIAL_VIEW_STATE.latitude,
        zoom: INITIAL_VIEW_STATE.zoom,
        transitionDuration: 800,
        transitionInterpolator: new FlyToInterpolator()
      }));
      return;
    }
    const quanFeatures = geoData.features.filter(f => f.properties?.ten_quan === selectedQuan);
    if (quanFeatures.length > 0) {
      const mergedGeo = { type: 'GeometryCollection', geometries: quanFeatures.map(f => f.geometry) };
      const center = getFeatureCenter({ geometry: { coordinates: mergedGeo.geometries.map(g => g.coordinates) } });
      if (center) {
        setViewState(prev => ({
          ...prev,
          longitude: center.longitude,
          latitude: center.latitude,
          zoom: 11.2,
          transitionDuration: 800,
          transitionInterpolator: new FlyToInterpolator()
        }));
      }
    }
  }, [selectedQuan]);

  const filteredFeatures = useMemo(() => {
    if (!geoData || !geoData.features) return [];
    return geoData.features.filter(f => {
      if (!selectedQuan || selectedQuan === 'ALL') return true;
      return f.properties?.ten_quan === selectedQuan;
    });
  }, [geoData, selectedQuan]);

  if (!geoData || !geoData.features) return null;

  const geoJsonData = {
    type: 'FeatureCollection',
    features: filteredFeatures
  };

  const baseMapTileLayer = new TileLayer({
    id: 'base-map-tile-layer',
    data: 'https://c.tile.openstreetmap.org/{z}/{x}/{y}.png',
    minZoom: 0,
    maxZoom: 19,
    tileSize: 256,
    renderSubLayers: props => {
      const { bbox: { west, south, east, north } } = props.tile;
      return new BitmapLayer(props, {
        data: null,
        image: props.data,
        bounds: [west, south, east, north]
      });
    }
  });

  const geojson3DLayer = new GeoJsonLayer({
    id: `3d-geojson-layer-${metricType}-${selectedQuan}`,
    data: geoJsonData,
    pickable: true,
    stroked: true,
    filled: true,
    extruded: true,
    wireframe: false,
    autoHighlight: true,
    highlightColor: [56, 189, 248, 140],

    getElevation: (f) => {
      const origIdx = geoData.features.indexOf(f);
      const rawVal = getValueFn(f, origIdx >= 0 ? origIdx : 0);
      const selectedBonus = isFeatureSelected(f) ? 1400 : 0; // Nâng nổi khối 3D đang chọn lên cao hơn hẳn
      if (rawVal === null || rawVal === undefined || isNaN(Number(rawVal))) return 30 + selectedBonus;
      const val = Number(rawVal);
      let baseH = 300;
      if (metricType === 'LST') baseH = Math.max((val - 20) * 180, 50);
      else if (metricType === 'NDVI') baseH = Math.max((val + 0.2) * 2200, 50);
      else if (metricType === 'TVDI') baseH = Math.max(val * 2500, 50);
      return baseH + selectedBonus;
    },

    getFillColor: (f) => {
      const origIdx = geoData.features.indexOf(f);
      const val = getValueFn(f, origIdx >= 0 ? origIdx : 0);
      const colorStr = getColorByMetric(val, metricType);
      const isSelected = isFeatureSelected(f);
      const alpha = selectedPhuong ? (isSelected ? 255 : 135) : 220;
      return parseColorToRGB(colorStr, alpha);
    },

    getLineColor: (f) => {
      return isFeatureSelected(f) ? [250, 204, 21, 255] : [255, 255, 255, 200];
    },

    getLineWidth: (f) => {
      return isFeatureSelected(f) ? 28 : 2;
    },
    lineWidthMinPixels: 1.5,

    onClick: ({ object }) => {
      if (!object || !setSelectedPhuong) return;
      const origIdx = geoData.features.indexOf(object);
      const props = object.properties || {};
      const rawVal = getValueFn(object, origIdx >= 0 ? origIdx : 0);
      const validVal = rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal));
      const rawId = String(props['system:index'] ?? props.id ?? props.area_id ?? origIdx).replace('_0', '');
      const normId = /^[0-9a-fA-F]{20}$/.test(rawId) ? `${parseInt(rawId.slice(-8), 16)}_0` : `${rawId}_0`;

      setSelectedPhuong({
        id: normId,
        ten_phuong: props.ten_phuong || 'Khu vực',
        ten_quan: props.ten_quan || 'TP.HCM',
        value: validVal ? Number(rawVal).toFixed(2) : null,
        featureIdx: origIdx,
        feature: object
      });
    },

    updateTriggers: {
      getFillColor: [metricType, getValueFn, getColorByMetric, selectedPhuong],
      getElevation: [metricType, getValueFn, selectedPhuong],
      getLineColor: [selectedPhuong],
      getLineWidth: [selectedPhuong]
    }
  });

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%', backgroundColor: '#0f172a' }}>
      <DeckGL
        viewState={viewState}
        onViewStateChange={({ viewState: nextViewState }) => setViewState(nextViewState)}
        controller={{ doubleClickZoom: false, dragRotate: true }}
        layers={[baseMapTileLayer, geojson3DLayer]}
        getTooltip={({ object }) => {
          if (!object) return null;
          const origIdx = geoData.features.indexOf(object);
          const props = object.properties || {};
          const rawVal = getValueFn(object, origIdx >= 0 ? origIdx : 0);
          const hasData = rawVal !== null && rawVal !== undefined && !isNaN(Number(rawVal));
          return {
            html: `
              <div style="font-family:'Times New Roman', Times, serif; padding: 8px; font-size: 15px;">
                <b style="color:#0284c7; font-size: 16px">${props.ten_phuong || 'Khu vực'}</b><br/>
                <i>${props.ten_quan || 'TP.HCM'}</i><br/>
                <hr style="margin: 4px 0; border:0; border-top: 1px solid #cbd5e1" />
                <b>Chỉ số ${metricType} (3D):</b> 
                <span style="color:${hasData ? '#16a34a' : '#64748b'}; font-weight:bold; font-size: 15px">
                  ${hasData ? `${Number(rawVal).toFixed(2)} ${metricType === 'LST' ? '°C' : ''}` : 'Chưa có dữ liệu'}
                </span>
              </div>
            `,
            style: { 
              backgroundColor: '#ffffff', 
              color: '#0f172a', 
              borderRadius: '8px', 
              boxShadow: '0 4px 14px rgba(0,0,0,0.3)',
              border: '1px solid #cbd5e1'
            }
          };
        }}
      />
    </div>
  );
}