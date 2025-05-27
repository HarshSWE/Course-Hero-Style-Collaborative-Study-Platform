import { useState } from "react";
import { useNavigate } from "react-router-dom";

const SignUp = () => {
  const [form, setForm] = useState({ name: "", email: "" });
  const [error, setError] = useState("");

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    try {
      const checkResponse = await checkIfUserExists(form.email);
      if (checkResponse.exists) {
        setError("A user with this email already exists.");
        return;
      }

      const otpData = await sendOtp(form.email);
      if (otpData.success) {
        navigate("/otpInput", {
          state: { email: form.email, name: form.name },
        });
      } else {
        setError(otpData.message || "Failed to send OTP");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred");
    }
  };

  const checkIfUserExists = async (email: string) => {
    const response = await fetch("http://localhost:5000/check-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  };

  const sendOtp = async (email: string) => {
    const response = await fetch("http://localhost:5000/send-otp", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ email }),
    });
    return response.json();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6">Sign Up</h2>

        {error && (
          <div className="mb-4 text-red-500 text-center font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-1">
              Username
            </label>
            <input
              type="text"
              name="name"
              placeholder="Choose a username"
              value={form.name}
              onChange={handleChange}
              className="w-full px-4 py-2 text-left rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 text-left rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
          >
            Sign Up
          </button>

          <button
            type="button"
            onClick={() => navigate("/login")}
            className="w-full py-2 mt-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition"
          >
            Already have an account? Log In
          </button>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
