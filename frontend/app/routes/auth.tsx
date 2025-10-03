import { useState, useEffect } from 'react';
import { Navigate } from 'react-router';
import type { Route } from "./+types/auth";
import LoginForm from '../components/LoginForm';
import RegisterForm from '../components/RegisterForm';
import { AuthStorage } from '../lib/auth';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "ログイン - TODO アプリ" },
    { name: "description", content: "TODO アプリにログインしてください" },
  ];
}

export default function Auth() {
  const [showRegister, setShowRegister] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  useEffect(() => {
    // クライアントサイドでのみ認証チェック
    const authenticated = AuthStorage.isAuthenticated();
    setIsAuthenticated(authenticated);
  }, []);

  // SSR中は何も表示しない
  if (isAuthenticated === null) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  // 既にログイン済みの場合はTODO画面にリダイレクト
  if (isAuthenticated) {
    return <Navigate to="/todos" replace />;
  }

  const handleAuthSuccess = () => {
    // ログイン成功後はTODO画面にリダイレクト
    window.location.href = '/todos';
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
