import React, { useState, useEffect } from 'react';
// Thay đường dẫn fetch bên dưới bằng bookingService.lookup(...) nếu bạn đã khai báo trong service

export default function BookingHistory() {
  const [phone, setPhone] = useState('');
  const [historyList, setHistoryList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State phục vụ việc tạo đồng hồ đếm ngược thời gian thực (Live Timer)
  const [currentTime, setCurrentTime] = useState(Date.now());
  
  // State hiển thị QR Code để tiếp tục thanh toán
  const [payingBooking, setPayingBooking] = useState(null);

  // Kích hoạt nhịp đập 1 giây/lần để re-render lại thời gian đếm ngược
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Hàm tự động gọi API kiểm tra trạng thái thanh toán khi Modal đang mở
  useEffect(() => {
    let statusChecker;
    if (payingBooking) {
      statusChecker = setInterval(async () => {
        try {
          const res = await fetch(`https://gom-backend-kxug.onrender.com/api/bookings/status/${payingBooking.bookingCode}`);
          const data = await res.json();
          if (data.paymentStatus === 'PAID') {
            clearInterval(statusChecker);
            setPayingBooking(null);
            handleSearch(null); // Load lại danh sách để hiện xanh lá mạ
          } else if (data.paymentStatus === 'EXPIRED_OR_DELETED') {
            clearInterval(statusChecker);
            setPayingBooking(null);
            handleSearch(null); // Load lại danh sách
          }
        } catch (err) {
          console.error(err);
        }
      }, 3000);
    }
    return () => clearInterval(statusChecker);
  }, [payingBooking]);

  const handleSearch = async (e) => {
    if (e) e.preventDefault();
    if (!phone) return;
    
    setLoading(true);
    setErrorMsg('');
    setHistoryList([]);
    setPayingBooking(null);

    try {
      const response = await fetch(`https://gom-backend-kxug.onrender.com/api/bookings/lookup?phone=${phone}`);
      if (!response.ok) {
        throw new Error('Không tìm thấy lịch sử đặt sân với số điện thoại này.');
      }
      const data = await response.json();
      setHistoryList(data);
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Hàm tính toán số giây còn lại từ khi đơn được tạo ở Backend
  const calculateTimeLeft = (createdAtRaw) => {
    // Ép kiểu chuỗi ngày tháng của Backend sang dạng mà JS có thể đọc chuẩn xác
    const createdDate = new Date(createdAtRaw + 'Z'); 
    const expireTime = createdDate.getTime() + 5 * 60 * 1000;
    return Math.max(0, Math.floor((expireTime - currentTime) / 1000));
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const openPaymentModal = (booking) => {
    const timeLeft = calculateTimeLeft(booking.createdAt);
    if (timeLeft > 0) {
      setPayingBooking(booking);
    } else {
      alert("Đơn hàng này đã quá hạn thanh toán.");
      handleSearch(null);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 pt-6 md:pt-10">
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        
        <h2 className="text-center text-xl font-black text-white tracking-tight uppercase">Tra Cứu Lịch Sử</h2>
        
        <form onSubmit={handleSearch} className="mt-5 flex gap-2">
          <input 
            type="tel" 
            placeholder="Nhập số điện thoại..." 
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            className="flex-1 rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none"
          />
          <button type="submit" disabled={loading} className="rounded-2xl bg-indigo-600 px-5 font-bold text-white shadow-lg hover:bg-indigo-500 disabled:opacity-50">
            {loading ? '...' : 'Tìm'}
          </button>
        </form>

        {errorMsg && <p className="mt-4 text-center text-xs font-bold text-rose-400">{errorMsg}</p>}

        <div className="mt-6 space-y-3">
          {historyList.map((booking) => {
            const isPending = booking.paymentStatus === 'PENDING';
            const isPaid = booking.paymentStatus === 'PAID';
            const isAdmin = booking.paymentStatus === 'ADMIN_ADDED';
            
            let timeLeft = 0;
            if (isPending) {
              timeLeft = calculateTimeLeft(booking.createdAt);
            }

            // Nếu là PENDING nhưng đếm ngược về 0, nó sẽ tự động bị ẩn nút và coi như hết hạn trên UI
            const isExpired = isPending && timeLeft === 0;

            return (
              <div key={booking.id} className="relative rounded-2xl border border-slate-800 bg-slate-900/40 p-4 transition-all hover:bg-slate-900/60">
                <div className="flex justify-between items-start">
                  <div>
                    <span className="font-mono text-xs font-black text-indigo-400 tracking-wider">#{booking.bookingCode}</span>
                    <h3 className="text-sm font-bold text-white mt-1">{booking.fullName}</h3>
                    <p className="text-[11px] text-slate-400 mt-1">Sân Số {booking.courtNumber} • Ngày {booking.bookingDate}</p>
                  </div>
                  
                  <div className="text-right">
                    <span className={`px-2 py-1 inline-block rounded-lg text-[10px] font-black uppercase ${
                      isPaid ? 'bg-emerald-500/10 text-emerald-400' :
                      isAdmin ? 'bg-cyan-500/10 text-cyan-400' :
                      isExpired ? 'bg-rose-500/10 text-rose-400 line-through' :
                      'bg-amber-500/10 text-amber-400 animate-pulse'
                    }`}>
                      {isExpired ? 'HẾT HẠN' : booking.paymentStatus}
                    </span>
                  </div>
                </div>

                {/* KHU VỰC NÚT THANH TOÁN TIẾP TỤC CHO ĐƠN PENDING */}
                {isPending && !isExpired && (
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                    <div className="text-xs text-slate-400 font-medium">
                      Thời gian giữ sân: <span className="text-amber-400 font-mono font-bold text-sm bg-amber-500/10 px-2 py-0.5 rounded-md ml-1">{formatTime(timeLeft)}</span>
                    </div>
                    <button 
                      onClick={() => openPaymentModal(booking)}
                      className="rounded-xl bg-gradient-to-r from-emerald-600 to-emerald-500 px-4 py-2 text-xs font-bold text-white shadow-md hover:scale-105 transition-transform"
                    >
                      Thanh Toán Ngay
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* ==============================================================
          MODAL THANH TOÁN (Hiện mã QR)
         ============================================================== */}
      {payingBooking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900 p-6 shadow-2xl space-y-5 text-center animate-in zoom-in-95">
            
            <h3 className="text-lg font-black text-white">HOÀN TẤT THANH TOÁN</h3>
            
            <div className="text-sm font-bold text-amber-400 bg-amber-500/10 py-2.5 rounded-xl border border-amber-500/20">
              Sẽ hủy đơn sau: <span className="font-mono text-base">{formatTime(calculateTimeLeft(payingBooking.createdAt))}</span>
            </div>

            <div className="flex justify-center">
              <div className="p-3 bg-white rounded-3xl">
                <img 
                  src={`https://img.vietqr.io/image/ACB-16300101-compact2.png?amount=${payingBooking.depositAmount}&addInfo=${encodeURIComponent(`GOM ${payingBooking.bookingCode}`)}&accountName=GOM BADMINTON`} 
                  alt="QR Code" 
                  className="max-w-[200px]" 
                />
              </div>
            </div>

            <div className="rounded-xl bg-slate-950 p-3 text-left text-xs space-y-2 border border-slate-800 font-medium">
               <div className="flex justify-between border-b border-slate-800 pb-2">
                 <span className="text-slate-400">Số tiền cọc:</span>
                 <span className="font-bold text-emerald-400">{payingBooking.depositAmount.toLocaleString()} VNĐ</span>
               </div>
               <div className="flex justify-between pt-1">
                 <span className="text-slate-400">Nội dung CK:</span>
                 <span className="font-mono font-black text-cyan-400">GOM {payingBooking.bookingCode}</span>
               </div>
            </div>

            <button 
              onClick={() => setPayingBooking(null)}
              className="w-full rounded-xl bg-slate-800 py-3 text-xs font-bold text-slate-300 hover:bg-slate-700"
            >
              Đóng cửa sổ
            </button>
          </div>
        </div>
      )}
    </div>
  );
}