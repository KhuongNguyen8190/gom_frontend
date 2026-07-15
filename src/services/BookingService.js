const BASE_URL = 'https://gom-backend-kxug.onrender.com/api/bookings';

export const bookingService = {
  // Khách đặt lịch cọc tiền
  createBooking: async (bookingData) => {
    const res = await fetch(`${BASE_URL}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(bookingData)
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text); }
    return res.json();
  },

  // Admin ép thêm thành viên MIỄN CỌC
  adminForceAddPlayer: async (playerData) => {
    const res = await fetch(`${BASE_URL}/admin-add`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(playerData)
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text); }
    return res.json();
  },

  // Admin nạp danh sách lịch theo ngày (Không truyền courtNumber nữa)
  getAdminSchedules: async (date) => {
    const res = await fetch(`${BASE_URL}/admin/schedules?date=${date}`);
    if (!res.ok) throw new Error('Không thể tải lịch điều phối');
    return res.json();
  },

  // Admin nạp danh sách người chơi hôm nay
  getTodaySchedules: async () => {
    const res = await fetch(`${BASE_URL}/admin/today`);
    if (!res.ok) throw new Error('Không thể tải lịch hôm nay');
    return res.json();
  },

  // Admin xóa thành viên khỏi sân tập
  cancelBookingByAdmin: async (id) => {
    const res = await fetch(`${BASE_URL}/admin/cancel/${id}`, {
      method: 'DELETE'
    });
    if (!res.ok) { const text = await res.text(); throw new Error(text); }
    return res.json();
  }
};