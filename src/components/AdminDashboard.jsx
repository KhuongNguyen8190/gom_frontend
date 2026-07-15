import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/BookingService';

export default function AdminDashboard() {
  const [selectedDate, setSelectedDate] = useState('');
  const [bookings, setBookings] = useState([]);
  const [todayBookings, setTodayBookings] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newPlayer, setNewPlayer] = useState({ fullName: '', phoneNumber: '', gender: 'MALE' });
  const [formError, setFormError] = useState('');
  const [availableDays, setAvailableDays] = useState([]);

  useEffect(() => {
    const generateNext6Days = () => {
      const days = [];
      for (let i = 1; i <= 6; i++) {
        const current = new Date();
        current.setDate(current.getDate() + i);

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        
        const dayOfWeek = current.getDay(); 
        days.push({
          dateStr: `${yyyy}-${mm}-${dd}`,
          dayLabel: dayOfWeek === 0 ? 'Chủ Nhật' : dayOfWeek === 1 ? 'Thứ 2' : `Thứ ${dayOfWeek + 1}`,
          displayDate: `${dd}/${mm}/${yyyy}`, 
          isMonday: dayOfWeek === 1
        });
      }
      setAvailableDays(days);
      const firstValidDay = days.find(d => !d.isMonday);
      if (firstValidDay) setSelectedDate(firstValidDay.dateStr);
    };
    generateNext6Days();
    fetchTodaySchedules();
  }, []);

  const fetchSchedules = async () => {
    if (!selectedDate) return; 
    setLoading(true);
    try {
      // Gắn ngầm courtNumber: 3 để Backend chạy bình thường, dù hiển thị giao diện gộp chung
      const data = await bookingService.getAdminSchedules(selectedDate, 3);
      setBookings(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const fetchTodaySchedules = async () => {
    try {
      const data = await bookingService.getTodaySchedules();
      setTodayBookings(data);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, [selectedDate]);

  // Sĩ số tối đa bây giờ là 16 vì gộp 2 sân
  const activeCount = bookings.filter(b => b.paymentStatus === 'PAID' || b.paymentStatus === 'ADMIN_ADDED').length;

  const handleAddPlayer = async (e) => {
    e.preventDefault();
    setFormError('');
    if (activeCount >= 16) {
      setFormError('Sĩ số hôm nay đã đầy (16/16 người)!');
      return;
    }
    try {
      // Admin Force Add: API phải set status là ADMIN_ADDED
      await bookingService.adminForceAddPlayer({ 
        ...newPlayer, 
        bookingDate: selectedDate, 
        courtNumber: 3 // Gắn cứng 3 cho API
      });
      setShowModal(false);
      setNewPlayer({ fullName: '', phoneNumber: '', gender: 'MALE' }); 
      fetchSchedules();
      fetchTodaySchedules(); 
    } catch (error) {
      setFormError(error.message);
    }
  };

  const handleCancel = async (id) => {
    if (!window.confirm("Loại bỏ người chơi này khỏi danh sách sân tập?")) return;
    try {
      await bookingService.cancelBookingByAdmin(id);
      fetchSchedules();
      fetchTodaySchedules();
    } catch (error) {
      alert(error.message);
    }
  };

  const renderPlayerCard = (p) => (
    <div key={p.id} className={`flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/5 shadow-sm transition-all ${p.paymentStatus === 'CANCELLED' || p.paymentStatus === 'FAILED' ? 'opacity-30 bg-slate-900' : 'hover:border-slate-800'}`}>
      <div className="text-xs space-y-1">
        <div className="flex items-center space-x-2">
          <span className="font-extrabold text-white text-sm">{p.fullName}</span>
          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${p.gender === 'MALE' ? 'bg-blue-500/10 text-blue-400' : 'bg-pink-500/10 text-pink-400'}`}>{p.gender === 'MALE' ? 'Nam' : 'Nữ'}</span>
        </div>
        <p className="font-mono text-slate-400 text-[11px]">Mã: {p.bookingCode} | SĐT: {p.phoneNumber}</p>
        <div className="text-[10px] text-slate-400">
          Tình trạng: <span className={`font-bold ${p.paymentStatus === 'PAID' ? 'text-emerald-400' : p.paymentStatus === 'ADMIN_ADDED' ? 'text-purple-400' : 'text-slate-500'}`}>{p.paymentStatus === 'PAID' ? 'Khách đã cọc' : p.paymentStatus === 'ADMIN_ADDED' ? 'Khách vãng lai (Miễn cọc)' : p.paymentStatus === 'FAILED' ? 'Quá hạn hủy' : 'Đã xóa'}</span>
        </div>
      </div>
      {p.paymentStatus !== 'CANCELLED' && p.paymentStatus !== 'FAILED' && (
        <button onClick={() => handleCancel(p.id)} className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-3 py-1.5 text-xs font-bold text-rose-400 hover:bg-rose-500/20 transition">Xóa</button>
      )}
    </div>
  );
  
  return (
    <div className="mx-auto max-w-xl px-4 pt-6 space-y-8 pb-10">
      
      {/* KHU VỰC 1: BẢNG ĐIỀU PHỐI */}
      <div className="space-y-4">
        <div className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-black text-white uppercase tracking-tight">Lịch Ngày Tương Lai</h2>
              <p className="text-[11px] text-slate-400 font-medium">Sân 3 & Sân 4</p>
            </div>
            <button onClick={() => setShowModal(true)} className="rounded-xl bg-indigo-600 px-3.5 py-2 text-xs font-bold text-white shadow hover:bg-indigo-700 transition">
              + Thêm người quen
            </button>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2 block">Chọn lịch để kiểm tra</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDays.map((day) => (
                  <button
                    key={day.dateStr}
                    type="button"
                    disabled={day.isMonday}
                    onClick={() => setSelectedDate(day.dateStr)}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                      day.isMonday
                        ? 'border-slate-950 bg-slate-950/60 text-slate-600 line-through cursor-not-allowed opacity-40'
                        : selectedDate === day.dateStr
                        ? 'border-indigo-500 bg-indigo-500/15 text-indigo-400 ring-1 ring-indigo-500 font-bold scale-[1.02] shadow-md shadow-indigo-950/50'
                        : 'border-slate-800 bg-slate-900/40 text-slate-300 hover:bg-slate-900/80 font-medium'
                    }`}
                  >
                    <span className="text-xs tracking-wide font-black">{day.dayLabel}</span>
                    <span className="text-[10px] opacity-75 mt-1 font-mono">
                      {day.isMonday ? 'Sân Nghỉ' : day.displayDate}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-3xl border border-white/5 bg-white/5 p-4 shadow-sm space-y-2">
          <div className="flex justify-between text-xs font-bold">
            <span className="text-slate-300">Tổng sĩ số ngày {selectedDate.split('-').reverse().join('/')}:</span>
            <span className={activeCount >= 16 ? 'text-rose-400 font-black' : 'text-cyan-400 font-black'}>{activeCount}/16 Slot</span>
          </div>
          <div className="w-full bg-slate-900 rounded-full h-3 border border-slate-800 overflow-hidden">
            <div className={`h-3 rounded-full transition-all duration-300 ${activeCount >= 16 ? 'bg-rose-500' : 'bg-gradient-to-r from-indigo-500 to-cyan-400'}`} style={{ width: `${(activeCount / 16) * 100}%` }}></div>
          </div>
        </div>

        <div className="space-y-2.5">
          {loading ? (
            <div className="text-center py-6 text-xs text-slate-400 font-bold">Đang đồng bộ...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center rounded-3xl border border-dashed border-slate-800 py-10 text-xs text-slate-500 font-bold">Sân trống vào ngày này.</div>
          ) : (
            bookings.map(renderPlayerCard)
          )}
        </div>
      </div>

      <div className="border-t border-slate-800 my-8"></div>

      {/* KHU VỰC 2: HÔM NAY CÓ AI ĐĂNG KÝ? */}
      <div className="space-y-4">
        <div>
          <h2 className="text-lg font-black text-white uppercase tracking-tight flex items-center space-x-2">
            <span className="w-2 h-6 bg-emerald-500 rounded-full animate-pulse block"></span>
            <span>Hôm nay có ai chơi?</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">Lịch sử ra sân ({new Date().toLocaleDateString('vi-VN')})</p>
        </div>

        <div className="space-y-2.5">
          {todayBookings.length === 0 ? (
            <div className="text-center rounded-3xl border border-dashed border-slate-800 bg-white/5 py-10 text-xs text-slate-500 font-bold">Chưa có thành viên nào xếp lịch vào hôm nay.</div>
          ) : (
            todayBookings.map(renderPlayerCard)
          )}
        </div>
      </div>

      {/* MODAL FORM THÊM NGƯỜI QUEN (ADMIN) */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-3xl bg-slate-900 border border-slate-800 p-6 shadow-2xl">
            <h3 className="text-base font-black text-white tracking-tight">Thêm người chơi (Miễn Cọc)</h3>
            <p className="text-[11px] text-slate-500 font-medium mt-0.5">Xếp lịch vào ngày {selectedDate.split('-').reverse().join('/')}</p>
            {formError && <div className="mt-3 rounded-xl bg-rose-500/10 border border-rose-500/20 p-2 text-center text-[11px] font-bold text-rose-400">{formError}</div>}
            
            <form onSubmit={handleAddPlayer} className="mt-4 space-y-3.5">
              <input type="text" required placeholder="Họ và tên..." value={newPlayer.fullName} onChange={(e) => setNewPlayer({...newPlayer, fullName: e.target.value})} className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white" />
              <input type="tel" required placeholder="Số điện thoại..." value={newPlayer.phoneNumber} onChange={(e) => setNewPlayer({...newPlayer, phoneNumber: e.target.value})} className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-xs text-white font-mono" />
              <select value={newPlayer.gender} onChange={(e) => setNewPlayer({...newPlayer, gender: e.target.value})} className="block w-full rounded-xl border border-slate-800 bg-slate-950 px-2 py-2.5 text-xs font-bold text-slate-400">
                <option value="MALE">Nam (Thu tiền mặt tại sân)</option>
                <option value="FEMALE">Nữ (Thu tiền mặt tại sân)</option>
              </select>
              <div className="flex justify-end space-x-2 text-xs font-bold pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="rounded-xl border border-slate-800 px-4 py-2 text-slate-400 hover:bg-slate-800 transition">Hủy</button>
                <button type="submit" className="rounded-xl bg-indigo-600 px-4 py-2 text-white hover:bg-indigo-700 shadow-md">Thêm ngay</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}