import { useEffect } from 'react';
import { Navigate } from 'react-router';
import type { Route } from "./+types/home";
import { AuthStorage } from '../lib/auth';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "TODO アプリ - タスク管理をシンプルに" },
    { name: "description", content: "効率的なTODO管理アプリ。タスクを整理して生産性を向上させましょう。" },
  ];
}

export default function Home() {
  useEffect(() => {
    // 認証状態に応じて適切なページにリダイレクト
    const isAuthenticated = AuthStorage.isAuthenticated();
    if (isAuthenticated) {
      window.location.href = '/todos';
    } else {
      window.location.href = '/auth';
    }
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  );
}
