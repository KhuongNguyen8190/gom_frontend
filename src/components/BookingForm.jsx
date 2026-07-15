import React, { useState, useEffect } from 'react';
import { bookingService } from '../services/BookingService';

export default function BookingForm() {
  // Gắn cứng ngầm courtNumber: 3 để không báo lỗi Backend
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
        const res = await fetch(`https://gom-backend-kxug.onrender.com/api/bookings/status/${createdBooking.bookingCode}`);
        const data = await res.json();
        if (data.paymentStatus === 'PAID') {
          clearInterval(statusChecker);
          clearInterval(timer);
          setPaymentStatus('PAID');
          clearActiveBookingStorage(); 
        } else if (data.paymentStatus === 'EXPIRED_OR_DELETED' || data.paymentStatus === 'FAILED') {
          clearInterval(statusChecker);
          clearInterval(timer);
          handleBookingFailure();
        }
      } catch (err) {
        console.error("Lỗi đồng bộ trạng thái:", err);
      }
    }, 3000);

    return () => { clearInterval(timer); clearInterval(statusChecker); };
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

  const executeBookingCreation = async () => {
    if (!checkSpamProtection()) return;
    setLoading(true);
    try {
      const result = await bookingService.createBooking({
        fullName: formData.fullName,
        phoneNumber: formData.phone,
        gender: formData.gender,
        bookingDate: formData.date,
        courtNumber: 3 // Luôn gửi 3 để tránh lỗi Backend
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
      alert("Vui lòng click chọn 1 ô lịch đăng ký dưới đây!");
      return;
    }

    const selectedDay = availableDays.find(d => d.dateStr === formData.date);
    const isChoosingTuesday = selectedDay?.dayLabel === 'Thứ 3';

    if (isChoosingTuesday) {
      setLoading(true);
      try {
        const response = await fetch(`https://gom-backend-kxug.onrender.com/api/bookings/lookup?phone=${formData.phone.trim()}`);
        if (response.ok) {
          const history = await response.json();
          const activeTuesdayBooking = history.find(b => 
            b.bookingCode?.startsWith('T3') && 
            ['PAID', 'PENDING', 'ADMIN_ADDED'].includes(b.paymentStatus)
          );

          if (activeTuesdayBooking) {
            const [year, month, day] = activeTuesdayBooking.bookingDate.split('-');
            setDuplicateData({ date: `${day}/${month}/${year}` });
            setShowConfirmModal(true); 
            setLoading(false);
            return; 
          }
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
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
        
        <h2 className="text-center text-xl font-black text-white md:text-2xl tracking-tight">Đăng Ký Lịch Chơi</h2>
        <p className="mt-1 text-center text-xs text-slate-400 font-medium">Khung giờ: 05:30 – 07:00 sáng</p>
        
        {cooldownTime > 0 ? (
          <div className="mt-6 bg-slate-900/80 border border-rose-500/20 rounded-2xl p-6 text-center space-y-4">
            <div className="text-3xl">🚫</div>
            <h3 className="text-base font-black text-rose-400 uppercase">Bị chặn tạm thời</h3>
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

            {/* Đã xóa nút chọn sân, thay bằng UI tĩnh cố định địa điểm */}
            <div className="rounded-2xl border border-indigo-500/20 bg-indigo-500/10 p-3.5 text-center flex items-center justify-center space-x-2">
              <span className="text-indigo-400 text-lg">📍</span>
              <span className="text-sm font-bold text-indigo-300 tracking-wide">Địa điểm: Sân 3 & Sân 4</span>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Chọn lịch đăng ký</label>
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
              {loading ? 'Đang gửi...' : `Tiếp tục đặt cọc (${depositAmount.toLocaleString()}đ)`}
            </button>
          </form>
        ) : (
          <div className="mt-6 text-center space-y-5">
            {paymentStatus === 'PENDING' && (
              <>
                <div className="text-sm font-bold text-amber-400 bg-amber-500/10 py-2.5 rounded-2xl border border-amber-500/20">
                  Thời gian giữ chỗ còn lại: <span className="font-mono font-black text-base">{formatTime(timeLeft)}</span>
                </div>
                <div className="flex justify-center"><div className="p-3 bg-white rounded-3xl"><img src={qrUrl} alt="VietQR" className="max-w-[220px]" /></div></div>
                <div className="rounded-2xl bg-slate-900/60 p-3.5 text-left text-xs space-y-2 border border-slate-800 font-medium">
                  <div className="flex justify-between">
                    <span className="text-slate-400">Mã đơn:</span>
                    <span className="font-bold text-white tracking-wider">{createdBooking?.bookingCode}</span>
                  </div>
                  <div className="flex justify-between border-t border-slate-800 pt-2">
                    <span className="text-slate-400">Nội dung CK bắt buộc:</span>
                    <span className="font-mono font-black text-cyan-400">GOM {createdBooking?.bookingCode}</span>
                  </div>
                </div>
                <button onClick={() => { setStep(1); clearActiveBookingStorage(); }} className="text-xs font-bold text-slate-500 underline">Hủy giao dịch</button>
              </>
            )}

            {paymentStatus === 'PAID' && (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✓</div>
                <h3 className="text-xl font-black text-white">ĐĂNG KÝ THÀNH CÔNG!</h3>
                <p className="text-xs text-slate-400 px-4">Hệ thống khớp mã chuyển khoản thành công. Lịch chơi của bạn đã được khóa chỗ.</p>
                <button onClick={() => setStep(1)} className="mt-4 rounded-xl bg-slate-800 px-6 py-2 text-xs font-bold text-white">Xong</button>
              </div>
            )}

            {paymentStatus === 'FAILED' && (
              <div className="py-8 space-y-3">
                <div className="w-16 h-16 bg-rose-500/20 border border-rose-500/30 text-rose-400 rounded-full flex items-center justify-center mx-auto text-3xl font-bold">✕</div>
                <h3 className="text-xl font-black text-rose-500">GIAO DỊCH HẾT HẠN</h3>
                <button onClick={() => setStep(1)} className="mt-4 rounded-xl bg-rose-600 px-6 py-2 text-xs font-bold text-white">Đăng ký lại</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-slate-950/80 backdrop-blur-sm transition-opacity">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/90 p-6 shadow-2xl space-y-4">
            <div className="flex items-center space-x-3 text-amber-400">
              <span className="text-2xl">⚠️</span><h3 className="text-base font-black text-white">Phát hiện trùng lịch Thứ 3</h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed font-medium">
              SĐT này đã đăng ký chơi vào <span className="text-indigo-400 font-bold">Thứ 3 ngày {duplicateData?.date}</span>.
            </p>
            <div className="flex space-x-2 pt-2">
              <button type="button" onClick={() => setShowConfirmModal(false)} className="flex-1 rounded-xl bg-slate-800 py-2.5 text-xs font-bold text-slate-300">Hủy</button>
              <button type="button" onClick={executeBookingCreation} className="flex-1 rounded-xl bg-indigo-600 py-2.5 text-xs font-bold text-white">Vẫn tiếp tục</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}