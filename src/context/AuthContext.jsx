import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(undefined);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email, password) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');
    const foundUser = users.find((u) =>
      u.email === email && u.password === password
    );

    if (!foundUser) {
      throw new Error('Invalid credentials');
    }

    const userWithoutPassword = {
      id: foundUser.id,
      name: foundUser.name,
      email: foundUser.email,
      role: foundUser.role,
      createdAt: foundUser.createdAt,
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
  };

  const register = async (name, email, password, role) => {
    const users = JSON.parse(localStorage.getItem('users') || '[]');

    if (users.find((u) => u.email === email)) {
      throw new Error('Email already exists');
    }

    const newUser = {
      id: `user-${Date.now()}`,
      name,
      email,
      password,
      role,
      createdAt: new Date().toISOString(),
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    const userWithoutPassword = { ...newUser };
    delete userWithoutPassword.password;

    localStorage.setItem('user', JSON.stringify(userWithoutPassword));
    setUser(userWithoutPassword);
  };

  const logout = () => {
    localStorage.removeItem('user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, login, register, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}