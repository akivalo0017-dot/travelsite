import { createContext, useState, useEffect, useContext } from 'react';
import { query } from '../lib/db';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkUser();
    }, []);

    const checkUser = async () => {
        try {
            const token = localStorage.getItem('token');
            if (token) {
                // Verify token with your backend
                const userData = await verifyToken(token);
                setUser(userData);
            }
        } catch (error) {
            localStorage.removeItem('token');
        } finally {
            setLoading(false);
        }
    };

    const login = async (email, password) => {
        const users = await query(
            'SELECT * FROM users WHERE email = ? AND password_hash = ?',
            [email, hashPassword(password)] // You should hash passwords!
        );

        if (users.length > 0) {
            const user = users[0];
            const token = generateToken(user);
            localStorage.setItem('token', token);
            setUser(user);
            return user;
        }
        throw new Error('Invalid credentials');
    };

    const logout = () => {
        localStorage.removeItem('token');
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext);