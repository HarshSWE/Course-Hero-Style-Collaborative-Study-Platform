import React from "react";
import logo from "./logo.svg";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fileupload" element={<FileUpload />} />
      </Routes>
    </Router>
  );
}

export default App;
