import { BrowserRouter as Router, Routes, Route, Navigate }from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

import Layout from './components/layout/Layout.jsx';
import LandingPage from './pages/LandingPage.jsx';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import Dashboard from './pages/Dashboard.jsx';
import HabitsPage from './pages/HabitsPage.jsx';
import DailyViewPage from './pages/DailyViewPage.jsx';

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return !isAuthenticated ? children : <Navigate to="/habits" />;
}

function AppRoutes() {
    return (
        <Routes>

            {/* Landing page - public */}
            <Route path="/" element={
                <PublicRoute>
                    <LandingPage />
                </PublicRoute>
            } />

            { /* Auth pages - public */}
            <Route path="/login" element={
                <PublicRoute>
                    <LoginPage />
                </PublicRoute>
            } />
            <Route path="/register" element={
                <PublicRoute>
                    <RegisterPage />
                </PublicRoute>
            } />

            { /* App pages - protected */}
            <Route element={<Layout />}>
                <Route path="/dashboard" element={
                    <PrivateRoute>
                        <Dashboard />
                    </PrivateRoute>
                } />
                <Route path="/habits" element={
                    <PrivateRoute>
                        <HabitsPage />
                    </PrivateRoute>
                } />
                <Route path="/today" element={
                    <PrivateRoute>
                        <DailyViewPage />
                    </PrivateRoute>
                } />
            </Route>

            <Route path="/" element={<Navigate to="/dashboard" />} />
        </Routes>
    );
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </Router>
    )
}

export default App;