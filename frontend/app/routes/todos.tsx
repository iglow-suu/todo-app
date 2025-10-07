import { useState, useCallback } from 'react';
import { Navigate, useNavigate } from 'react-router';
import type { Group } from '../lib/api';
import TodoForm from '../components/TodoForm';
import TodoList from '../components/TodoList';
import GroupList from '../components/GroupList';
import GroupForm from '../components/GroupForm';
import { AuthStorage } from '../lib/auth';
import { authApi } from '../lib/api';

export default function Todos() {
  const navigate = useNavigate();

  if (!AuthStorage.isAuthenticated()) {
    return <Navigate to="/auth" replace />;
  }

  const user = AuthStorage.getUser();

  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [selectedGroup, setSelectedGroup] = useState<Group | null>(null);
  const [showGroupForm, setShowGroupForm] = useState(false);

  const handleGroupSelect = useCallback((group: Group) => {
    setSelectedGroup(group);
  }, []);

  const handleLogout = async () => {
    try {
      await authApi.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      AuthStorage.logout();
      navigate('/auth', { replace: true });
    }
  };

  const handleTodoCreated = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGroupCreated = (group: Group) => {
    setSelectedGroup(group);
    setShowGroupForm(false);
    setRefreshTrigger(prev => prev + 1);
  };

  const handleGroupDeleted = () => {
    setRefreshTrigger(prev => prev + 1);
  };

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
      <main className="max-w-7xl mx-auto p-4 pb-8">
        <div className="grid gap-6 lg:grid-cols-4">
          {/* グループ選択 */}
          <div className="lg:col-span-1">
            <div className="space-y-6">
              {!showGroupForm ? (
                <>
                  <GroupList 
                    onGroupSelect={handleGroupSelect}
                    selectedGroupId={selectedGroup?.id}
                    onGroupDeleted={handleGroupDeleted}
                  />
                  <div className="bg-white rounded-lg shadow-md p-6">
                    <button
                      onClick={() => setShowGroupForm(true)}
                      className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition duration-200"
                    >
                      ➕ 新しいグループを作成
                    </button>
                  </div>
                </>
              ) : (
                <GroupForm
                  onGroupCreated={handleGroupCreated}
                  onCancel={() => setShowGroupForm(false)}
                />
              )}
            </div>
          </div>

          {/* TODO作成フォーム */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-lg shadow-sm p-6 sticky top-24">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                ✨ 新しいTODO
              </h2>
              {selectedGroup ? (
                <div className="mb-4 p-3 bg-blue-50 rounded-md">
                  <div className="flex items-center space-x-2">
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: selectedGroup.color || '#3B82F6' }}
                    ></div>
                    <span className="text-sm font-medium text-blue-800">
                      {selectedGroup.name}
                    </span>
                  </div>
                </div>
              ) : (
                <div className="mb-4 p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-600">
                    グループを選択してTODOを作成してください
                  </p>
                </div>
              )}
              <TodoForm 
                onTodoCreated={handleTodoCreated}
                selectedGroup={selectedGroup}
              />
            </div>
          </div>

          {/* TODOリスト */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">
                📋 TODOリスト
                {selectedGroup && (
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    - {selectedGroup.name}
                  </span>
                )}
              </h2>
              <TodoList 
                refreshTrigger={refreshTrigger}
                selectedGroup={selectedGroup}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
