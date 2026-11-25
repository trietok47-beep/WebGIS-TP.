import { METRIC_CONFIGS } from '../constants/mapConfigs';

const hexToRgb = (hex) => {
  const cleanHex = hex.replace('#', '');
  return {
    r: parseInt(cleanHex.substring(0, 2), 16),
    g: parseInt(cleanHex.substring(2, 4), 16),
    b: parseInt(cleanHex.substring(4, 6), 16)
  };
};

export const getColorByMetric = (val, metricType) => {
  // Nếu không có dữ liệu (ngày mây che) -> tô xám nhạt thay vì ép về 0 (màu cam)
  if (val === null || val === undefined || val === '' || isNaN(Number(val))) {
    return '#cbd5e1';
  }

  const v = Number(val);
  const config = METRIC_CONFIGS[metricType] || METRIC_CONFIGS.NDVI;
  const palette = config.palette;

  if (v <= palette[0].val) return palette[0].hex;
  if (v >= palette[palette.length - 1].val) return palette[palette.length - 1].hex;

  for (let i = 0; i < palette.length - 1; i++) {
    const c1 = palette[i];
    const c2 = palette[i + 1];

    if (v >= c1.val && v <= c2.val) {
      const ratio = (v - c1.val) / (c2.val - c1.val);
      const rgb1 = hexToRgb(c1.hex);
      const rgb2 = hexToRgb(c2.hex);

      const r = Math.round(rgb1.r + ratio * (rgb2.r - rgb1.r));
      const g = Math.round(rgb1.g + ratio * (rgb2.g - rgb1.g));
      const b = Math.round(rgb1.b + ratio * (rgb2.b - rgb1.b));

      return `rgb(${r}, ${g}, ${b})`;
    }
  }
  return palette[0].hex;
};