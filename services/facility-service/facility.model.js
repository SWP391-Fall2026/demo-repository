/**
 * FACILITY SERVICE - DATA MODEL
 */

const facilities = [
  { id: 'HN-CG', name: 'Hà Nội - Cơ sở Cầu Giấy (120 Duy Tân)', totalUnits: 120, occupied: 98, manager: 'Phạm Hải Đăng', phone: '0934.567.890' },
  { id: 'HCM-Q7', name: 'TP.HCM - Cơ sở Quận 7 (Nguyễn Thị Thập)', totalUnits: 140, occupied: 111, manager: 'Trần Quang Vinh', phone: '0978.889.900' },
  { id: 'HN-NTL', name: 'Hà Nội - Cơ sở Nam Từ Liêm (Khu CNC)', totalUnits: 100, occupied: 75, manager: 'Nguyễn Minh Quân', phone: '0912.456.789' },
  { id: 'HCM-TB', name: 'TP.HCM - Cơ sở Tân Bình (Cộng Hòa)', totalUnits: 110, occupied: 81, manager: 'Võ Văn Hùng', phone: '0903.654.321' },
  { id: 'DN-HC', name: 'Đà Nẵng - Cơ sở Hải Châu (Bạch Đằng)', totalUnits: 90, occupied: 67, manager: 'Lê Thanh Tùng', phone: '0905.123.789' }
];

const unitTypes = [
  { code: 'S', name: 'Kho Nhỏ (Small S)', size: '1 - 3 m²', volume: '4.9 m³', price: 800000, desc: 'Thích hợp vali, tài liệu, 8 thùng carton.' },
  { code: 'M', name: 'Kho Tiêu Chuẩn (Medium M)', size: '4 - 8 m²', volume: '12.5 m³', price: 1450000, desc: 'Chứa đồ gia đình 1 phòng ngủ, xe máy, bàn ghế, 25 thùng.' },
  { code: 'L', name: 'Kho Lớn (Large L)', size: '> 9 m²', volume: '25.0 m³', price: 2800000, desc: 'Phù hợp kho hàng TMĐT, thiết bị văn phòng, pallet hàng.' },
  { code: 'CLIMATE', name: 'Kho Mát Điều Hòa', size: '6.0 m²', volume: '15.0 m³', price: 2200000, desc: 'Kiểm soát nhiệt độ & độ ẩm chuẩn 55-65% ISO.' }
];

const units = [
  { code: 'A-101', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null },
  { code: 'A-102', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Trần Văn Bảo' },
  { code: 'A-103', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Lê Hoàng Nam' },
  { code: 'A-104', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Alpha Logistics' },
  { code: 'A-105', type: 'S', size: '3.0 m²', status: 'available', price: 950000, tenant: null },
  { code: 'A-106', type: 'M', size: '5.0 m²', status: 'occupied', price: 1450000, tenant: 'Hoàng Minh Châu' },
  { code: 'A-107', type: 'L', size: '12.0 m²', status: 'maintenance', price: 3200000, tenant: null },
  { code: 'A-108', type: 'M', size: '6.0 m²', status: 'cleaning', price: 1600000, tenant: null },
  { code: 'A-109', type: 'S', size: '2.5 m²', status: 'occupied', price: 850000, tenant: 'Phạm Thu Trang' },
  { code: 'A-110', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null },
  { code: 'A-111', type: 'L', size: '10.0 m²', status: 'occupied', price: 2800000, tenant: 'Vũ Quốc Đạt' },
  { code: 'A-112', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null },
  { code: 'A-113', type: 'L', size: '12.0 m²', status: 'occupied', price: 3200000, tenant: 'CP Đầu tư Á Châu' },
  { code: 'A-114', type: 'S', size: '2.0 m²', status: 'available', price: 800000, tenant: null },
  { code: 'A-115', type: 'M', size: '5.0 m²', status: 'reserved', price: 1450000, tenant: 'Nguyễn Kiều Oanh' },
  { code: 'A-116', type: 'S', size: '3.0 m²', status: 'cleaning', price: 950000, tenant: null },
  { code: 'A-117', type: 'L', size: '10.0 m²', status: 'available', price: 2800000, tenant: null },
  { code: 'A-118', type: 'M', size: '5.0 m²', status: 'available', price: 1450000, tenant: null }
];

module.exports = { facilities, unitTypes, units };
