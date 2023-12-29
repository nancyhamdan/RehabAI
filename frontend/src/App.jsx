import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Login from "./pages/Login"
import PatientHome from "./pages/PatientHome";
import Exercise from "./pages/Exercise/Exercise"

import "./App.css";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/exercises" element={<PatientHome />} />
        <Route path="/exercises/:id" element={<Exercise />} />
      </Routes>
    </Router>
  );
}

export default App;