import React, { useState, useEffect, useMemo } from 'react';

const TREE_SCENARIOS = [
  {
    id: 'all_default',
    name: 'Tổng hợp tất cả lợi ích (Chuẩn đô thị TP.HCM)',
    desc: 'Mô hình chuẩn 1.000 cây xanh đô thị trong 10 năm.',
    params: {
      N: 1000,
      T: 10,
      C: 20,
      B: 12,
      S: 15,
      R: 300,
      f: 1.0,
      P1: 300000,
      P2: 1000,
      P3: 10000,
      C_invest: 0,
      C_maint: 0
    }
  },
  {
    id: 'street_cooling',
    name: 'Kịch bản 1: Cây bóng mát đường phố & Giảm nhiệt LST',
    desc: 'Cây tán rộng (Sao đen, Dầu rái) cho khu vực nhiệt độ bề mặt cao.',
    params: {
      N: 2500,
      T: 15,
      C: 24,
      B: 15,
      S: 22,
      R: 380,
      f: 0.85,
      P1: 300000,
      P2: 1000,
      P3: 10000,
      C_invest: 125000000,
      C_maint: 45000000
    }
  },
  {
    id: 'park_neighborhood',
    name: 'Kịch bản 2: Công viên bỏ túi & Mảng xanh khu dân cư',
    desc: 'Phủ xanh phường có chỉ số thực vật NDVI thấp (< 0.30).',
    params: {
      N: 800,
      T: 10,
      C: 18,
      B: 10,
      S: 12,
      R: 260,
      f: 0.9,
      P1: 300000,
      P2: 1000,
      P3: 10000,
      C_invest: 40000000,
      C_maint: 15000000
    }
  },
  {
    id: 'mangrove_cangio',
    name: 'Kịch bản 3: Phục hồi rừng ngập mặn Cần Giờ',
    desc: 'Mật độ cao, tối đa hóa hấp thụ CO₂ và giữ nước ven biển.',
    params: {
      N: 10000,
      T: 20,
      C: 32,
      B: 22,
      S: 10,
      R: 450,
      f: 0.75,
      P1: 350000,
      P2: 1200,
      P3: 10000,
      C_invest: 350000000,
      C_maint: 120000000
    }
  },
  {
    id: 'net_economic',
    name: 'Kịch bản 4: Hạch toán lợi ích ròng (Có trừ chi phí)',
    desc: 'Tính lợi ích kinh tế ròng sau khi trừ vốn đầu tư & bảo dưỡng.',
    params: {
      N: 1000,
      T: 10,
      C: 20,
      B: 12,
      S: 15,
      R: 300,
      f: 0.95,
      P1: 300000,
      P2: 1000,
      P3: 10000,
      C_invest: 50000000,
      C_maint: 30000000
    }
  }
];

function formatNumberVN(num, decimals = 0) {
  if (num === null || num === undefined || isNaN(num)) return '0';
  return Number(num).toLocaleString('vi-VN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  });
}

function ParamRow({ icon, label, value, onChange, unit, step = 1, min = 0, max, labelColor = '#1e293b' }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: '8px',
      padding: '3.5px 0'
    }}>
      <span style={{
        fontSize: '13.5px',
        fontWeight: 'bold',
        color: labelColor,
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        gap: '5px'
      }}>
        <span style={{ width: '18px', textAlign: 'center', display: 'inline-block' }}>{icon}</span>
        <span>{label}</span>
      </span>

      <div style={{
        display: 'flex',
        alignItems: 'center',
        width: '172px',
        flexShrink: 0,
        border: '1.5px solid #cbd5e1',
        borderRadius: '6px',
        backgroundColor: '#ffffff',
        overflow: 'hidden'
      }}>
        <input
          type="number"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          style={{
            flex: 1,
            minWidth: 0,
            border: 'none',
            outline: 'none',
            padding: '4px 7px',
            fontSize: '13.5px',
            fontWeight: 'bold',
            color: '#0f172a',
            textAlign: 'right',
            fontFamily: "'Times New Roman', Times, serif",
            backgroundColor: 'transparent'
          }}
        />
        <span style={{
          padding: '4px 7px',
          backgroundColor: '#f1f5f9',
          borderLeft: '1px solid #e2e8f0',
          fontSize: '11.5px',
          fontWeight: 'bold',
          color: '#475569',
          whiteSpace: 'nowrap'
        }}>
          {unit}
        </span>
      </div>
    </div>
  );
}

