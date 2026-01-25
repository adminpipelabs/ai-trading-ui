import { BrowserRouter, Routes, Route } from "react-router-dom";
import PipeLabsApp from "./pages/AdminDashboard";
import BotManagement from "./pages/BotManagement";
import "./styles/globals.css";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PipeLabsApp />} />
        <Route path="/bots" element={<BotManagement />} />
      </Routes>
    </BrowserRouter>
  );
}
