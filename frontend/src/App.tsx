import React from "react";
import Login from "./components/Login";
import SignUp from "./components/SignUp";
import FileUpload from "./components/FileUpload";
import Home from "./components/Home";
import Shared from "./components/Shared";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

function App() {
  return (
    //Router wraps the entire application and provides the context for the routing to work without it it will not work. This is the root router and should wrap all of the routes. It enables navigation using the react-router-dom library.
    //The Routes component is the container for all Route components. It is where you define the different possible routes for the app. Without you will not be able
    //to associate a url with a specific component
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/fileupload" element={<FileUpload />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/shared" element={<Shared />} />
      </Routes>
    </Router>
  );
}

export default App;
