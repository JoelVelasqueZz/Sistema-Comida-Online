import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth debe ser usado dentro de AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar usuario del localStorage
    console.log('🔄 AuthContext - Inicializando...');
    const currentUser = authService.getCurrentUser();
    console.log('👤 AuthContext - Usuario desde localStorage:', currentUser);

    if (currentUser) {
      console.log('✅ AuthContext - Usuario cargado:', {
        id: currentUser.id,
        name: currentUser.name,
        email: currentUser.email,
        role: currentUser.role
      });
      setUser(currentUser);
    } else {
      console.log('⚠️ AuthContext - No hay usuario en localStorage');
    }

    setLoading(false);
  }, []);

  const login = async (email, password) => {
    console.log('🔐 AuthContext - Login iniciado');
    const data = await authService.login({ email, password });
    console.log('✅ AuthContext - Login exitoso, guardando usuario:', data.user);
    setUser(data.user);
    return data;
  };

  const register = async (userData) => {
    const data = await authService.register(userData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await authService.logout();
    setUser(null);
  };

  const updateUser = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const value = {
    user,
    loading,
    login,
    register,
    logout,
    updateUser,
    isAuthenticated: !!user
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};