import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import Layout from "./components/Layout"
import LandingPage from "./pages/LandingPage"
import LoginPage from "./pages/LoginPage"
import SignUpPage from "./pages/SignUpPage"
import OTPVerificationPage from "./pages/OTPVerificationPage"
import AboutToPayPage from "./pages/AboutToPayPage"
import DashboardPage from "./pages/DashboardPage"
import CardsPage from "./pages/CardsPage"
import HistoryPage from "./pages/HistoryPage"
import GoalsPage from "./pages/GoalsPage"
import CategoryGoalDetailsPage from "./pages/CategoryGoalDetailsPage"
import ProfilePage from "./pages/ProfilePage"
import ChatPage from "./pages/ChatPage"
import ProblemStatementPage from "./pages/ProblemStatementPage"


function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/verify-otp" element={<OTPVerificationPage />} />
          <Route path="/about-to-pay" element={<AboutToPayPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/cards" element={<CardsPage />} />
          <Route path="/history" element={<HistoryPage />} />
          <Route path="/goals" element={<GoalsPage />} />
          <Route path="/goals/category/:categoryName" element={<CategoryGoalDetailsPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/chat" element={<ChatPage />} />
          <Route path="/mission" element={<ProblemStatementPage />} />

        </Routes>
      </Layout>
    </Router>
  )
}

export default App
