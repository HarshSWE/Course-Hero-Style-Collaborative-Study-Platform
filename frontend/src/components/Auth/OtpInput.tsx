import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";

const OtpInput: React.FC = () => {
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [password, setPassword] = useState("");
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const inputsRef = useRef<Array<HTMLInputElement | null>>([]);

  const navigate = useNavigate();
  const location = useLocation();
  const { email, name } = location.state || {};

  useEffect(() => {
    if (otp.every((digit) => /^[0-9]$/.test(digit))) {
      verifyOtp();
    }
  }, [otp]);

  const handleChange = (value: string, index: number) => {
    if (!/^[0-9]?$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (
    e: React.KeyboardEvent<HTMLInputElement>,
    index: number
  ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handleResendOtp = async () => {
    setResending(true);
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/send-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("OTP sent successfully! Please check your email.");
      } else {
        setError(data.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while sending OTP.");
    } finally {
      setResending(false);
    }
  };

  const verifyOtp = async () => {
    const otpCode = otp.join("");
    setError("");
    setSuccess("");

    try {
      const response = await fetch("http://localhost:5000/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, code: otpCode }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess("OTP verified! Please set your password.");
        setOtpVerified(true);
      } else {
        setError(data.message || "OTP verification failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    }
  };

  const handleFinalSignup = async () => {
    try {
      const signupResponse = await fetch("http://localhost:5000/signup", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name, email, password }),
      });

      const signupData = await signupResponse.json();

      if (signupResponse.ok) {
        navigate("/");
      } else {
        setError(signupData.message || "Signup failed");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="flex flex-col items-center gap-4 bg-white p-8 rounded-lg shadow-md w-full max-w-sm">
        <p className="text-lg text-center">
          Enter the verification code that was sent to <strong>{email}</strong>
        </p>

        {error && (
          <div className="text-red-500 text-center font-medium">{error}</div>
        )}
        {success && (
          <div className="text-green-600 text-center font-medium">
            {success}
          </div>
        )}

        {!otpVerified && (
          <>
            <div className="flex gap-2">
              {otp.map((digit, index) => (
                <input
                  key={index}
                  type="text"
                  value={digit}
                  maxLength={1}
                  onChange={(e) => handleChange(e.target.value, index)}
                  onKeyDown={(e) => handleKeyDown(e, index)}
                  ref={(el) => {
                    inputsRef.current[index] = el;
                  }}
                  className="w-12 h-14 text-center border border-gray-400 rounded-md text-2xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              ))}
            </div>

            <button
              className={`text-blue-600 font-medium hover:underline mt-2 ${
                resending ? "cursor-not-allowed opacity-50" : ""
              }`}
              onClick={handleResendOtp}
              disabled={resending}
            >
              {resending ? "Resending..." : "Resend Code"}
            </button>
          </>
        )}

        {otpVerified && (
          <div className="w-full mt-4">
            <label className="block text-sm font-medium text-gray-700 mb-1 text-left">
              Create Password
            </label>
            <input
              type="password"
              placeholder="Enter a password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 text-left rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
            <button
              className="w-full py-2 mt-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
              onClick={handleFinalSignup}
            >
              Complete Signup
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OtpInput;
