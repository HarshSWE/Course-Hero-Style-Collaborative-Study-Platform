import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useProfileImage } from "./ProfileImageContext";
import { useNotifications } from "./NotificationsContext";

const Login = () => {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const { refreshProfilePicture } = useProfileImage();
  const { refreshNotifications } = useNotifications();

  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    await login();
  };

  const login = async () => {
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        console.log("LOGIN SUCCESS - TOKEN:", data.token);

        await refreshProfilePicture();
        await refreshNotifications();

        navigate("/");
      } else {
        setError(data.message || "Login failed");
      }
    } catch (error: any) {
      console.error(error);
      setError(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
        {error && (
          <div className="mb-4 text-red-500 text-sm text-center font-medium">
            {error}
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              name="email"
              placeholder="Enter your username"
              value={form.email}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-left text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange}
              className="w-full px-4 py-2 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          <button
            type="submit"
            className="w-full py-2 mt-4 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition"
          >
            Submit
          </button>
          <button
            type="button"
            onClick={() => navigate("/signup")}
            className="w-full py-2 mt-2 border border-blue-500 text-blue-500 rounded-full hover:bg-blue-50 transition"
          >
            Don't have an account? Sign Up
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
