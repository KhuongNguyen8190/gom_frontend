import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/BookingService';

export default function AdminDashboard() {
  const [bookings, setBookings] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedCourt, setSelectedCourt] = useState(3);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({ totalActive: 0, maleCount: 0, femaleCount: 0 });

  // Bộ trạng thái điều khiển Modal xóa thành viên nâng cao
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [memberToDelete, setMemberToDelete] = useState(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Bộ trạng thái hiển thị Toast thông báo nhanh (Popup notification thành công)
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const fetchAdminData = async () => {
    setLoading(true);
    try {
      const data = await bookingService.getAdminSchedules(selectedDate, selectedCourt);
      setBookings(data);
      
      // Tính toán nhanh số liệu thống kê hiển thị lên Dashboard
      const active = data.filter(b => ['PAID', 'ADMIN_ADDED'].includes(b.paymentStatus));
      const males = active.filter(b => b.gender === 'MALE').length;
      const females = active.filter(b => b.gender === 'FEMALE').length;
      
      setStats({
        totalActive: active.length,
        maleCount: males,
        femaleCount: females
      });
    } catch (error) {
      showToast(error.message || "Lỗi nạp danh sách điều phối sân.", "error");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAdminData();
  }, [selectedDate, selectedCourt]);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Kích hoạt mở hộp thoại cảnh báo xóa thành viên
  const openDeleteModal = (booking) => {
    setMemberToDelete(booking);
    setShowDeleteModal(true);
  };

  // Thực thi lệnh xóa từ phía Admin lên hệ thống Cloud Render & Aiven
  const handleConfirmDelete = async () => {
    if (!memberToDelete) return;
    setActionLoading(true);
    try {
      await bookingService.cancelBookingByAdmin(memberToDelete.id);
      showToast(`Đã xóa thành công thành viên ${memberToDelete.fullName} khỏi sân!`, "success");
      await fetchAdminData(); // Cập nhật lại danh sách tức thì
    } catch (error) {
      showToast(error.message || "Không thể thực hiện lệnh xóa.", "error");
    } finally {
      setActionLoading(false);
      setShowDeleteModal(false);
      setMemberToDelete(null);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans antialiased relative selection:bg-indigo-500 selection:text-white">
      
      {/* TẠO HIỆU ỨNG ĐÈN NỀN BACKGROUND NEON AURA */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-96 h-96 bg-rose-600/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-5xl mx-auto space-y-6 relative z-10">
        
        {/* HEADER ĐIỀU HÀNH */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between border-b border-white/5 pb-5 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-wider bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
              Hệ Thống Quản Trị Đặt Sân
            </h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Bảng điều phối và duyệt danh sách thành viên thời gian thực</p>
          </div>
          
          {/* BỘ LỌC ĐIỀU KIỆN (DATE & COURT) */}
          <div className="flex items-center gap-2">
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="rounded-xl border border-white/10 bg-slate-900/60 px-3 py-2 text-xs font-bold text-white focus:border-indigo-500 focus:outline-none"
            />
            <div className="flex rounded-xl border border-white/10 bg-slate-900/40 p-0.5">
              <button onClick={() => setSelectedCourt(3)} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCourt === 3 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Sân 3</button>
              <button onClick={() => setSelectedCourt(4)} className={`px-4 py-1.5 text-xs font-black rounded-lg transition-all ${selectedCourt === 4 ? 'bg-indigo-600 text-white shadow' : 'text-slate-400 hover:text-white'}`}>Sân 4</button>
            </div>
          </div>
        </div>

        {/* THẺ THỐNG KÊ NHANH */}
        <div className="grid grid-cols-3 gap-3">
          <div className="border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Tổng Slot Đã Khóa</span>
            <span className="block text-xl font-black text-white mt-1 font-mono">{stats.totalActive}/8</span>
          </div>
          <div className="border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thành Viên Nam</span>
            <span className="block text-xl font-black text-indigo-400 mt-1 font-mono">{stats.maleCount}</span>
          </div>
          <div className="border border-white/5 bg-white/[0.02] backdrop-blur-md rounded-2xl p-4 text-center">
            <span className="block text-[10px] uppercase tracking-wider text-slate-400 font-bold">Thành Viên Nữ</span>
            <span className="block text-xl font-black text-rose-400 mt-1 font-mono">{stats.femaleCount}</span>
          </div>
        </div>

        {/* DANH SÁCH BẢNG THÀNH VIÊN ĐẶT SÂN */}
        <div className="border border-white/5 bg-white/[0.02] backdrop-blur-xl rounded-3xl overflow-hidden shadow-2xl">
          {loading ? (
            <div className="py-20 text-center text-xs text-slate-400 font-medium tracking-wide animate-pulse">
              Đang đồng bộ dữ liệu với máy chủ Cloud Aiven...
            </div>
          ) : bookings.length === 0 ? (
            <div className="py-20 text-center text-xs text-slate-500 font-medium">
              Không có dữ liệu thành viên nào đăng ký vào ngày này.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/5 bg-white/[0.01] text-[10px] uppercase tracking-wider text-slate-400 font-black">
                    <th className="py-4 px-5">Mã Đơn</th>
                    <th className="py-4 px-5">Họ Và Tên</th>
                    <th className="py-4 px-5">Số Điện Thoại</th>
                    <th className="py-4 px-5">Giới Tính</th>
                    <th className="py-4 px-5">Trạng Thái</th>
                    <th className="py-4 px-5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5 text-xs">
                  {bookings.map((b) => (
                    <tr key={b.id} className="hover:bg-white/[0.01] transition-colors group">
                      <td className="py-3.5 px-5 font-mono font-bold tracking-wide text-indigo-400">{b.bookingCode}</td>
                      <td className="py-3.5 px-5 font-bold text-white">{b.fullName}</td>
                      <td className="py-3.5 px-5 font-mono text-slate-300">{b.phoneNumber}</td>
                      <td className="py-3.5 px-5">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[10px] ${b.gender === 'MALE' ? 'bg-indigo-500/10 text-indigo-400' : 'bg-rose-500/10 text-rose-400'}`}>
                          {b.gender === 'MALE' ? 'Nam' : 'Nữ'}
                        </span>
                      </td>
                      <td className="py-3.5 px-5">
                        <span className={`inline-flex items-center gap-1.5 font-bold text-[10px] ${
                          b.paymentStatus === 'PAID' ? 'text-emerald-400' :
                          b.paymentStatus === 'ADMIN_ADDED' ? 'text-cyan-400' :
                          b.paymentStatus === 'PENDING' ? 'text-amber-400 animate-pulse' : 'text-slate-500 line-through'
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            b.paymentStatus === 'PAID' ? 'bg-emerald-400' :
                            b.paymentStatus === 'ADMIN_ADDED' ? 'bg-cyan-400' :
                            b.paymentStatus === 'PENDING' ? 'bg-amber-400' : 'bg-slate-500'
                          }`} />
                          {b.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3.5 px-5 text-right">
                        {['PAID', 'PENDING', 'ADMIN_ADDED'].includes(b.paymentStatus) && (
                          <button 
                            onClick={() => openDeleteModal(b)}
                            className="opacity-60 group-hover:opacity-100 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 px-3 py-1.5 text-[11px] font-black text-rose-400 transition-all hover:scale-[1.03]"
                          >
                            Xóa Khỏi Sân
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* ==============================================================
          CUSTOM MODAL: THÔNG BÁO XÓA THÀNH VIÊN (SIÊU ĐẸP & CHUYÊN NGHIỆP)
         ============================================================== */}
      {showDeleteModal && memberToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300 animate-in fade-in">
          
          {/* Hộp thoại chính với thiết kế kính mờ + Hào quang viền phát sáng màu Đỏ Neon */}
          <div className="w-full max-w-sm rounded-3xl border border-rose-500/30 bg-slate-900/95 p-6 shadow-[0_0_50px_-12px_rgba(244,63,94,0.4)] text-center space-y-5 relative overflow-hidden animate-in zoom-in-95 duration-200">
            
            {/* Thanh màu đỏ cảnh báo ở đỉnh đầu modal tạo điểm nhấn */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-rose-500 to-transparent" />

            {/* Khối biểu tượng sọc chéo hổ báo và biểu tượng thùng rác phát sáng */}
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-rose-500/10 border-2 border-rose-500/20 text-rose-400 shadow-inner">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-7 h-7 animate-bounce">
                <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
              </svg>
            </div>

            {/* TIÊU ĐỀ */}
            <div className="space-y-1">
              <h3 className="text-base font-black uppercase tracking-wider text-white">Xác nhận trục xuất</h3>
              <p className="text-[10px] text-rose-400 font-bold tracking-widest uppercase bg-rose-500/10 inline-block px-2.5 py-0.5 rounded-full border border-rose-500/10">
                Hành động nguy hiểm
              </p>
            </div>

            {/* KHỐI HIỂN THỊ CHI TIẾT THÔNG TIN ĐỂ ADMIN KIỂM TRA CHÉO (TRÁNH XÓA NHẦM) */}
            <div className="rounded-2xl bg-slate-950/70 p-4 border border-white/5 text-left space-y-2.5 font-medium">
              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-400">Thành viên:</span>
                <span className="font-black text-white text-right">{memberToDelete.fullName}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span className="text-slate-400">Mã đặt sân:</span>
                <span className="font-mono font-black text-indigo-400 tracking-wider">{memberToDelete.bookingCode}</span>
              </div>
              <div className="flex justify-between items-center text-xs border-t border-white/5 pt-2">
                <span className="text-slate-400">Số điện thoại:</span>
                <span className="font-mono text-slate-300">{memberToDelete.phoneNumber}</span>
              </div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed px-1 font-medium">
              Khi bấm xác nhận, hệ thống sẽ chuyển trạng thái đơn sang <strong className="text-slate-200">CANCELLED</strong>, ngay lập tức giải phóng slot trống trên Database Aiven để nhường chỗ cho người khác.
            </p>

            {/* BỘ NÚT HÀNH ĐỘNG TÍNH TOÁN KHOẢNG CÁCH CHUẨN UX */}
            <div className="flex space-x-2 pt-1">
              <button
                type="button"
                disabled={actionLoading}
                onClick={() => { setShowDeleteModal(false); setMemberToDelete(null); }}
                className="flex-1 rounded-xl bg-slate-800 hover:bg-slate-700 py-2.5 text-xs font-bold text-slate-300 transition-colors disabled:opacity-50"
              >
                Giữ lại
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="flex-1 rounded-xl bg-gradient-to-r from-rose-600 to-rose-700 py-2.5 text-xs font-bold text-white shadow-lg shadow-rose-950/50 hover:from-rose-500 hover:to-rose-600 transition-all transform active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5"
              >
                {actionLoading ? 'Đang xóa...' : 'Xác nhận xóa'}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* COMPONENT TOAST THÔNG BÁO LÊN MÀN HÌNH SAU KHI THAO TÁC THÀNH CÔNG */}
      {toast.show && (
        <div className="fixed bottom-5 right-5 z-50 animate-in fade-in slide-in-from-bottom-5 duration-300">
          <div className={`rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md text-xs font-bold border flex items-center space-x-2 ${
            toast.type === 'success' 
              ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-950/20' 
              : 'bg-rose-500/10 border-rose-500/20 text-rose-400 shadow-rose-950/20'
          }`}>
            <span>{toast.type === 'success' ? '⚡' : '❌'}</span>
            <span>{toast.message}</span>
          </div>
        </div>
      )}

    </div>
  );
}