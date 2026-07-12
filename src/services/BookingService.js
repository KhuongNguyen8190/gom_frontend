const BASE_URL = 'http://localhost:8080/api';

export const bookingService = {
  createBooking: async (bookingData) => {
    const response = await fetch(`${BASE_URL}/bookings`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData),
    });
    if (!response.ok) {
      const errorMsg = await response.text();
      throw new Error(errorMsg || 'Không thể tạo yêu cầu đặt lịch.');
    }
    return await response.json();
  },

  lookupByPhone: async (phone) => {
    const response = await fetch(`${BASE_URL}/bookings/lookup?phone=${encodeURIComponent(phone.trim())}`);
    if (!response.ok) {
      if (response.status === 404) throw new Error('Không tìm thấy dữ liệu đặt lịch cho số điện thoại này.');
      throw new Error('Có lỗi xảy ra.');
    }
    return await response.json();
  },

  // API kiểm tra trạng thái đơn phục vụ màn hình đếm ngược thanh toán
  checkBookingStatus: async (code) => {
    const response = await fetch(`${BASE_URL}/bookings/status/${code}`);
    if (!response.ok) throw new Error('Không thể đồng bộ trạng thái đơn.');
    return await response.json();
  },

  getAdminSchedules: async (date, courtNumber) => {
    const response = await fetch(`${BASE_URL}/admin/bookings?date=${date}&courtNumber=${courtNumber}`);
    if (!response.ok) throw new Error('Không thể tải danh sách xếp sân.');
    return await response.json();
  },

  adminForceAddPlayer: async (playerData) => {
    const response = await fetch(`${BASE_URL}/admin/bookings/force-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData),
    });
    if (!response.ok) {
      const errorTxt = await response.text();
      throw new Error(errorTxt || 'Thất bại.');
    }
    return await response.json();
  },

  cancelBookingByAdmin: async (bookingId) => {
    const response = await fetch(`${BASE_URL}/admin/bookings/${bookingId}/cancel`, { method: 'PUT' });
    if (!response.ok) throw new Error('Hủy tư cách xếp sân thất bại.');
    return await response.text();
  },

  getTodaySchedules: async () => {
    const response = await fetch(`${BASE_URL}/admin/bookings/today`);
    if (!response.ok) throw new Error('Không thể tải danh sách sân hôm nay.');
    return await response.json();
  }
};