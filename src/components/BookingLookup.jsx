import React, { useState } from 'react';
import { bookingService } from '../services/BookingService';

export default function BookingLookup() {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState('');

  const handleLookup = async (e) => {
    e.preventDefault();
    if (!phone.trim()) return;
    setLoading(true);
    setError('');
    setBookings([]);

    try {
      const data = await bookingService.lookupByPhone(phone);
      setBookings(data);
    } catch (err) {
      setError(err.message || 'Có lỗi xảy ra.');
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status) => {
    if (status === 'PAID') return 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
    if (status === 'ADMIN_ADDED') return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    if (status === 'FAILED') return 'bg-rose-500/10 text-rose-400 border-rose-500/20';
    return 'bg-amber-500/10 text-amber-400 border-amber-500/20';
  };

  const getStatusText = (status) => {
    if (status === 'PAID') return 'Đã nhận cọc 50%';
    if (status === 'ADMIN_ADDED') return 'Duyệt thẳng';
    if (status === 'FAILED') return 'Đặt sân thất bại';
    return 'Chờ khớp cọc';
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 md:pt-10">
      <div className="rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        <h2 className="text-center text-xl font-black text-white md:text-2xl tracking-tight">Tra Cứu Lịch Chơi</h2>
        <form onSubmit={handleLookup} className="mt-5 space-y-4">
          <input type="tel" required value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Nhập số điện thoại của bạn..." className="block w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3.5 text-sm font-mono text-white focus:outline-none" />
          <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-3.5 text-sm font-bold text-white shadow disabled:bg-slate-700">
            {loading ? 'Đang tìm kiếm...' : 'Xác nhận tra cứu'}
          </button>
        </form>
        {error && <div className="mt-4 rounded-xl bg-rose-500/10 border border-rose-500/20 p-3 text-center text-xs font-bold text-rose-400">{error}</div>}
      </div>

      {bookings.length > 0 && (
        <div className="mt-6 space-y-4">
          <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider px-1">Lịch tập đã tìm thấy ({bookings.length})</h3>
          {bookings.map((booking) => (
            <div key={booking.id} className="rounded-3xl border border-white/5 bg-white/5 p-5 shadow-md space-y-4">
              <div className="flex justify-between items-center">
                <span className="font-mono text-xs text-slate-400 font-bold">Mã: {booking.bookingCode}</span>
                <span className={`rounded-xl px-3 py-1 text-[11px] font-black uppercase border ${getStatusBadge(booking.paymentStatus)}`}>
                  {getStatusText(booking.paymentStatus)}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 text-xs border-y border-slate-800 py-3 text-slate-300">
                <div><span className="text-slate-500 text-[10px] block font-bold uppercase">Thành viên:</span>{booking.fullName}</div>
                <div><span className="text-slate-500 text-[10px] block font-bold uppercase">Vị trí sân:</span>Sân số {booking.courtNumber}</div>
                <div className="mt-1"><span className="text-slate-500 text-[10px] block font-bold uppercase">Ngày chơi:</span>{booking.bookingDate}</div>
                <div className="mt-1"><span className="text-slate-500 text-[10px] block font-bold uppercase">Khung giờ:</span>05:30 - 07:00</div>
              </div>
              <div className="flex justify-between items-center text-xs pt-1">
                <span className="text-slate-400 font-bold">Cần thanh toán thêm tại sân:</span>
                <span className="font-black text-rose-400 text-base">
                  {booking.paymentStatus === 'FAILED' ? '0đ' : booking.paymentStatus === 'ADMIN_ADDED' ? `${Number(booking.totalPrice).toLocaleString()}đ` : `${(Number(booking.totalPrice) - Number(booking.depositAmount)).toLocaleString()}đ`}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}