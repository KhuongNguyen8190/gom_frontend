import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/BookingService';

export default function BookingForm() {
  const [formData, setFormData] = useState({ fullName: '', phone: '', gender: 'MALE', date: '', courtNumber: 3 });
  const [depositAmount, setDepositAmount] = useState(3000); 
  const [step, setStep] = useState(1); 
  const [qrUrl, setQrUrl] = useState('');
  const [loading, setLoading] = useState(false);
  
  const [createdBooking, setCreatedBooking] = useState(null);
  const [timeLeft, setTimeLeft] = useState(300); 
  const [paymentStatus, setPaymentStatus] = useState('PENDING');
  const [cooldownTime, setCooldownTime] = useState(0);
  const [availableDays, setAvailableDays] = useState([]);

  // Bổ sung các State phục vụ hiển thị thông báo trùng lịch nâng cao
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [duplicateData, setDuplicateData] = useState(null);

  useEffect(() => {
    const generateNext6Days = () => {
      const days = [];
      for (let i = 1; i <= 6; i++) { 
        const current = new Date();
        current.setDate(current.getDate() + i);

        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, '0');
        const dd = String(current.getDate()).padStart(2, '0');
        const dateStr = `${yyyy}-${mm}-${dd}`; 

        const dayOfWeek = current.getDay(); 
        let dayLabel = '';
        if (dayOfWeek === 0) dayLabel = 'Chủ Nhật';
        else if (dayOfWeek === 1) dayLabel = 'Thứ 2';
        else dayLabel = `Thứ ${dayOfWeek + 1}`;

        days.push({
          dateStr,
          dayLabel,
          displayDate: `${dd}/${mm}/${yyyy}`, 
          isMonday: dayOfWeek === 1
        });
      }
      setAvailableDays(days);
    };

    generateNext6Days();

    const savedCooldown = localStorage.getItem('GOM_COOLDOWN_END');
    if (savedCooldown) {
      const remainingCooldown = Math.floor((Number(savedCooldown) - Date.now()) / 1000);
      if (remainingCooldown > 0) setCooldownTime(remainingCooldown);
      else localStorage.removeItem('GOM_COOLDOWN_END');
    }

    const savedBooking = localStorage.getItem('GOM_ACTIVE_BOOKING');
    const savedExpire = localStorage.getItem('GOM_BOOKING_EXPIRE_AT');
    
    if (savedBooking && savedExpire) {
      const remainingTime = Math.floor((Number(savedExpire) - Date.now()) / 1000);
      if (remainingTime > 0) {
        const bookingObj = JSON.parse(savedBooking);
        setCreatedBooking(bookingObj);
        setDepositAmount(bookingObj.depositAmount);
        setTimeLeft(remainingTime);
        setStep(2);
        
        const qrLink = `https://img.vietqr.io/image/ACB-16300101-compact2.png?amount=${bookingObj.depositAmount}&addInfo=${encodeURIComponent(`GOM ${bookingObj.bookingCode}`)}&accountName=GOM BADMINTON`;
        setQrUrl(qrLink);
      } else {
        clearActiveBookingStorage();
      }
    }
  }, []);

  useEffect(() => {
    if (step !== 2 || !createdBooking) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleBookingFailure();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    const statusChecker = setInterval(async () => {
      try {
        const res = await bookingService.checkBookingStatus(createdBooking.bookingCode);
        if (res.paymentStatus === 'PAID') {
          clearInterval(statusChecker);
          clearInterval(timer);
          setPaymentStatus('PAID');
          clearActiveBookingStorage(); 
        } else if (res.paymentStatus === 'EXPIRED_OR_DELETED' || res.paymentStatus === 'FAILED') {
          clearInterval(statusChecker);
          clearInterval(timer);
          handleBookingFailure();
        }
      } catch (err) {
        console.error("Lỗi đồng bộ trạng thái đơn:", err);
      }
    }, 3000);

    return () => {
      clearInterval(timer);
      clearInterval(statusChecker);
    };
  }, [step, createdBooking]);

  useEffect(() => {
    if (cooldownTime <= 0) return;
    const cdTimer = setInterval(() => {
      setCooldownTime((prev) => {
        if (prev <= 1) {
          clearInterval(cdTimer);
          localStorage.removeItem('GOM_COOLDOWN_END');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cdTimer);
  }, [cooldownTime]);

  const clearActiveBookingStorage = () => {
    localStorage.removeItem('GOM_ACTIVE_BOOKING');
    localStorage.removeItem('GOM_BOOKING_EXPIRE_AT');
  };

  const handleBookingFailure = () => {
    setPaymentStatus('FAILED');
    setTimeLeft(0);
    clearActiveBookingStorage();
  };

  const checkSpamProtection = () => {
    const now = Date.now();
    let attempts = JSON.parse(localStorage.getItem('GOM_ATTEMPTS') || '[]');
    attempts = attempts.filter(timestamp => now - timestamp < 300000); 
    attempts.push(now);
    localStorage.setItem('GOM_ATTEMPTS', JSON.stringify(attempts));

    if (attempts.length > 5) {
      const cooldownEnd = now + 900000; 
      localStorage.setItem('GOM_COOLDOWN_END', String(cooldownEnd));
      setCooldownTime(900);
      return false;
    }
    return true;
  };

  // Hàm thực thi gọi API khởi tạo đơn hàng thực tế sau khi đã qua các lớp kiểm duyệt trùng lịch
  const executeBookingCreation = async () => {
    if (!checkSpamProtection()) return;
    setLoading(true);

    try {
      const result = await bookingService.createBooking({
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        gender: formData.gender,
        bookingDate: formData.date,
        courtNumber: Number(formData.courtNumber)
      });

      setCreatedBooking(result);
      setTimeLeft(300);
      setPaymentStatus('PENDING');

      const expireTime = Date.now() + 300000;
      localStorage.setItem('GOM_ACTIVE_BOOKING', JSON.stringify(result));
      localStorage.setItem('GOM_BOOKING_EXPIRE_AT', String(expireTime));

      const qrLink = `https://img.vietqr.io/image/ACB-16300101-compact2.png?amount=${depositAmount}&addInfo=${encodeURIComponent(`GOM ${result.bookingCode}`)}&accountName=GOM BADMINTON`;
      setQrUrl(qrLink);
      setStep(2);
      setShowConfirmModal(false); 
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.date) {
      alert("Vui lòng click chọn 1 ô lịch đặt sân dưới đây!");
      return;
    }

    // Kiểm tra xem khách hàng có đang chọn đặt lịch vào Thứ 3 không
    const selectedDay = availableDays.find(d => d.dateStr === formData.date);
    const isChoosingTuesday = selectedDay?.dayLabel === 'Thứ 3';

    if (isChoosingTuesday) {
      setLoading(true);
      try {
        // Thực hiện quét lịch sử đăng ký của số điện thoại trên máy chủ Render công khai
        const response = await fetch(`https://gom-backend-kxug.onrender.com/api/bookings/lookup?phone=${formData.phone.trim()}`);
        if (response.ok) {
          const history = await response.json();
          // Lọc tìm đơn hàng Thứ 3 (mã bắt đầu bằng T3) có trạng thái hợp lệ
          const activeTuesdayBooking = history.find(b => 
            b.bookingCode?.startsWith('T3') && 
            ['PAID', 'PENDING', 'ADMIN_ADDED'].includes(b.paymentStatus)
          );

          if (activeTuesdayBooking) {
            const [year, month, day] = activeTuesdayBooking.bookingDate.split('-');
            setDuplicateData({
              date: `${day}/${month}/${year}`,
              courtNumber: activeTuesdayBooking.courtNumber
            });
            setShowConfirmModal(true); // Kích hoạt hiển thị hộp thoại xác nhận thiết kế đẹp
            setLoading(false);
            return; // Chặn luồng gửi dữ liệu trực tiếp để chờ xác nhận từ khách hàng
          }
        }
      } catch (err) {
        console.error("Lỗi xác thực dữ liệu trùng lịch:", err);
      } finally {
        setLoading(false);
      }
    }

    // Trường hợp không chọn Thứ 3 hoặc không phát hiện trùng lặp dữ liệu
    await executeBookingCreation();
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="mx-auto max-w-md px-4 pt-6 md:pt-10 relative">
      <div className="overflow-hidden rounded-3xl border border-white/5 bg-white/5 p-6 shadow-xl backdrop-blur-md">
        
        <h2 className="text-center text-xl font-black text-white md:text-2xl tracking-tight">Đặt Lịch Sân Tập</h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">Khung giờ: 05:30 – 07:00 sáng</p>
        
        {cooldownTime > 0 ? (
          <div className="mt-6 bg-slate-900/80 border border-rose-500/20 rounded-2xl p-6 text-center space-y-4">
            <div className="text-3xl">🚫</div>
            <h3 className="text-base font-black text-rose-400 uppercase">Thiết bị đang bị đóng băng</h3>
            <p className="text-xs text-slate-400 leading-relaxed">Bạn đã spam đặt lịch quá 5 lần trong vòng 5 phút. Vui lòng quay lại sau thời gian đếm ngược hình phạt bên dưới.</p>
            <div className="text-xl font-mono font-black text-white bg-slate-950/80 py-3 rounded-xl border border-slate-800">
              {formatTime(cooldownTime)}
            </div>
          </div>
        ) : step === 1 ? (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Họ và tên</label>
              <input type="text" required value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})} placeholder="Nhập họ và tên..." className="mt-1.5 block w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3.5 text-sm text-white focus:border-indigo-500 focus:outline-none" />
            </div>
            
            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Số điện thoại</label>
              <input type="tel" required value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} placeholder="Nhập số điện thoại..." className="mt-1.5 block w-full rounded-2xl border border-slate-800 bg-slate-900/50 px-4 py-3.5 text-sm font-mono text-white focus:border-indigo-500 focus:outline-none" />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => { setFormData({...formData, gender: 'MALE'}); setDepositAmount(3000); }} className={`p-3 rounded-2xl border text-sm font-bold flex flex-col items-center ${formData.gender === 'MALE' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400'}`}>
                <span>Nam</span><span className="text-[10px] font-normal opacity-70">Cọc test: 3.000đ</span>
              </button>
              <button type="button" onClick={() => { setFormData({...formData, gender: 'FEMALE'}); setDepositAmount(2000); }} className={`p-3 rounded-2xl border text-sm font-bold flex flex-col items-center ${formData.gender === 'FEMALE' ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400'}`}>
                <span>Nữ</span><span className="text-[10px] font-normal opacity-70">Cọc test: 2.000đ</span>
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button type="button" onClick={() => setFormData({...formData, courtNumber: 3})} className={`py-3 rounded-2xl border text-sm font-bold ${Number(formData.courtNumber) === 3 ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400'}`}>Sân Số 3</button>
              <button type="button" onClick={() => setFormData({...formData, courtNumber: 4})} className={`py-3 rounded-2xl border text-sm font-bold ${Number(formData.courtNumber) === 4 ? 'border-indigo-500 bg-indigo-500/10 text-indigo-400' : 'border-slate-800 bg-slate-900/40 text-slate-400'}`}>Sân Số 4</button>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn lịch đặt sân</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {availableDays.map((day) => (
                  <button
                    key={day.dateStr}
                    type="button"
                    disabled={day.isMonday}
                    onClick={() => setFormData({ ...formData, date: day.dateStr })}
                    className={`p-3 rounded-xl border text-center flex flex-col items-center justify-center transition-all ${
                      day.isMonday
                        ? 'border-slate-950 bg-slate-950/60 text-slate-600 line-through cursor-not-allowed opacity-40'
                        : formData.date === day.dateStr
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

            <button type="submit" disabled={loading} className="w-full rounded-2xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-4 text-sm font-bold text-white shadow-lg disabled:opacity-50">
              {loading ? 'Đang gửi yêu cầu...' : `Tiếp tục đặt cọc (${depositAmount.toLocaleString()}đ)`}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center space-y-5">
            {paymentStatus === 'PENDING' && (
              <>
                <div className="text-sm font-bold text-amber-400 bg-amber-500/10 py-2.5 rounded-2xl border border-amber-500/20">
                  Thời gian giữ sân còn lại: <span className="font-mono font-black text-base">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex justify-center"><div className="p-3 bg-white rounded-3xl"><img src={qrUrl} alt="VietQR" className="max-w-[220px]" /></div></div>
                
                <div className="rounded-2xl bg-slate-900/60 p-3.5 text-left text-xs space-y-2 border border-slate-800 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã đặt sân:</span>
                    <span className="font-bold text-white tracking-wider">{createdBooking?.bookingCode}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Nội dung CK bắt buộc:</span>
                    <span className="font-mono font-black text-cyan-400">GOM {createdBooking?.bookingCode}</span>
                  </div>
                </div>
                <button onClick={() => { setStep(1); clearActiveBookingStorage(); }} className="text-xs font-bold text-slate-500 underline hover:text-slate-400">Hủy bỏ giao dịch</button>
              </>
            )}

            {paymentStatus === 'PAID' && (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                <h3 className="text-xl font-black text-white">ĐẶT SÂN THÀNH CÔNG!</h3>
                <p className="text-xs text-slate-400 px-4">Hệ thống khớp mã chuyển khoản thành công. Mã đặt sân của bạn là <strong className="text-indigo-400 font-mono">{createdBooking?.bookingCode}</strong>. Lịch tập đã được khóa chỗ.</p>
                <button onClick={() => setStep(1)} className="mt-4 rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white">Quay lại trang chủ</button>
              </div>
            )}

            {paymentStatus === 'FAILED' && (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✕</div>
                <h3 className="text-xl font-black text-rose-500">ĐẶT SÂN THẤT BẠI</h3>
                <p className="text-xs text-slate-400 px-4">Đã quá thời hạn 5 phút quy định mà hệ thống chưa nhận được tiền đặt cọc. Yêu cầu của bạn đã bị hủy bỏ và giải phóng slot sân.</p>
                <button onClick={() => setStep(1)} className="mt-4 rounded-xl bg-rose-600 px-6 py-2 text-xs font-bold text-white hover:bg-rose-700">Thực hiện đăng ký lại</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* ==============================================================
          CUSTOM MODAL: THÔNG BÁO TRÙNG LỊCH THỨ 3 (UI CAO CẤP)
         ============================================================== */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm transition-opacity duration-300">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-200">
            <div className="flex items-center space-x-3 text-amber-400">
              <span className="text-2xl">⚠️</span>
              <h3 className="text-base font-black uppercase tracking-wide text-white">Phát hiện trùng lịch Thứ 3</h3>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              Số điện thoại này đã được sử dụng để đăng ký vào <span className="text-indigo-400 font-bold">Thứ 3 ngày {duplicateData?.date}</span> tại <span className="text-indigo-400 font-bold">Sân số {duplicateData?.courtNumber}</span>.
            </p>
            
            <p className="text-[11px] text-slate-400 italic">
              Bạn có chắc chắn muốn tiếp tục đăng ký thêm một suất đặt sân nữa cho ngày Thứ 3 tuần này không?
            </p>

            <div className="flex space-x-2 pt-2">
              <button 
                type="button" 
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300 hover:bg-slate-700 transition-colors"
              >
                Hủy bỏ
              </button>
              <button 
                type="button" 
                onClick={executeBookingCreation}
                className="flex-1 rounded-xl bg-gradient-to-r from-indigo-600 to-indigo-700 py-2.5 text-xs font-bold text-white shadow-md shadow-indigo-950/50 hover:from-indigo-500 hover:to-indigo-600 transition-all"
              >
                Vẫn tiếp tục
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}