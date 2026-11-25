export const getDistrictByCoordinates = (feature, index) => {
  const props = feature.properties || {};
  let p = props.ten_phuong || props.area_name || props.NAME_3 || props.ward || props.Name || props.ten_xa;
  let q = props.ten_quan || props.district_name || props.NAME_2 || props.district || props.quan_huyen;

  if (!q || q.trim() === '' || q === 'TP. Hồ Chí Minh' || q.includes('Quận / Huyện')) {
    let coords = [];
    try {
      if (feature.geometry.type === 'Polygon') coords = feature.geometry.coordinates[0];
      else if (feature.geometry.type === 'MultiPolygon') coords = feature.geometry.coordinates[0][0];
    } catch (err) {
      coords = [];
    }

    let avgLng = 106.65, avgLat = 10.75;
    if (coords.length > 0) {
      let sumLng = 0, sumLat = 0;
      coords.forEach(c => {
        sumLng += c[0];
        sumLat += c[1];
      });
      avgLng = sumLng / coords.length;
      avgLat = sumLat / coords.length;
    }

    // 1. Khu vực Bà Rịa - Vũng Tàu (Phía Đông Nam)
    if (avgLng > 107.00 || avgLat < 10.35) {
      if (avgLat < 10.42 && avgLng < 107.18) q = 'TP. Vũng Tàu';
      else if (avgLat < 10.55 && avgLng < 107.25) q = 'TP. Bà Rịa';
      else if (avgLng < 107.12) q = 'TX. Phú Mỹ';
      else if (avgLat > 10.60) q = 'Huyện Châu Đức';
      else if (avgLng > 107.35) q = 'Huyện Xuyên Mộc';
      else q = 'Huyện Long Đất';
    }
    // 2. Khu vực Bình Dương (Phía Bắc)
    else if (avgLat > 10.89 && avgLng > 106.62) {
      if (avgLat < 10.96 && avgLng >= 106.72) q = 'TP. Dĩ An';
      else if (avgLat < 10.97 && avgLng < 106.72) q = 'TP. Thuận An';
      else if (avgLat < 11.05 && avgLng < 106.72) q = 'TP. Thủ Dầu Một';
      else if (avgLat < 11.12 && avgLng >= 106.72) q = 'TP. Tân Uyên';
      else if (avgLat < 11.20 && avgLng < 106.68) q = 'TP. Bến Cát';
      else if (avgLng >= 106.74) q = 'Huyện Bắc Tân Uyên';
      else if (avgLng < 106.58) q = 'Huyện Dầu Tiếng';
      else if (avgLat > 11.22) q = 'Huyện Bàu Bàng';
      else q = 'Huyện Phú Giáo';
    }
    // 3. TP.HCM - Ngoại thành & Ven biển
    else if (avgLat < 10.62) {
      q = 'Huyện Cần Giờ';
    } else if (avgLat < 10.71 && avgLng >= 106.69) {
      q = 'Huyện Nhà Bè';
    } else if (avgLat < 10.75 && avgLng < 106.60) {
      q = 'Huyện Bình Chánh';
    } else if (avgLat > 10.93 && avgLng <= 106.62) {
      q = 'Huyện Củ Chi';
    } else if (avgLat > 10.85 && avgLng < 106.63) {
      q = 'Huyện Hóc Môn';
    }
    // 4. TP. Thủ Đức
    else if (avgLng >= 106.72 && avgLat >= 10.75) {
      q = 'TP. Thủ Đức';
    }
    // 5. Các Quận Nội thành TP.HCM
    else if (avgLat < 10.755 && avgLng >= 106.695) {
      q = 'Quận 7';
    } else if (avgLat < 10.752 && avgLng < 106.695) {
      q = 'Quận 8';
    } else if (avgLng < 106.618) {
      q = 'Quận Bình Tân';
    } else if (avgLat > 10.845 && avgLng >= 106.63) {
      q = 'Quận 12';
    } else if (avgLat > 10.822 && avgLng >= 106.65) {
      q = 'Quận Gò Vấp';
    } else if (avgLat > 10.795 && avgLng >= 106.69) {
      q = 'Quận Bình Thạnh';
    } else if (avgLat > 10.792 && avgLng >= 106.672 && avgLng < 106.69) {
      q = 'Quận Phú Nhuận';
    } else if (avgLat > 10.785 && avgLng >= 106.642 && avgLng < 106.672) {
      q = 'Quận Tân Bình';
    } else if (avgLat > 10.775 && avgLng >= 106.618 && avgLng < 106.642) {
      q = 'Quận Tân Phú';
    } else if (avgLat >= 10.752 && avgLat < 10.768 && avgLng >= 106.695) {
      q = 'Quận 4';
    } else if (avgLat >= 10.768 && avgLat <= 10.795 && avgLng >= 106.69) {
      q = 'Quận 1';
    } else if (avgLat >= 10.772 && avgLat <= 10.792 && avgLng >= 106.675 && avgLng < 106.69) {
      q = 'Quận 3';
    } else if (avgLat >= 10.762 && avgLat < 10.778 && avgLng >= 106.662 && avgLng < 106.675) {
      q = 'Quận 10';
    } else if (avgLat >= 10.758 && avgLat < 10.775 && avgLng >= 106.642 && avgLng < 106.662) {
      q = 'Quận 11';
    } else if (avgLat >= 10.748 && avgLat < 10.762 && avgLng >= 106.655 && avgLng < 106.685) {
      q = 'Quận 5';
    } else {
      q = 'Quận 6';
    }
  }

  const rawId = props['system:index'] || props.id || props.area_id || `${index}_0`;
  const cleanId = String(rawId).replace('_0', '');

  if (!p || p.trim() === '' || p.includes('_0')) {
    p = `Khu vực ${cleanId}`;
  }

  return { quan: q, phuong: p };
};