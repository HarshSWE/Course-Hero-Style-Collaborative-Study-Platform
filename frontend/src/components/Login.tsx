import { useState } from "react";
import { useNavigate } from "react-router-dom";

// A JWT (JSON Web Token) is like a digital ID card your backend gives you when you log in. You carry it around to prove who you are.
// "Hey backend, it’s me again — here’s my token to prove I’m logged in."
// Helpful for user authentication, proves to the app that the person logging in is really that person
// It's not enough to check if the password entered matches that in the database, because passwords can be stolen
// so we need to hash them and Once the password matches, how does the app know the user is authenticated on every new page?
// The solution is jwt, store the jwt that the serve sends back and put it in local storage
// so Every time the user makes a request, the token is included — this tells the server: “Hey, it’s still me!”

const Login = () => {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: "", password: "" });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // e.target.name is the name attribute of the input
    // e.target.value is the current value of the input field
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    // prevents default form behaviour which is that when submit is clicked the form reloads
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        // converts into a string
        // HTTP requests send data as a string. The body of the request cannot directly contain JavaScript objects (like form) because HTTP bodies are sent as text, not JavaScript objects.
        // http request is client -> server
        // body contains data being sent from client to server
        // can be JSON (commonly used in modern web APIs), Form data (for form submissions), Text, XML, binary data, etc.
        body: JSON.stringify(form),
      });

      const data = await response.json();

      if (response.ok) {
        // localStorage is a web API that allows you to store data persistently on the user's browser.

        // these are key value pairs being stored
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));
        navigate("/");
      } else {
        throw new Error(data.message || "Login failed");
      }
    } catch (error: any) {
      console.error(error);
      alert(error.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-sm">
        <h2 className="text-2xl font-semibold text-center mb-6">Login</h2>
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
