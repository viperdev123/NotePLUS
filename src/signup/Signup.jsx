import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import logo from "../assets/logoA.png";
import "./Signup.css";

function Signup() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const handleSignup = async (e) => {
    e.preventDefault(); // ป้องกันการรีเฟรชหน้าจากการ submit form
    try {
      const response = await axios.post("http://localhost:5000/api/register", {
        name,
        email,
        password,
      });
      console.log(response.data);
      navigate("/login"); // ไปยังหน้าต้อนรับหลังจากสมัครสมาชิกสำเร็จ
    } catch (error) {
      console.error("Error signing up:", error);
    }
  };

  return (
    <div className="container-signup">
      <div className="signup-left"></div>
      <div className="signup-right">
        <form className="form-box-signup" onSubmit={handleSignup}>
          <img className="logo" src={logo} alt="" />
          <h1>สมัครสมาชิกตอนนี้</h1>
          <div className="signup-name">
            <p>Name</p>
            <div className="seepass">
              <input
                id="name"
                type="text"
                placeholder="Enter your name"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <ion-icon name="person-outline"></ion-icon>
            </div>
          </div>
          <div className="signup-email">
            <p>Email address</p>
            <div className="seepass">
              <input
                id="Semail"
                type="email"
                placeholder="Enter your email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <ion-icon name="mail-outline"></ion-icon>
            </div>
          </div>
          <div className="signup-password">
            <p>Password</p>
            <div className="seepass">
              <input
                id='Spassword'
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
          <button className="signup-btn" type="submit">
            Sign up
          </button>
        </form>
        <p>
          Have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
}

export default Signup;
