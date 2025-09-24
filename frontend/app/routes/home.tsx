import { useState, useEffect } from 'react';
import type { Route } from "./+types/home";
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { AuthStorage } from '../lib/auth';
import { authApi } from '../lib/api';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TODO アプリ" },
    { name: "description", content: "シンプルなTODO管理アプリ" },
  ];
}

export default function Home() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [showRegister, setShowRegister] = useState(false);
  const [user, setUser] = useState(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    const authenticated = AuthStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      setUser(AuthStorage.getUser());
    }
  }, []);

  const handleAuthSuccess = () => {
    setIsAuthenticated(true);
    setUser(AuthStorage.getUser());
  };

  const handleLogout = async () => {
    await authApi.logout();
    AuthStorage.logout();
    setIsAuthenticated(false);
    setUser(null);
  };

  const handleTodoCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center p-4">
        {showRegister ? (
          <RegisterForm
            onSuccess={handleAuthSuccess}
            onSwitchToLogin={() => setShowRegister(false)}
          />
        ) : (
          <LoginForm
            onSuccess={handleAuthSuccess}
            onSwitchToRegister={() => setShowRegister(true)}
          />
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">TODO アプリ</h1>
          <div className="flex items-center space-x-4">
            {user && (
              <span className="text-sm text-gray-600">
                こんにちは、{user.name || user.email}さん
              </span>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto p-4">
        <div className="grid gap-6">
          <TodoForm onTodoCreated={handleTodoCreated} />
          <TodoList refreshTrigger={refreshTrigger} />
        </div>
      </main>
    </div>
  );
}
