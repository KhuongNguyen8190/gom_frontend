import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import BookingLookup from './components/BookingLookup';
import AdminDashboard from './components/AdminDashboard';

export default function App() {
  return (
    <Router>
      <div className="flex flex-col min-h-screen bg-slate-950 text-slate-200 antialiased">
        
        {/* Header toàn hệ thống (Đã ẩn nút bấm Admin) */}
        <Header />

        {/* Luồng nội dung hiển thị tùy biến theo URL */}
        <main className="flex-grow w-full">
          <Routes>
            {/* Trang chủ gồm Banner Cinematic và Form đặt lịch ở cuối */}
            <Route path="/" element={<Home />} />
            
            {/* Trang tra cứu lịch dành cho khách hàng bằng SĐT */}
            <Route path="/tra-cuu" element={<BookingLookup />} />
            
            {/* Đường dẫn bảo mật tuyệt đối vào phân hệ quản trị Admin */}
            <Route path="/admin/password/12345" element={<AdminDashboard />} />
          </Routes>
        </main>

        {/* Footer toàn hệ thống */}
        <Footer />

      </div>
    </Router>
  );
}