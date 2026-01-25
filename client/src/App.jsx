import { BrowserRouter as Router, Routes, Route, Navigate }from 'react-router-dom';

import { AuthProvider } from './context/AuthContext';
import { useAuth } from './hooks/useAuth';

import Layout from './components/layout/Layout';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import Dashboard from './pages/Dashboard';
import HabitsPage from './pages/HabitsPage';

function PrivateRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? children : <Navigate to="/login" />;
}

function PublicRoute({ children }) {
    const { isAuthenticated } = useAuth();
    return !isAuthenticated ? children : <Navigate to="/dashboard" />;
}

function AppRoutes() {
    return (
        <Routes>

            {/* Landing page */}
            <Route path="/" element={
                <PublicRoute>
                    <LandingPage />
                </PublicRoute>
            } />

            { /* Auth pages */}
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

            { /* Protected pages */}
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