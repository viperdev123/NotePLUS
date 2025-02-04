import { StrictMode, useEffect } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Route, Routes, useNavigate } from "react-router-dom";
import Login from "./Login/Login";
import Signup from "./signup/Signup.jsx";
import Header from "./header/header.jsx";
import Dashboard from "./Dashboard/Dashboard.jsx";

// Component ตรวจสอบ Token
function ProtectedRoute({ children }) {
  const navigate = useNavigate();
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }
    try {
      const base64Url = token.split(".")[1];
      const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
      const { exp } = JSON.parse(atob(base64));

      if (exp * 1000 < Date.now()) {
        localStorage.removeItem("token");
        navigate("/login");
      }
    } catch (error) {
      console.error("Invalid token:", error);
      localStorage.removeItem("token"); 
      navigate("/login");
    }
  }, [navigate]);

  return children;
}

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Router> 
      <Routes>
        {/* ป้องกันการเข้าใช้งาน "/" ถ้าไม่มี token */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Header />
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
      </Routes>
    </Router>
  </StrictMode>
);
