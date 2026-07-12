import React, { useEffect } from 'react';
import BookingForm from '../components/BookingForm';

export default function Home() {
  // Logic tạo hiệu ứng xuất hiện khi cuộn chuột (Intersection Observer)
  useEffect(() => {
    const observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('animate-fade-in-up');
          entry.target.style.opacity = 1;
        }
      });
    }, { threshold: 0.1 });

    const hiddenElements = document.querySelectorAll('.scroll-hidden');
    hiddenElements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, []);

  const scrollToBooking = () => {
    document.getElementById('booking-section').scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="w-full bg-slate-950 text-slate-200">
      
      {/* 1. SECTION HERO (Banner kiểu Trailer CGV) */}
      <section className="relative flex min-h-[85vh] w-full flex-col items-center justify-center overflow-hidden bg-slate-900 px-4 pt-16 text-center">
        {/* Hình nền mờ làm background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/80 to-slate-950 z-10"></div>
          <img 
            src="https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?q=80&w=2070&auto=format&fit=crop" 
            alt="Badminton Court" 
            className="h-full w-full object-cover opacity-40 animate-fade-in"
          />
        </div>

        <div className="relative z-20 max-w-3xl scroll-hidden opacity-0" style={{ transform: 'translateY(40px)' }}>
          <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter text-white mb-4">
            Đỉnh Cao <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-indigo-500">Thể Thao</span>
          </h1>
          <p className="text-sm md:text-base text-slate-300 font-medium mb-8 leading-relaxed max-w-xl mx-auto">
            Trải nghiệm hệ thống sân cầu lông tiêu chuẩn quốc tế. Mặt thảm Yonex cao cấp, ánh sáng chống chói 1000W và hệ thống đặt lịch tự động hoàn toàn.
          </p>
          <button 
            onClick={scrollToBooking}
            className="group relative inline-flex items-center justify-center overflow-hidden rounded-full p-4 px-8 font-bold text-white bg-indigo-600 hover:bg-indigo-500 transition-all shadow-[0_0_40px_-10px_rgba(79,70,229,0.5)]"
          >
            <span className="mr-2">ĐẶT SÂN NGAY</span>
            <svg className="w-5 h-5 group-hover:translate-y-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
            </svg>
          </button>
        </div>
      </section>

      {/* 2. SECTION INFO (Hiệu ứng trượt lên) */}
      <section className="py-20 px-4 max-w-5xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          <div className="scroll-hidden opacity-0 rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center transition-all hover:-translate-y-2 hover:border-indigo-500/30">
            <div className="w-14 h-14 mx-auto bg-indigo-500/10 text-indigo-400 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Khớp Lệnh Siêu Tốc</h3>
            <p className="text-sm text-slate-400">Thanh toán mã QR tự động xác nhận đơn hàng chỉ trong 30 giây. Không cần chờ đợi.</p>
          </div>

          <div className="scroll-hidden opacity-0 rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center transition-all hover:-translate-y-2 hover:border-cyan-500/30" style={{ transitionDelay: '100ms' }}>
            <div className="w-14 h-14 mx-auto bg-cyan-500/10 text-cyan-400 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Cơ Sở Vật Chất</h3>
            <p className="text-sm text-slate-400">Mặt thảm thi đấu chuẩn, không gian thoáng đãng, bãi xe rộng rãi miễn phí.</p>
          </div>

          <div className="scroll-hidden opacity-0 rounded-3xl bg-slate-900 border border-slate-800 p-8 text-center transition-all hover:-translate-y-2 hover:border-rose-500/30" style={{ transitionDelay: '200ms' }}>
            <div className="w-14 h-14 mx-auto bg-rose-500/10 text-rose-400 rounded-2xl flex items-center justify-center mb-6">
              <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            </div>
            <h3 className="text-lg font-bold text-white mb-2">Giờ Vàng Cố Định</h3>
            <p className="text-sm text-slate-400">Khung giờ sáng 5h30 - 7h00 tràn đầy năng lượng, phù hợp rèn luyện thể lực trước giờ làm.</p>
          </div>

        </div>
      </section>

      {/* 3. SECTION BOOKING (Ở cuối cùng) */}
      <section id="booking-section" className="py-24 relative overflow-hidden bg-slate-900/50">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-3xl h-1 bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50"></div>
        <div className="scroll-hidden opacity-0">
          <BookingForm />
        </div>
      </section>

    </div>
  );
}