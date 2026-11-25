export const formatVNMonth = (ymStr) => {
  if (!ymStr) return '';
  const [y, m] = ymStr.split('-');
  return `Tháng ${m}/${y}`;
};

export const formatVNDate = (dStr) => {
  if (!dStr) return '';
  const [y, m, d] = dStr.split('-');
  return `${d}/${m}/${y}`;
};

export const getLastDayOfMonthStr = (ymStr) => {
  if (!ymStr) return '';
  const [y, m] = ymStr.split('-').map(Number);
  const lastDay = new Date(y, m, 0).getDate();
  return `${ymStr}-${String(lastDay).padStart(2, '0')}`;
};