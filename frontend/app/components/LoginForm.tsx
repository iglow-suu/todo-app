import { useState } from 'react';
import { authApi } from '../lib/api';
import { AuthStorage } from '../lib/auth';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
}

export default function LoginForm({ onSuccess, onSwitchToRegister }: LoginFormProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // デバッグ用ログ
  console.log('LoginForm render - email:', email, 'password:', password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    const result = await authApi.login({ email, password });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      AuthStorage.setToken(result.data.token);
      AuthStorage.setUser(result.data.user);
      onSuccess();
    }

    setIsLoading(false);
  };

  return (
    <div className="max-w-md mx-auto bg-white p-8 rounded-lg shadow-lg">
      <style dangerouslySetInnerHTML={{
        __html: `
          .login-form input:-webkit-autofill,
          .login-form input:-webkit-autofill:hover,
          .login-form input:-webkit-autofill:focus,
          .login-form input:-webkit-autofill:active {
            -webkit-box-shadow: 0 0 0 30px white inset !important;
            -webkit-text-fill-color: #111827 !important;
            background-color: white !important;
            color: #111827 !important;
          }
          .login-form input {
            background-color: white !important;
            color: #111827 !important;
          }
        `
      }} />
      <h2 className="text-2xl font-bold text-center mb-6 text-gray-800">ログイン</h2>
      
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="login-form space-y-4" autoComplete="off">
        <div>
          <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
            メールアドレス
          </label>
          <input
            type="text"
            id="email"
            name="email"
            value={email}
            onChange={(e) => {
              console.log('Email input change:', e.target.value);
              setEmail(e.target.value);
            }}
            placeholder="example@email.com"
            autoComplete="off"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            style={{ 
              WebkitTextFillColor: '#111827 !important',
              WebkitBoxShadow: '0 0 0 1000px white inset !important',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
            disabled={isLoading}
          />
        </div>
        
        <div>
          <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
            パスワード
          </label>
          <input
            type="password"
            id="password"
            name="password"
            value={password}
            onChange={(e) => {
              console.log('Password input change:', e.target.value);
              setPassword(e.target.value);
            }}
            placeholder="パスワードを入力"
            autoComplete="off"
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white text-gray-900"
            style={{ 
              WebkitTextFillColor: '#111827 !important',
              WebkitBoxShadow: '0 0 0 1000px white inset !important',
              transition: 'background-color 5000s ease-in-out 0s'
            }}
            disabled={isLoading}
          />
        </div>
        
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {isLoading ? 'ログイン中...' : 'ログイン'}
        </button>
      </form>
      
      <div className="mt-6 text-center">
        <p className="text-sm text-gray-600">
          アカウントをお持ちでない方は{' '}
          <button
            onClick={onSwitchToRegister}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            こちらから登録
          </button>
        </p>
      </div>
    </div>
  );
}
