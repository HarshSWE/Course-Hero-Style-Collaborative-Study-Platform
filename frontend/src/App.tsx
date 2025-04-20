import React from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";
import Shared from "./components/Shared";
import Saved from "./components/Saved";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fileupload" element={<FileUpload />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/shared" element={<Shared />} />
        <Route path="/Saved" element={<Saved />} />
      </Routes>
    </Router>
  );
}

export default App;
