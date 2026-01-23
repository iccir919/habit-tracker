import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

function Header() {
    const { user, logout } = useAuth();
    const navigate = useNavigate();

    const handleLogout = () => {
        logout();
        navigate('/login');
    };
    
    return (
        <header className="header">
            <div className="container header-content">
                <Link to="/dashboard" className="logo">
                    📊 Habit Tracker
                </Link>

                <div className="user-menu">
                    <span className="user-name">{user?.name}</span>
                    <button onClick={handleLogout} className="btn btn-secondary">
                        Logout
                    </button>
                </div>
            </div>
        </header>
    );
}

export default Header;