import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';  // ใช้ navigate เพื่อเปลี่ยนหน้า
import './header.css';
import logoN from '../assets/logon.png';

function Header() {
    const [userData, setUserData] = useState({ name: '', email: '' });
    const navigate = useNavigate();  // ใช้สำหรับเปลี่ยนเส้นทาง

    useEffect(() => {
        // ดึง token จาก localStorage
        const token = localStorage.getItem("token");

        if (token) {
            try {
                const base64Url = token.split('.')[1];
                const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
                const jsonPayload = JSON.parse(atob(base64));
                setUserData({
                    name: jsonPayload.name || "Unknown",
                    email: jsonPayload.email || "No Email"
                });
            } catch (error) {
                console.error("Invalid token:", error);
            }
        }
    }, []);

    // ฟังก์ชัน Logout
    const handleLogout = () => {
        localStorage.removeItem("token"); // ลบ token ออกจาก localStorage
        navigate("/login");  // เปลี่ยนเส้นทางไปที่หน้า Login
    };

    return (
        <div className='container-header'>
            <div className='container-logo'>
                <img src={logoN} alt="Logo" />
            </div>
            <div className='profile'>
                <div className='user-info'>
                    <div className='name-email'>
                        <div className="user-name">{userData.name}</div>
                        <div className='user-email'>{userData.email}</div>
                    </div>
                    <div className='log-out' onClick={handleLogout} style={{ cursor: 'pointer' }}>
                        <p>Logout</p>
                        <ion-icon name="log-out-outline"></ion-icon>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Header;
