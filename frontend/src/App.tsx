import React from "react";
import logo from "./logo.svg";
import "./App.css";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";

function App() {
  return (
    <div className="App">
      <FileUpload />
    </div>
  );
}

export default App;
