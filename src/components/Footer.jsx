import React from 'react';

export default function Footer() {
  return (
    <footer className="w-full border-t border-white/10 bg-slate-950 py-8 mt-auto">
      <div className="mx-auto max-w-5xl px-4 text-center space-y-4">
        <div className="flex justify-center items-center space-x-2 text-slate-400 text-sm">
          {/* Đổi chữ thành màu trắng để nổi trên nền tối */}
          <span className="font-bold text-white tracking-wide">GOM Badminton System</span>
          <span>•</span>
          <span>Khung giờ: 05:30 - 07:00</span>
        </div>
        
        <p className="text-xs text-slate-400 leading-relaxed max-w-md mx-auto">
          Hệ thống đặt lịch tập tự động, khớp lệnh thanh toán siêu tốc thông minh. Sân cầu tiêu chuẩn quốc tế, trải nghiệm thể thao đỉnh cao.
        </p>
        
        {/* Đường kẻ ngang cũng được làm mờ đi (border-white/5) cho sang trọng */}
        <div className="text-[11px] text-slate-500 font-medium pt-4 border-t border-white/5 mt-4">
          © {new Date().getFullYear()} GOM Badminton. All rights reserved. Designed for Premium Experience.
        </div>
      </div>
    </footer>
  );
}