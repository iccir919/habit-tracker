import { Link } from 'react-router-dom';
import './LandingPage.css';

function LandingPage() {
    return (
        <div className="landing-page">
            {/* Hero Section */}
            <header className="landing-header">
                <nav className="landing-nav">
                    <div className="container">
                        <div className="nav-content">
                            <div className="logo">📊 Habit Tracker</div>
                            <div className="nav-links">
                                <Link to="/login" className="nav-link">Sign In</Link>
                                <Link to="/register" className="nav-link">Get Started</Link>
                            </div>
                        </div>
                    </div>
                </nav>

                <div className="hero">
                    <div className="container">
                        <div className="hero-content">
                            <h1 className="hero-title">
                                Built Your Habits, <br />
                                One Day at a Time
                            </h1>
                            <p className="hero-description">
                                Track your daily habits and long-term goals with a simple, beautiful interface.
                                Stay consistent, see your progress, and achieve what matters.
                            </p>
                            <div className="hero-actions">
                                <Link to="/register" className="btn btn-primary btn-large">
                                    Start Tracking
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </header>

            {/* Footer */}
            <footer className="landing-footer">
                <div className="container">
                    <div className="footer-content">
                        <p>&copy; 2026 Habit Tracker. Built with ❤️</p>
                    </div>
                </div>
            </footer>

        </div>
    );
}

export default LandingPage;
