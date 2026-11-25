import React, { useState, useEffect, useMemo, useRef } from 'react';
import axios from 'axios';
import 'leaflet/dist/leaflet.css';

import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import MapView from './components/MapView';
import EnvChart from './components/EnvChart';
import LoginModal from './components/LoginModal';
import BulletinModal from './components/BulletinModal';
import TreeBenefitModal from './components/TreeBenefitModal';
import MapLayoutModal from './components/MapLayoutModal';
import AdminModal from './components/AdminModal';

class SafeErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, errorMsg: '' };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, errorMsg: error?.message || String(error) };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px', fontFamily: 'Times New Roman, serif', color: '#991b1b', backgroundColor: '#fef2f2', height: '100vh' }}>
          <h2>Đã phát hiện lỗi giao diện:</h2>
          <pre style={{ backgroundColor: '#fff', padding: '16px', borderRadius: '8px', border: '1px solid #fca5a5', whiteSpace: 'pre-wrap' }}>
            {this.state.errorMsg}
          </pre>
          <button onClick={() => window.location.reload()} style={{ marginTop: '16px', padding: '10px 20px', backgroundColor: '#0284c7', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>
            Tải lại trang
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

function getCentroidCoords(geometry) {
  if (!geometry || !geometry.coordinates) return null;
  const pts = [];
  const walk = (arr) => {
    if (!Array.isArray(arr)) return;
    if (typeof arr[0] === 'number' && typeof arr[1] === 'number') pts.push(arr);
    else arr.forEach(walk);
  };
  walk(geometry.coordinates);
  if (pts.length === 0) return null;
  let sumLng = 0, sumLat = 0;
  pts.forEach(([lng, lat]) => { sumLng += lng; sumLat += lat; });
  return { lng: sumLng / pts.length, lat: sumLat / pts.length };
}

function classifyHCMZone(geometry) {
  const c = getCentroidCoords(geometry);
  if (!c) return 'TP. Hồ Chí Minh';
  const { lng, lat } = c;
  if (lat < 10.65) return 'Khu Nam & Cần Giờ';
  if (lat > 10.90) return 'Khu Tây Bắc (Củ Chi - Hóc Môn)';
  if (lng > 106.73 && lat >= 10.72) return 'Khu Đông (TP. Thủ Đức)';
  if (lng < 106.63) return 'Khu Tây (Bình Tân - Bình Chánh)';
  if (lat < 10.75) return 'Khu Nam (Quận 7 - Nhà Bè)';
  return 'Khu Trung Tâm TP.HCM';
}

function extractAdminNames(props = {}, geometry = null, fallbackIdx = 0) {
  const keys = Object.keys(props);

  const findByKeys = (exactList, patternList) => {
    for (const k of exactList) {
      if (props[k] !== undefined && props[k] !== null && String(props[k]).trim() !== '') {
        return String(props[k]).trim();
      }
    }
    for (const key of keys) {
      const low = key.toLowerCase();
      if (patternList.some(p => low.includes(p)) && props[key] !== null && String(props[key]).trim() !== '') {
        return String(props[key]).trim();
      }
    }
    return null;
  };

  const tenPhuong =
    findByKeys(
      ['ten_phuong', 'TEN_PHUONG', 'Ten_Phuong', 'TEN_XA', 'ten_xa', 'Ten_Xa', 'NAME_3', 'VARNAME_3', 'ADM3_VI', 'phuong_xa', 'ten_px'],
      ['phuong', 'xa', 'ward', 'commune', 'adm3', 'name_3', 'px']
    ) || `Phường/Xã ${fallbackIdx + 1}`;

  const tenQuan =
    findByKeys(
      ['ten_quan', 'TEN_QUAN', 'Ten_Quan', 'TEN_HUYEN', 'ten_huyen', 'Ten_Huyen', 'NAME_2', 'VARNAME_2', 'ADM2_VI', 'quan_huyen', 'ten_qh', 'qh', 'QH'],
      ['quan', 'huyen', 'district', 'adm2', 'name_2', 'qh']
    ) || classifyHCMZone(geometry);

  return { tenPhuong, tenQuan };
}

function getRawFeatureId(props = {}, fallbackIdx = 0) {
  return (
    props['system:index'] ??
    props.area_id ??
    props.OBJECTID ??
    props.FID ??
    props.id ??
    fallbackIdx
  );
}

function MainApp() {
  const todayObj = new Date('2026-11-18T00:00:00');
  const todayStr = '2026-11-18';
  const currentMonthStr = '2026-11';

  const getRelativeDate = (daysOffset) => {
    const d = new Date(todayObj);
    d.setDate(d.getDate() + daysOffset);
    return d.toISOString().split('T')[0];
  };

  const getRelativeMonth = (monthsOffset) => {
    const d = new Date(todayObj);
    d.setMonth(d.getMonth() + monthsOffset);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 768);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // State điều chỉnh độ rộng Sidebar (kéo thả tùy ý trên cả Desktop lẫn Mobile)
  const [desktopSidebarWidth, setDesktopSidebarWidth] = useState(345);
  const [desktopSidebarCollapsed, setDesktopSidebarCollapsed] = useState(false);
  const [mobileSidebarWidth, setMobileSidebarWidth] = useState(() => Math.min(Math.round(window.innerWidth * 0.82), 345));
  const isResizingRef = useRef(false);

  const [selectedMetric, setSelectedMetric] = useState('NDVI');
  const [enableAI, setEnableAI] = useState(false);
  const [forecastMode, setForecastMode] = useState('day');
  const [mapDimension, setMapDimension] = useState('2D');

  const [fromDate, setFromDate] = useState(getRelativeDate(-7));
  const [toDate, setToDate] = useState(todayStr);
  const [fromMonth, setFromMonth] = useState(getRelativeMonth(-6));
  const [toMonth, setToMonth] = useState(currentMonthStr);

  const [activeMapDate, setActiveMapDate] = useState(getRelativeDate(-7));
  const [activeMapMonth, setActiveMapMonth] = useState(getRelativeMonth(-6));
  const [chartSourceOverride, setChartSourceOverride] = useState(null);

  const [geoBoundary, setGeoBoundary] = useState(null);
  const [realValueMap, setRealValueMap] = useState({});
  const [timeSeriesDb, setTimeSeriesDb] = useState([]);
  const [isBackendConnected, setIsBackendConnected] = useState(false);
  const [dbSource, setDbSource] = useState('Đang kết nối PostgreSQL...');

  const [selectedQuan, setSelectedQuan] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPhuong, setSelectedPhuong] = useState(null);
  const [showChart, setShowChart] = useState(true);
  const [isPlaying, setIsPlaying] = useState(false);

  const [user, setUser] = useState(null);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showAlert, setShowAlert] = useState(false);
  const [showBulletinModal, setShowBulletinModal] = useState(false);
  const [showTreeBenefitModal, setShowTreeBenefitModal] = useState(false);
  const [showMapLayoutModal, setShowMapLayoutModal] = useState(false);
  const [showAdminModal, setShowAdminModal] = useState(false);

  const mapRef = useRef(null);
  const geoJsonRef = useRef(null);

  const effectiveDateStr = forecastMode === 'day' ? activeMapDate : `${activeMapMonth}-01`;
  const effectiveEnableAI = chartSourceOverride !== null ? chartSourceOverride === 'forecast' : enableAI;

  const normalizeAreaId = (raw) => {
    const s = String(raw ?? '').trim().replace('_0', '');
    if (/^[0-9a-fA-F]{20}$/.test(s)) {
      return `${parseInt(s.slice(-8), 16)}_0`;
    }
    return `${s}_0`;
  };

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setMobileSidebarOpen(false);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Xử lý sự kiện kéo thả co giãn chiều rộng Sidebar bằng chuột (Desktop) và cảm ứng (Mobile)
  useEffect(() => {
    const handleMove = (clientX) => {
      if (!isResizingRef.current) return;
      if (window.innerWidth <= 768) {
        const minW = 190;
        const maxW = Math.round(window.innerWidth * 0.94);
        const clamped = Math.max(minW, Math.min(maxW, clientX));
        setMobileSidebarWidth(clamped);
      } else {
        const minW = 240;
        const maxW = Math.min(620, Math.round(window.innerWidth * 0.55));
        const clamped = Math.max(minW, Math.min(maxW, clientX));
        setDesktopSidebarWidth(clamped);
      }
    };

    const onMouseMove = (e) => handleMove(e.clientX);
    const onTouchMove = (e) => {
      if (isResizingRef.current && e.touches?.[0]) {
        e.preventDefault();
        handleMove(e.touches[0].clientX);
      }
    };
    const stopResize = () => {
      if (isResizingRef.current) {
        isResizingRef.current = false;
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        setTimeout(() => {
          if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
            mapRef.current.invalidateSize();
          }
        }, 100);
      }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', stopResize);
    window.addEventListener('touchmove', onTouchMove, { passive: false });
    window.addEventListener('touchend', stopResize);

    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', stopResize);
      window.removeEventListener('touchmove', onTouchMove);
      window.removeEventListener('touchend', stopResize);
    };
  }, []);

  const startResize = (e) => {
    e.stopPropagation();
    isResizingRef.current = true;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    if (!user || user.role === 'NGUOI_DUNG') {
      setEnableAI(false);
      setChartSourceOverride(null);
      const startD = getRelativeDate(-7);
      setFromDate(startD);
      setToDate(todayStr);
      setActiveMapDate(todayStr);
    } else if (user.role === 'ADMIN' || user.role === 'CHUYEN_GIA') {
      setEnableAI(true);
      setChartSourceOverride(null);
      const endD = getRelativeDate(7);
      setFromDate(todayStr);
      setToDate(endD);
      setActiveMapDate(todayStr);
    }
  }, [user]);

  useEffect(() => {
    fetch('/GanhGioiHCM.json')
      .then(res => res.json())
      .then(data => {
        if (data && Array.isArray(data.features)) {
          const normalizedFeatures = data.features.map((f, idx) => {
            const { tenPhuong, tenQuan } = extractAdminNames(f.properties || {}, f.geometry, idx);
            return {
              ...f,
              properties: {
                ...f.properties,
                ten_phuong: tenPhuong,
                ten_quan: tenQuan
              }
            };
          });
          setGeoBoundary({ ...data, features: normalizedFeatures });
        }
      })
      .catch(err => console.error('Lỗi tải GanhGioiHCM.json:', err));
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchMapValues = async () => {
      try {
        const res = await axios.get('/api/quan-trac', {
          params: {
            date: effectiveDateStr,
            metric: selectedMetric,
            mode: forecastMode,
            enable_ai: effectiveEnableAI
          },
          timeout: 6000
        });
        if (!isMounted) return;
        const rows = Array.isArray(res.data) ? res.data : [];
        const nextMap = {};
        rows.forEach(item => {
          if (item && item.area_id !== undefined && item.value !== null) {
            const norm = normalizeAreaId(item.area_id);
            const clean = norm.replace('_0', '');
            nextMap[norm] = Number(item.value);
            nextMap[clean] = Number(item.value);
            nextMap[String(item.area_id)] = Number(item.value);
          }
        });
        setRealValueMap(nextMap);
        setIsBackendConnected(true);
        setDbSource(`PostgreSQL PostGIS (${rows.length} khu vực)`);
      } catch (err) {
        if (!isMounted) return;
        setIsBackendConnected(false);
        setDbSource('Mất kết nối FastAPI');
      }
    };

    fetchMapValues();
    return () => { isMounted = false; };
  }, [effectiveDateStr, selectedMetric, forecastMode, effectiveEnableAI]);

  useEffect(() => {
    let isMounted = true;
    const targetAreaId = selectedPhuong ? normalizeAreaId(selectedPhuong.id) : 'ALL';

    const fetchTimeSeries = async () => {
      try {
        const res = await axios.get('/api/time-series', {
          params: {
            area_id: targetAreaId,
            metric: selectedMetric,
            mode: forecastMode
          },
          timeout: 6000
        });
        if (!isMounted) return;
        setTimeSeriesDb(Array.isArray(res.data) ? res.data : []);
      } catch (err) {
        if (!isMounted) return;
        setTimeSeriesDb([]);
      }
    };

    fetchTimeSeries();
    return () => { isMounted = false; };
  }, [selectedPhuong, selectedMetric, forecastMode]);

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      setChartSourceOverride(null);
      if (forecastMode === 'day') {
        setActiveMapDate(prev => {
          const d = new Date(prev);
          d.setDate(d.getDate() + 1);
          const next = d.toISOString().split('T')[0];
          if (new Date(next) > new Date(toDate)) {
            return fromDate;
          }
          return next;
        });
      } else {
        setActiveMapMonth(prev => {
          const [y, m] = prev.split('-').map(Number);
          const nextM = m + 1 > 12 ? 1 : m + 1;
          const nextY = m + 1 > 12 ? y + 1 : y;
          const next = `${nextY}-${String(nextM).padStart(2, '0')}`;
          if (next > toMonth) {
            return fromMonth;
          }
          return next;
        });
      }
    }, 1500);
    return () => clearInterval(timer);
  }, [isPlaying, forecastMode, fromDate, toDate, fromMonth, toMonth]);

  const getValueForFeature = (feature, index) => {
    if (!feature) return null;
    const props = feature.properties || {};
    const rawId = getRawFeatureId(props, index);
    const normId = normalizeAreaId(rawId);
    const cleanId = normId.replace('_0', '');

    if (realValueMap && Object.keys(realValueMap).length > 0) {
      if (realValueMap[normId] !== undefined) return realValueMap[normId];
      if (realValueMap[cleanId] !== undefined) return realValueMap[cleanId];
      if (realValueMap[String(rawId)] !== undefined) return realValueMap[String(rawId)];
    }
    return null;
  };

  // Mở quyền xem AI Dự báo cho cả khách (chưa đăng nhập) lẫn tài khoản đã đăng nhập
  const handleToggleAI = (checked) => {
    setChartSourceOverride(null);
    setEnableAI(checked);
    if (checked) {
      if (forecastMode === 'day') {
        setFromDate(todayStr);
        setToDate(getRelativeDate(7));
        setActiveMapDate(todayStr);
      } else {
        setFromMonth(currentMonthStr);
        setToMonth(getRelativeMonth(6));
        setActiveMapMonth(currentMonthStr);
      }
    } else {
      if (forecastMode === 'day') {
        const startD = getRelativeDate(-7);
        setFromDate(startD);
        setToDate(todayStr);
        setActiveMapDate(todayStr);
      } else {
        const startM = getRelativeMonth(-6);
        setFromMonth(startM);
        setToMonth(currentMonthStr);
        setActiveMapMonth(currentMonthStr);
      }
    }
  };

  const handleModeChange = (mode) => {
    setChartSourceOverride(null);
    setForecastMode(mode);
    if (mode === 'day') {
      if (enableAI) {
        setFromDate(todayStr);
        setToDate(getRelativeDate(7));
        setActiveMapDate(todayStr);
      } else {
        const startD = getRelativeDate(-7);
        setFromDate(startD);
        setToDate(todayStr);
        setActiveMapDate(todayStr);
      }
    } else {
      if (enableAI) {
        setFromMonth(currentMonthStr);
        setToMonth(getRelativeMonth(6));
        setActiveMapMonth(currentMonthStr);
      } else {
        const startM = getRelativeMonth(-6);
        setFromMonth(startM);
        setToMonth(currentMonthStr);
        setActiveMapMonth(currentMonthStr);
      }
    }
  };

  const handleSelectChartPoint = (timeLabel, payload) => {
    if (!timeLabel) return;
    setIsPlaying(false);

    if (forecastMode === 'day') {
      setActiveMapDate(timeLabel.slice(0, 10));
    } else {
      setActiveMapMonth(timeLabel.slice(0, 7));
    }

    if (payload) {
      if (payload['Quá khứ'] !== null && payload['Quá khứ'] !== undefined && (payload['AI Dự báo'] === null || payload['AI Dự báo'] === undefined)) {
        setChartSourceOverride('past');
      } else if (payload['AI Dự báo'] !== null && payload['AI Dự báo'] !== undefined) {
        setChartSourceOverride('forecast');
      } else {
        setChartSourceOverride(null);
      }
    }
  };

  const quanList = useMemo(() => {
    if (!geoBoundary?.features) return [];
    const setQuan = new Set();
    geoBoundary.features.forEach(f => {
      if (f.properties?.ten_quan) setQuan.add(f.properties.ten_quan);
    });
    return Array.from(setQuan).sort((a, b) => a.localeCompare(b, 'vi'));
  }, [geoBoundary]);

  const filteredPhuongList = useMemo(() => {
    if (!geoBoundary?.features) return [];
    const list = geoBoundary.features.map((f, idx) => {
      const props = f.properties || {};
      const rawId = getRawFeatureId(props, idx);
      const val = getValueForFeature(f, idx);
      return {
        id: normalizeAreaId(rawId),
        ten_phuong: props.ten_phuong || `Phường/Xã ${idx + 1}`,
        ten_quan: props.ten_quan || 'TP.HCM',
        value: val !== null && val !== undefined ? Number(val).toFixed(2) : 'N/A',
        rawVal: val !== null && val !== undefined ? Number(val) : null,
        featureIdx: idx,
        feature: f
      };
    });

    const filtered = list.filter(item => {
      const matchQuan = selectedQuan === 'ALL' || item.ten_quan === selectedQuan;
      const kw = searchTerm.trim().toLowerCase();
      const matchKw = !kw || item.ten_phuong.toLowerCase().includes(kw) || item.ten_quan.toLowerCase().includes(kw);
      return matchQuan && matchKw;
    });

    return filtered.sort((a, b) => {
      if (a.rawVal === null) return 1;
      if (b.rawVal === null) return -1;
      return selectedMetric === 'NDVI' ? a.rawVal - b.rawVal : b.rawVal - a.rawVal;
    });
  }, [geoBoundary, realValueMap, selectedQuan, searchTerm, selectedMetric]);

  const flyToArea = (feature, layer) => {
    if (mapRef.current && feature) {
      try {
        if (layer && typeof layer.getBounds === 'function') {
          mapRef.current.fitBounds(layer.getBounds(), { padding: [50, 50], maxZoom: 13 });
        }
      } catch (e) {
        console.warn(e);
      }
    }
  };

  const handleSelectArea = (item) => {
    setSelectedPhuong(item);
    if (geoJsonRef.current) {
      geoJsonRef.current.eachLayer(layer => {
        const p = layer.feature?.properties || {};
        if (p.ten_phuong === item.ten_phuong && p.ten_quan === item.ten_quan) {
          flyToArea(layer.feature, layer);
          if (typeof layer.openPopup === 'function') layer.openPopup();
          if (typeof layer.bringToFront === 'function') layer.bringToFront();
        }
      });
    }
  };

  const handleQuanChange = (newQuan) => {
    setSelectedQuan(newQuan);
    setSelectedPhuong(null);
    if (mapRef.current && geoBoundary?.features && newQuan !== 'ALL') {
      if (geoJsonRef.current) {
        const bounds = [];
        geoJsonRef.current.eachLayer(layer => {
          if (layer.feature?.properties?.ten_quan === newQuan && typeof layer.getBounds === 'function') {
            bounds.push(layer.getBounds());
          }
        });
        if (bounds.length > 0) {
          const combined = bounds.reduce((acc, b) => acc.extend(b), bounds[0]);
          mapRef.current.fitBounds(combined, { padding: [30, 30] });
        }
      }
    }
  };

  const chartData = useMemo(() => {
    if (!Array.isArray(timeSeriesDb) || timeSeriesDb.length === 0) return [];

    if (forecastMode === 'day') {
      const startLimit = enableAI ? getRelativeDate(-5) : fromDate;
      const endLimit = toDate;

      const grouped = {};
      timeSeriesDb.forEach(row => {
        const dStr = String(row.record_date).slice(0, 10);
        if (dStr < startLimit || dStr > endLimit) return;
        if (!grouped[dStr]) {
          grouped[dStr] = { time: dStr, 'Quá khứ': null, 'AI Dự báo': null, 'Quan trắc Quá khứ': null };
        }
        const numVal = Number(row.val);
        if (row.data_type === 'past') {
          grouped[dStr]['Quá khứ'] = numVal;
          grouped[dStr]['Quan trắc Quá khứ'] = numVal;
        } else if (row.data_type === 'forecast' && enableAI) {
          grouped[dStr]['AI Dự báo'] = numVal;
        }
      });

      const sorted = Object.values(grouped).sort((a, b) => a.time.localeCompare(b.time));

      if (enableAI && sorted.length > 1) {
        let lastPastIdx = -1;
        for (let i = 0; i < sorted.length; i++) {
          if (sorted[i]['Quá khứ'] !== null) lastPastIdx = i;
        }
        if (lastPastIdx !== -1 && sorted[lastPastIdx]['AI Dự báo'] === null) {
          sorted[lastPastIdx]['AI Dự báo'] = sorted[lastPastIdx]['Quá khứ'];
        }
      }

      return sorted;
    } else {
      const startM = enableAI ? getRelativeMonth(-4) : fromMonth;
      const endM = toMonth;

      const monthAgg = {};
      timeSeriesDb.forEach(row => {
        const mStr = String(row.record_date).slice(0, 7);
        if (mStr < startM || mStr > endM) return;
        if (!monthAgg[mStr]) {
          monthAgg[mStr] = { time: mStr, pastSum: 0, pastCnt: 0, fcSum: 0, fcCnt: 0 };
        }
        const numVal = Number(row.val);
        if (row.data_type === 'past') {
          monthAgg[mStr].pastSum += numVal;
          monthAgg[mStr].pastCnt += 1;
        } else if (row.data_type === 'forecast' && enableAI) {
          monthAgg[mStr].fcSum += numVal;
          monthAgg[mStr].fcCnt += 1;
        }
      });

      const sortedMonths = Object.values(monthAgg)
        .sort((a, b) => a.time.localeCompare(b.time))
        .map(m => {
          const pastAvg = m.pastCnt > 0 ? Number((m.pastSum / m.pastCnt).toFixed(3)) : null;
          const fcAvg = m.fcCnt > 0 ? Number((m.fcSum / m.fcCnt).toFixed(3)) : null;
          return {
            time: m.time,
            'Quá khứ': pastAvg,
            'Quan trắc Quá khứ': pastAvg,
            'AI Dự báo': fcAvg
          };
        });

      if (enableAI && sortedMonths.length > 1) {
        let lastPastIdx = -1;
        for (let i = 0; i < sortedMonths.length; i++) {
          if (sortedMonths[i]['Quá khứ'] !== null) lastPastIdx = i;
        }
        if (lastPastIdx !== -1 && sortedMonths[lastPastIdx]['AI Dự báo'] === null) {
          sortedMonths[lastPastIdx]['AI Dự báo'] = sortedMonths[lastPastIdx]['Quá khứ'];
        }
      }

      return sortedMonths;
    }
  }, [timeSeriesDb, forecastMode, enableAI, fromDate, toDate, fromMonth, toMonth]);

  const baseVal = useMemo(() => {
    if (selectedPhuong && selectedPhuong.value !== 'N/A') {
      return Number(selectedPhuong.value);
    }
    const vals = Object.values(realValueMap).filter(v => typeof v === 'number' && !isNaN(v));
    if (vals.length === 0) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }, [selectedPhuong, realValueMap]);

  const toggleDesktopSidebar = () => {
    setDesktopSidebarCollapsed(prev => !prev);
    setTimeout(() => {
      if (mapRef.current && typeof mapRef.current.invalidateSize === 'function') {
        mapRef.current.invalidateSize();
      }
    }, 100);
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      display: 'flex',
      flexDirection: 'column',
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
      fontFamily: "'Times New Roman', Times, serif",
      backgroundColor: '#f1f5f9'
    }}>
      <Navbar
        selectedMetric={selectedMetric}
        setSelectedMetric={setSelectedMetric}
        isBackendConnected={isBackendConnected}
        dbSource={dbSource}
        user={user}
        setUser={setUser}
        setShowLoginModal={setShowLoginModal}
        onOpenBulletin={() => setShowBulletinModal(true)}
        onOpenTreeBenefit={() => setShowTreeBenefitModal(true)}
        onOpenMapLayout={() => setShowMapLayoutModal(true)}
        onOpenAdminPanel={() => setShowAdminModal(true)}
      />

      <div style={{ display: 'flex', flex: 1, minHeight: 0, overflow: 'hidden', position: 'relative' }}>
        {/* Lớp nền mờ nhẹ trên Mobile */}
        {isMobile && mobileSidebarOpen && (
          <div
            onClick={() => setMobileSidebarOpen(false)}
            style={{
              position: 'fixed',
              inset: 0,
              backgroundColor: 'rgba(15, 23, 42, 0.25)',
              zIndex: 1400
            }}
          />
        )}

        {/* Thanh Sidebar (Co giãn tùy ý bằng chuột/cảm ứng + Cuộn dọc mượt mà trên Mobile) */}
        {((isMobile && mobileSidebarOpen) || (!isMobile && !desktopSidebarCollapsed)) && (
          <div style={isMobile ? {
            position: 'fixed',
            top: '76px',
            left: 0,
            bottom: 0,
            width: `${mobileSidebarWidth}px`,
            zIndex: 1500,
            boxShadow: '6px 0 24px rgba(0,0,0,0.35)',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#ffffff'
          } : {
            position: 'relative',
            display: 'flex',
            flexShrink: 0,
            width: `${desktopSidebarWidth}px`,
            height: '100%'
          }}>
            {isMobile && (
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '9px 12px',
                backgroundColor: '#0f172a',
                color: '#fff',
                borderBottom: '1px solid #334155',
                flexShrink: 0
              }}>
                <span style={{ fontWeight: 'bold', fontSize: '13.5px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  Bộ lọc & Xếp hạng
                </span>
                <button
                  onClick={() => setMobileSidebarOpen(false)}
                  style={{
                    backgroundColor: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '6px',
                    padding: '4px 9px',
                    fontSize: '12px',
                    fontWeight: 'bold',
                    cursor: 'pointer',
                    flexShrink: 0
                  }}
                >
                  ✕ Đóng
                </button>
              </div>
            )}

            {/* Vùng cuộn dọc chính cho toàn bộ nội dung Sidebar */}
            <div style={{
              flex: 1,
              minHeight: 0,
              overflowY: 'auto',
              overflowX: 'hidden',
              WebkitOverflowScrolling: 'touch',
              display: 'flex',
              flexDirection: 'column'
            }}>
              <Sidebar
                sidebarWidth={isMobile ? mobileSidebarWidth : desktopSidebarWidth}
                canUseAI={true}
                enableAI={enableAI}
                handleToggleAI={handleToggleAI}
                selectedMetric={selectedMetric}
                forecastMode={forecastMode}
                setForecastMode={handleModeChange}
                fromDate={fromDate}
                setFromDate={(val) => { setChartSourceOverride(null); setFromDate(val); setActiveMapDate(val); }}
                toDate={toDate}
                setToDate={setToDate}
                fromMonth={fromMonth}
                setFromMonth={(val) => { setChartSourceOverride(null); setFromMonth(val); setActiveMapMonth(val); }}
                toMonth={toMonth}
                setToMonth={setToMonth}
                todayStr={todayStr}
                currentMonthStr={currentMonthStr}
                selectedQuan={selectedQuan}
                handleQuanChange={(q) => { handleQuanChange(q); if (isMobile) setMobileSidebarOpen(false); }}
                quanList={quanList}
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                isPlaying={isPlaying}
                setIsPlaying={setIsPlaying}
                showAlert={showAlert}
                setShowAlert={setShowAlert}
                filteredPhuongList={filteredPhuongList}
                selectedPhuong={selectedPhuong}
                handleSelectArea={(item) => { handleSelectArea(item); if (isMobile) setMobileSidebarOpen(false); }}
                getValueForFeature={getValueForFeature}
              />
            </div>

            {/* Tay nắm kéo co giãn chiều rộng (Resize Handle) ở mép phải thanh bên */}
            <div
              onMouseDown={startResize}
              onTouchStart={startResize}
              title="Kéo sang trái/phải để điều chỉnh độ rộng bảng"
              style={{
                position: 'absolute',
                top: 0,
                right: isMobile ? '-14px' : '-4px',
                width: isMobile ? '22px' : '8px',
                height: '100%',
                cursor: 'col-resize',
                zIndex: 1600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                touchAction: 'none'
              }}
            >
              <div style={{
                width: isMobile ? '18px' : '4px',
                height: isMobile ? '46px' : '36px',
                backgroundColor: '#0f172a',
                border: '1.5px solid #38bdf8',
                borderRadius: '6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#38bdf8',
                fontSize: '11px',
                fontWeight: 'bold',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)'
              }}>
                {isMobile ? '↔' : '⋮'}
              </div>
            </div>
          </div>
        )}

        {/* Nút mở lại Sidebar trên máy tính nếu người dùng đã thu gọn hẳn */}
        {!isMobile && desktopSidebarCollapsed && (
          <button
            onClick={toggleDesktopSidebar}
            title="Mở bảng Bộ lọc & Xếp hạng"
            style={{
              position: 'absolute',
              top: '14px',
              left: '54px',
              zIndex: 1100,
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '1.5px solid #38bdf8',
              borderRadius: '8px',
              padding: '7px 12px',
              fontSize: '13px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ☰ Mở Bộ lọc
          </button>
        )}

        {/* Nút thu gọn nhanh Sidebar trên máy tính */}
        {!isMobile && !desktopSidebarCollapsed && (
          <button
            onClick={toggleDesktopSidebar}
            title="Thu gọn thanh bên để xem bản đồ rộng hơn"
            style={{
              position: 'absolute',
              top: '14px',
              left: `${desktopSidebarWidth + 54}px`,
              zIndex: 1100,
              backgroundColor: '#ffffff',
              color: '#0f172a',
              border: '1px solid #cbd5e1',
              borderRadius: '8px',
              padding: '6px 10px',
              fontSize: '12.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ◀ Thu gọn
          </button>
        )}

        {/* Nút mở Bảng điều khiển nổi trên màn hình điện thoại */}
        {isMobile && !mobileSidebarOpen && (
          <button
            onClick={() => setMobileSidebarOpen(true)}
            style={{
              position: 'absolute',
              bottom: showChart ? '205px' : '16px',
              left: '14px',
              zIndex: 1100,
              backgroundColor: '#0f172a',
              color: '#38bdf8',
              border: '2px solid #38bdf8',
              borderRadius: '10px',
              padding: '9px 14px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
              cursor: 'pointer',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ☰ Bộ lọc & Xếp hạng
          </button>
        )}

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
          <MapView
            showChart={showChart}
            setShowChart={setShowChart}
            showAlert={showAlert}
            setShowAlert={setShowAlert}
            phuongData={filteredPhuongList}
            handleSelectArea={handleSelectArea}
            mapDimension={mapDimension}
            setMapDimension={setMapDimension}
            selectedMetric={selectedMetric}
            effectiveDateStr={effectiveDateStr}
            fromDate={activeMapDate}
            fromMonth={activeMapMonth}
            forecastMode={forecastMode}
            selectedQuan={selectedQuan}
            realValueMap={realValueMap}
            geoBoundary={geoBoundary}
            getValueForFeature={getValueForFeature}
            mapRef={mapRef}
            geoJsonRef={geoJsonRef}
            selectedPhuong={selectedPhuong}
            setSelectedPhuong={setSelectedPhuong}
            flyToArea={flyToArea}
          />

          {showChart && (
            <EnvChart
              chartData={chartData}
              enableAI={enableAI}
              selectedMetric={selectedMetric}
              forecastMode={forecastMode}
              selectedPhuong={selectedPhuong}
              baseVal={baseVal}
              activeTime={forecastMode === 'day' ? activeMapDate : activeMapMonth}
              onSelectChartPoint={handleSelectChartPoint}
            />
          )}
        </div>
      </div>

      {showLoginModal && (
        <LoginModal
          onClose={() => setShowLoginModal(false)}
          onLoginSuccess={(loggedUser) => {
            setUser(loggedUser);
            setShowLoginModal(false);
          }}
        />
      )}

      {showBulletinModal && (
        <BulletinModal
          onClose={() => setShowBulletinModal(false)}
          selectedMetric={selectedMetric}
          effectiveDateStr={effectiveDateStr}
          forecastMode={forecastMode}
          enableAI={effectiveEnableAI}
          phuongData={filteredPhuongList}
          user={user}
        />
      )}

      {showTreeBenefitModal && (
        <TreeBenefitModal
          onClose={() => setShowTreeBenefitModal(false)}
          selectedPhuong={selectedPhuong}
          selectedMetric={selectedMetric}
          phuongData={filteredPhuongList}
        />
      )}

      {showMapLayoutModal && (
        <MapLayoutModal
          onClose={() => setShowMapLayoutModal(false)}
          geoBoundary={geoBoundary}
          realValueMap={realValueMap}
          selectedMetric={selectedMetric}
          effectiveDateStr={effectiveDateStr}
          enableAI={effectiveEnableAI}
          user={user}
        />
      )}

      {showAdminModal && (
        <AdminModal
          onClose={() => setShowAdminModal(false)}
          user={user}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <SafeErrorBoundary>
      <MainApp />
    </SafeErrorBoundary>
  );
}