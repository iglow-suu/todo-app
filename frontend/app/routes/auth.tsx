import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { Route } from './+types/auth';
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { AuthStorage } from '../lib/auth';

export function meta({ }: Route.MetaArgs) {
  return [
    { title: "ログイン - TODO アプリ" },
    { name: "description", content: "TODO アプリにログインしてください" },
  ];
}

export default function Auth() {
  const [showRegister, setShowRegister] = useState(false);
  const navigate = useNavigate();

  if (AuthStorage.isAuthenticated()) {
    return <Navigate to="/todos" replace />;
  }

  const handleAuthSuccess = () => {
    navigate('/todos', { replace: true });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* ロゴ・タイトル部分 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">TODO アプリ</h1>
          <p className="text-gray-600">タスク管理を始めましょう</p>
        </div>

        {/* 認証フォーム */}
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

        {/* フッター */}
        <div className="text-center mt-6 text-sm text-gray-500">
          <p>© 2024 TODO アプリ. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