export default function TreeBenefitModal({
  onClose,
  selectedPhuong,
  selectedMetric,
  phuongData = []
}) {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 860);
  const [scenarioId, setScenarioId] = useState('all_default');
  const [showAdvancedParams, setShowAdvancedParams] = useState(false);
  const [highlightPulse, setHighlightPulse] = useState(false);

  const [N, setN] = useState(1000);
  const [T, setT] = useState(10);
  const [C, setC] = useState(20);
  const [B, setB] = useState(12);
  const [S, setS] = useState(15);
  const [R, setR] = useState(300);
  const [f, setF] = useState(1.0);
  const [P1, setP1] = useState(300000);
  const [P2, setP2] = useState(1000);
  const [P3, setP3] = useState(10000);
  const [cInvest, setCInvest] = useState(0);
  const [cMaint, setCMaint] = useState(0);

  const [targetAreaName, setTargetAreaName] = useState(
    selectedPhuong ? `${selectedPhuong.ten_phuong} (${selectedPhuong.ten_quan})` : 'Toàn TP. Hồ Chí Minh'
  );

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 860);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const triggerPulse = () => {
    setHighlightPulse(true);
    setTimeout(() => setHighlightPulse(false), 350);
  };

  const handleSelectScenario = (newId) => {
    setScenarioId(newId);
    const found = TREE_SCENARIOS.find((s) => s.id === newId);
    if (found) {
      const p = found.params;
      setN(p.N);
      setT(p.T);
      setC(p.C);
      setB(p.B);
      setS(p.S);
      setR(p.R);
      setF(p.f);
      setP1(p.P1);
      setP2(p.P2);
      setP3(p.P3);
      setCInvest(p.C_invest);
      setCMaint(p.C_maint);
      if (p.C_invest > 0 || p.C_maint > 0 || p.f < 1) {
        setShowAdvancedParams(true);
      }
      triggerPulse();
    }
  };

  const results = useMemo(() => {
    const nVal = Math.max(0, Number(N) || 0);
    const tVal = Math.max(0, Number(T) || 0);
    const cVal = Math.max(0, Number(C) || 0);
    const bVal = Math.max(0, Number(B) || 0);
    const sVal = Math.max(0, Number(S) || 0);
    const rVal = Math.max(0, Number(R) || 0);
    const fVal = Math.min(1, Math.max(0, Number(f) || 0));
    const p1Val = Math.max(0, Number(P1) || 0);
    const p2Val = Math.max(0, Number(P2) || 0);
    const p3Val = Math.max(0, Number(P3) || 0);
    const investVal = Math.max(0, Number(cInvest) || 0);
    const maintVal = Math.max(0, Number(cMaint) || 0);

    const co2Total = (nVal * cVal * tVal) / 1000;
    const o2Total = co2Total * 0.727;
    const biomassTotal = nVal * bVal * tVal;
    const shadeArea = nVal * sVal * fVal;
    const waterRetained = (nVal * rVal * tVal) / 1000;

    const g1 = co2Total * p1Val;
    const g2 = biomassTotal * p2Val;
    const g3 = waterRetained * p3Val;
    const gGross = g1 + g2 + g3;
    const gNet = gGross - investVal - maintVal;
    const estTempDrop = Math.min(3.5, (shadeArea / 10000) * 0.12);

    return {
      co2Total,
      o2Total,
      biomassTotal,
      shadeArea,
      waterRetained,
      g1,
      g2,
      g3,
      gNet,
      hasCost: investVal > 0 || maintVal > 0,
      estTempDrop
    };
  }, [N, T, C, B, S, R, f, P1, P2, P3, cInvest, cMaint]);

  const currentScenario = TREE_SCENARIOS.find((s) => s.id === scenarioId);

  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.65)',
        zIndex: 3000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: isMobile ? '8px' : '16px',
        fontFamily: "'Times New Roman', Times, serif"
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          maxWidth: '980px',
          maxHeight: '94vh',
          backgroundColor: '#f1f5f9',
          borderRadius: '14px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          boxShadow: '0 24px 55px rgba(0,0,0,0.45)',
          border: '2px solid #15803d'
        }}
      >
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, #14532d 0%, #166534 55%, #15803d 100%)',
          color: '#ffffff',
          padding: '11px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: '10px',
          flexShrink: 0
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '22px' }}>🌳</span>
            <div>
              <div style={{ fontSize: isMobile ? '16.5px' : '19.5px', fontWeight: 'bold', lineHeight: 1.15 }}>
                Tính lợi ích trồng cây xanh đô thị
              </div>
              <div style={{ fontSize: '12.5px', color: '#bbf7d0' }}>
                Chọn kịch bản & nhập thông số bên trái → Xem ngay kết quả ước tính bên phải
              </div>
            </div>
          </div>

          <button
            onClick={onClose}
            style={{
              backgroundColor: 'rgba(255,255,255,0.16)',
              color: '#ffffff',
              border: '1px solid rgba(255,255,255,0.35)',
              borderRadius: '8px',
              padding: '5px 12px',
              fontSize: '13.5px',
              fontWeight: 'bold',
              cursor: 'pointer',
              fontFamily: "'Times New Roman', Times, serif"
            }}
          >
            ✕ Đóng
          </button>
        </div>

        {/* Nội dung chia 2 cột ngang: Trái (Nhập liệu) | Phải (Kết quả tính toán) */}
        <div style={{
          flex: 1,
          overflowY: 'auto',
          WebkitOverflowScrolling: 'touch',
          padding: isMobile ? '12px' : '16px 18px',
          display: 'grid',
          gridTemplateColumns: isMobile ? '1fr' : '1.05fr 0.95fr',
          gap: '16px',
          alignItems: 'start'
        }}>
          {/* =============================================================== */}
          {/* CỘT TRÁI: CHỌN KỊCH BẢN & THÔNG SỐ ĐẦU VÀO                      */}
          {/* =============================================================== */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            padding: '14px 16px',
            border: '1px solid #cbd5e1',
            boxShadow: '0 2px 8px rgba(0,0,0,0.04)',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13.5px', color: '#14532d', marginBottom: '4px' }}>
                📋 Kịch bản tính toán:
              </label>
              <select
                value={scenarioId}
                onChange={(e) => handleSelectScenario(e.target.value)}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  borderRadius: '8px',
                  border: '1.5px solid #16a34a',
                  backgroundColor: '#f0fdf4',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  color: '#14532d',
                  fontFamily: "'Times New Roman', Times, serif",
                  outline: 'none'
                }}
              >
                {TREE_SCENARIOS.map((sc) => (
                  <option key={sc.id} value={sc.id}>{sc.name}</option>
                ))}
              </select>
              {currentScenario && (
                <div style={{ fontSize: '12px', color: '#15803d', fontStyle: 'italic', marginTop: '4px' }}>
                  {currentScenario.desc}
                </div>
              )}
            </div>

            <div>
              <label style={{ display: 'block', fontWeight: 'bold', fontSize: '13.5px', color: '#334155', marginBottom: '4px' }}>
                📍 Khu vực áp dụng:
              </label>
              <select
                value={targetAreaName}
                onChange={(e) => setTargetAreaName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '6px 10px',
                  borderRadius: '8px',
                  border: '1px solid #cbd5e1',
                  fontSize: '13.5px',
                  fontWeight: 'bold',
                  color: '#0f172a',
                  fontFamily: "'Times New Roman', Times, serif"
                }}
              >
                <option value="Toàn TP. Hồ Chí Minh">Toàn TP. Hồ Chí Minh (168 phường/xã)</option>
                {selectedPhuong && (
                  <option value={`${selectedPhuong.ten_phuong} (${selectedPhuong.ten_quan})`}>
                    ★ Đang chọn: {selectedPhuong.ten_phuong} ({selectedPhuong.ten_quan}) — {selectedMetric}: {selectedPhuong.value}
                  </option>
                )}
                {phuongData.slice(0, 40).map((p) => (
                  <option key={p.id} value={`${p.ten_phuong} (${p.ten_quan})`}>
                    {p.ten_phuong} ({p.ten_quan}) — {selectedMetric}: {p.value}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Thông số quy mô & sinh trưởng
              </div>
              <ParamRow icon="🌳" label="Số cây (N)" value={N} onChange={setN} unit="cây" />
              <ParamRow icon="📅" label="Số năm (T)" value={T} onChange={setT} unit="năm" min={1} />
              <ParamRow icon="☁️" label="CO₂ hấp thụ (C)" value={C} onChange={setC} unit="kg/cây/năm" step={0.5} />
              <ParamRow icon="🌿" label="Sinh khối (B)" value={B} onChange={setB} unit="kg/cây/năm" step={0.5} />
              <ParamRow icon="⛱️" label="Diện tích tán (S)" value={S} onChange={setS} unit="m²/cây" step={0.5} />
              <ParamRow icon="💧" label="Nước giữ lại (R)" value={R} onChange={setR} unit="lít/cây/năm" step={10} />
            </div>

            <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                Đơn giá quy đổi kinh tế
              </div>
              <ParamRow icon="💰" label="Giá carbon (P₁)" labelColor="#166534" value={P1} onChange={setP1} unit="đ/tấn CO₂" step={10000} />
              <ParamRow icon="🪵" label="Giá sinh khối (P₂)" labelColor="#166534" value={P2} onChange={setP2} unit="đ/kg" step={100} />
              <ParamRow icon="🚰" label="Giá trị nước (P₃)" labelColor="#166534" value={P3} onChange={setP3} unit="đ/m³" step={1000} />

              <button
                type="button"
                onClick={() => setShowAdvancedParams(!showAdvancedParams)}
                style={{
                  marginTop: '6px',
                  width: '100%',
                  padding: '5px 8px',
                  backgroundColor: '#f8fafc',
                  border: '1px solid #cbd5e1',
                  borderRadius: '6px',
                  fontSize: '12.5px',
                  fontWeight: 'bold',
                  color: '#334155',
                  cursor: 'pointer',
                  fontFamily: "'Times New Roman', Times, serif"
                }}
              >
                {showAdvancedParams ? '▲ Ẩn hệ số tán (f) & Chi phí đầu tư' : '▼ Mở hệ số tán (f) & Chi phí đầu tư'}
              </button>

              {showAdvancedParams && (
                <div style={{ marginTop: '6px', paddingTop: '6px', borderTop: '1px dashed #e2e8f0' }}>
                  <ParamRow icon="📐" label="Hệ số tán (f)" value={f} onChange={setF} unit="0 – 1" step={0.05} max={1} />
                  <ParamRow icon="🏗️" label="C đầu tư" labelColor="#991b1b" value={cInvest} onChange={setCInvest} unit="đồng" step={1000000} />
                  <ParamRow icon="🛠️" label="C bảo dưỡng" labelColor="#991b1b" value={cMaint} onChange={setCMaint} unit="đồng" step={1000000} />
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={triggerPulse}
              style={{
                marginTop: '2px',
                width: '100%',
                padding: '9px',
                backgroundColor: '#15803d',
                color: '#ffffff',
                border: 'none',
                borderRadius: '8px',
                fontSize: '15px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 6px rgba(21,128,61,0.3)',
                fontFamily: "'Times New Roman', Times, serif"
              }}
            >
              📊 Tính lợi ích ngay
            </button>
          </div>

          {/* =============================================================== */}
          {/* CỘT PHẢI: KẾT QUẢ ƯỚC TÍNH (LUÔN HIỂN THỊ RÕ NGAY KHI MỞ)      */}
          {/* =============================================================== */}
          <div style={{
            backgroundColor: '#ffffff',
            borderRadius: '12px',
            border: '2px solid #22c55e',
            overflow: 'hidden',
            boxShadow: highlightPulse ? '0 0 0 4px rgba(34, 197, 94, 0.35)' : '0 4px 14px rgba(22, 101, 52, 0.1)',
            transition: 'box-shadow 0.25s ease',
            display: 'flex',
            flexDirection: 'column'
          }}>
            <div style={{
              backgroundColor: '#166534',
              color: '#ffffff',
              padding: '10px 16px',
              fontWeight: 'bold',
              fontSize: '16px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px'
            }}>
              <span>📊 Kết quả ước tính</span>
              <span style={{
                fontSize: '12px',
                backgroundColor: 'rgba(255,255,255,0.18)',
                padding: '2px 8px',
                borderRadius: '12px',
                color: '#dcfce7'
              }}>
                Tự động cập nhật
              </span>
            </div>

            <div style={{
              padding: '8px 16px',
              backgroundColor: '#f0fdf4',
              borderBottom: '1px solid #bbf7d0',
              fontSize: '13px',
              color: '#14532d'
            }}>
              📍 Khu vực: <b>{targetAreaName}</b>
            </div>

            {/* Danh sách 8 chỉ tiêu sinh thái & kinh tế */}
            <div style={{ padding: '6px 16px' }}>
              {[
                { icon: '☁️', label: 'CO₂ hấp thụ', val: `${formatNumberVN(results.co2Total, 2)} tấn`, color: '#0f172a' },
                { icon: '🍃', label: 'O₂ tạo ra', val: `${formatNumberVN(results.o2Total, 2)} tấn`, color: '#0f172a' },
                { icon: '🌿', label: 'Sinh khối tăng thêm', val: `${formatNumberVN(results.biomassTotal, 0)} kg`, color: '#0f172a' },
                { icon: '⛱️', label: 'Diện tích bóng mát', val: `${formatNumberVN(results.shadeArea, 0)} m²`, color: '#0f172a' },
                { icon: '💧', label: 'Nước mưa giữ lại', val: `${formatNumberVN(results.waterRetained, 0)} m³`, color: '#0f172a' },
                { icon: '🪙', label: 'Giá trị carbon', val: `${formatNumberVN(results.g1, 0)} đ`, color: '#15803d' },
                { icon: '🪵', label: 'Giá trị sinh khối', val: `${formatNumberVN(results.g2, 0)} đ`, color: '#15803d' },
                { icon: '🚰', label: 'Giá trị nước mưa giữ lại', val: `${formatNumberVN(results.g3, 0)} đ`, color: '#15803d' }
              ].map((row, idx) => (
                <div
                  key={idx}
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: '8px 0',
                    borderBottom: idx < 7 ? '1px dashed #e2e8f0' : 'none',
                    fontSize: '14.5px'
                  }}
                >
                  <span style={{ color: '#334155', fontWeight: 'bold' }}>
                    {row.icon} {row.label}
                  </span>
                  <span style={{ color: row.color, fontWeight: 'bold', fontSize: '15.5px' }}>
                    {row.val}
                  </span>
                </div>
              ))}
            </div>

            {/* Hộp tác động vi khí hậu GIS */}
            <div style={{
              margin: '4px 16px 12px 16px',
              padding: '9px 12px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '8px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontSize: '13.5px',
              color: '#1e40af'
            }}>
              <span>🌡️ Hỗ trợ giảm nhiệt bề mặt (LST):</span>
              <b>~{formatNumberVN(results.estTempDrop, 2)} °C</b>
            </div>

            {/* Khối Tổng lợi ích quy đổi */}
            <div style={{
              padding: '14px 16px',
              backgroundColor: '#dcfce7',
              borderTop: '2px solid #22c55e',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '8px',
              flexWrap: 'wrap'
            }}>
              <div style={{ fontWeight: 'bold', fontSize: '15.5px', color: '#14532d' }}>
                💵 Tổng lợi ích quy đổi {results.hasCost ? '(ròng)' : '(giả định)'}
              </div>
              <div style={{
                fontWeight: 'bold',
                fontSize: '21px',
                color: results.gNet >= 0 ? '#14532d' : '#dc2626'
              }}>
                {formatNumberVN(results.gNet, 0)} đ
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}