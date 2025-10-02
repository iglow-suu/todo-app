import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import type { Route } from "./+types/todos";
import type { User } from '../lib/api';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import { AuthStorage } from '../lib/auth';
import { authApi } from '../lib/api';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TODO管理 - TODO アプリ" },
    { name: "description", content: "あなたのTODOを管理しましょう" },
  ];
}

export default function Todos() {
  const [user, setUser] = useState<User | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // クライアントサイドでのみ認証チェック
  useEffect(() => {
    const authenticated = AuthStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
    if (authenticated) {
      const userData = AuthStorage.getUser();
      setUser(userData);
    }
    setLoading(false);
  }, []);

  // SSR中またはロード中は何も表示しない
  if (loading || isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 認証されていない場合はリダイレクト
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }


  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthStorage.logout();
      window.location.href = '/auth';
    }
  };

  const handleTodoCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-gray-800">📝 TODO管理</h1>
            <div className="hidden sm:block text-sm text-gray-500">
              効率的にタスクを管理しましょう
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            {user && (
              <div className="text-right">
                <div className="text-sm font-medium text-gray-800">
                  {user.name || 'ユーザー'}
                </div>
                <div className="text-xs text-gray-500">
                  {user.email}
                </div>
              </div>
            )}
            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition duration-200 text-sm font-medium"
            >
              ログアウト
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto p-4 pb-8">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* TODO作成フォーム */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ✨ 新しいTODO
              </h2>
              <TodoForm onTodoCreated={handleTodoCreated} />
            </div>
          </div>

          {/* TODOリスト */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 TODOリスト
              </h2>
              <TodoList refreshTrigger={refreshTrigger} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
