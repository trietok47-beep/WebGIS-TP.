export const WEB_TITLE = "HỆ THỐNG GIÁM SÁT NHIỆT ĐỘ BỀ MẶT – LỚP PHỦ THỰC VẬT – MỨC ĐỘ KHÔ HẠN TẠI TP.HCM";

export const METRIC_CONFIGS = {
 NDVI: {
    name: 'NDVI (Thực vật)',
    unit: '',
    domain: [-0.2, 1.0],
    defaultVal: null,
    palette: [
      { val: -0.20, hex: '#FF0000' },
      { val: 0.15, hex: '#FF7F00' },
      { val: 0.3,  hex: '#FFFF00' },
      { val: 0.45,  hex: '#ADFF2F' },
      { val: 0.65,  hex: '#00FF00' },
      { val: 0.75,  hex: '#00FFFF' },
      { val: 0.8,  hex: '#007FFF' },
      { val: 1.00,  hex: '#0000FF' }
    ]
  },
  LST: {
    name: 'LST (Nhiệt độ °C)',
    unit: 'Độ C (°C)',
    domain: [20, 45],
    defaultVal: null,
    palette: [
      { val: 20.0, hex: '#0000FF' },
      { val: 24.0, hex: '#0066FF' },
      { val: 26.0, hex: '#00FFFF' },
      { val: 28.0, hex: '#00FF00' },
      { val: 31.0, hex: '#FFFF00' },
      { val: 38.0, hex: '#FFCC00' },
      { val: 41.0, hex: '#FF6600' },
      { val: 45.0, hex: '#FF0000' }
    ]
  },
  TVDI: {
    name: 'TVDI (Khô hạn)',
    unit: 'Chỉ số (0.0 - 1.0)',
    domain: [0.0, 1.0],
    defaultVal: null,
    palette: [
      { val: 0.00, hex: '#066B00' },
      { val: 0.15, hex: '#0BC400' },
      { val: 0.30, hex: '#0CE100' },
      { val: 0.45, hex: '#00FF00' },
      { val: 0.55, hex: '#FFFF00' },
      { val: 0.70, hex: '#FFCC00' },
      { val: 0.85, hex: '#FF6600' },
      { val: 1.00, hex: '#FF0000' }
    ]
  }
};

// NGƯỠNG ĐÁNH GIÁ MỨC ĐỘ NGUY CƠ CAO CHO TỪNG CHỈ SỐ
export const ALERT_THRESHOLDS = {
  NDVI: {
    title: 'Suy giảm thảm thực vật / Đô thị hóa cao',
    conditionText: 'NDVI < 0.15',
    checkDanger: (val) => val !== null && val !== undefined && Number(val) < 0.15,
    sortAsc: true,
    advice: 'Tăng cường mảng xanh, cây xanh đường phố và hạn chế bê tông hóa.'
  },
  LST: {
    title: 'Đảo nhiệt đô thị / Nắng nóng gay gắt',
    conditionText: 'LST > 38.0 °C',
    checkDanger: (val) => val !== null && val !== undefined && Number(val) > 38.0,
    sortAsc: false,
    advice: 'Cảnh báo sốc nhiệt ngoài trời, cần giải pháp làm mát bề mặt và phun sương.'
  },
  TVDI: {
    title: 'Hạn hán nghiêm trọng / Thiếu hụt độ ẩm đất',
    conditionText: 'TVDI > 0.70',
    checkDanger: (val) => val !== null && val !== undefined && Number(val) > 0.70,
    sortAsc: false,
    advice: 'Nguy cơ cháy cao và thiếu nước tưới tiêu, cần điều tiết nguồn nước.'
  }
};