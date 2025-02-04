import React, { useState } from 'react';
import './Login.css';
import logo from '../assets/logoA.png';
import { Link, useNavigate } from 'react-router-dom'; // Correct import
import axios from 'axios'; // Import axios

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for showing password
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        // Check if email and password are provided
        if (email === '' || password === '') {
            setError('Please fill in both fields');
            return;
        }

        try {
            // ส่งคำขอ POST ไปยัง backend API เพื่อทำการล็อกอิน
            const response = await axios.post('http://localhost:5000/api/login', {
                email,
                password,
            });

            if (response.data.token) {
                // เก็บ JWT token ใน localStorage
                const token = response.data.token;
                localStorage.setItem('token', token);
                // Redirect ไปหน้าหลักหลังจากล็อกอินสำเร็จ
                navigate('/');  
            } else {
                setError('Invalid email or password');
            }
        } catch (err) {
            console.error('Error logging in:', err);
            setError('An error occurred. Please try again.');
        }
    };

    return (
        <div className='container-login'>
            <div className="login-left">
                <form className='form-box-login' onSubmit={handleSubmit}>
                    <img className='logo' src={logo} alt="Logo" />
                    <h1>ยินดีต้อนรับกลับมา!</h1>
                    <h2>กรุณากรอกข้อมูลประจำตัวของคุณเพื่อเข้าสู่บัญชีของคุณ</h2>

                    {/* Displaying error message */}
                    {error && <p className="error-message">{error}</p>}

                    <div className='login-email'>
                        <p>Email address</p>
                        <div className="seepass">
                            <input
                                id='email'
                                type="email"
                                placeholder='Enter your email'
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                            />
                            <ion-icon name="mail-outline"></ion-icon>
                        </div>
                    </div>

                    <div className="login-password">
                        <p>Password</p>
                        <div className="seepass">
                            <input
                                id='password'
                                type={showPassword ? "text" : "password"}
                                placeholder='Enter your password'
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <ion-icon
                                name={showPassword ? "eye-outline" : "eye-off-outline"}
                                onClick={() => setShowPassword(!showPassword)}
                            ></ion-icon>
                        </div>
                    </div>

                    <button className="login-btn" type="submit">Login</button>
                </form>
                <p>Don’t have an account? <Link to='/signup'>Sign up</Link></p>
            </div>
            <div className='login-right'>
            </div>
        </div>
    );
}

export default Login;
