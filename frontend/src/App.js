import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import "./App.css";
import ProtectedLayout from "./components/ProtectedLayout";
import DashboardPage from "./pages/DashboardPage";
import DailyGoalPage from "./pages/DailyGoalPage";
import HistoryPage from "./pages/HistoryPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import StatisticsPage from "./pages/StatisticsPage";
import SubjectPage from "./pages/SubjectPage";
import TimerPage from "./pages/TimerPage";

function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/dashboard" element={<Navigate to="/" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route element={<ProtectedLayout />}>
          <Route path="/timer" element={<TimerPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/subjects" element={<SubjectPage />} />
          <Route path="/goal" element={<DailyGoalPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
