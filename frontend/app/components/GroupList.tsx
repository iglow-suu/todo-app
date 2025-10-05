import React, { useState, useEffect } from 'react';
import { groupApi } from '../lib/api';
import type { Group, GroupMember } from '../lib/api';

interface GroupListProps {
  onGroupSelect: (group: Group) => void;
  selectedGroupId?: string;
}

const GroupList: React.FC<GroupListProps> = ({ onGroupSelect, selectedGroupId }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  // 最初のグループを自動選択
  useEffect(() => {
    if (groups.length > 0 && !selectedGroupId) {
      onGroupSelect(groups[0]);
    }
  }, [groups, selectedGroupId]); // onGroupSelectを依存関係から除外

  const fetchGroups = async () => {
    try {
      setIsLoading(true);
      const response = await groupApi.getAll();
      
      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        setGroups(response.data);
      }
    } catch (error) {
      setError('グループの取得に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGroupClick = (group: Group) => {
    onGroupSelect(group);
  };

  const getRoleDisplay = (role: string) => {
    switch (role) {
      case 'OWNER':
        return '👑 オーナー';
      case 'ADMIN':
        return '⚡ 管理者';
      case 'MEMBER':
        return '👤 メンバー';
      default:
        return role;
    }
  };

  const getUserRole = (group: Group): string => {
    const currentUser = localStorage.getItem('user');
    if (!currentUser) return 'MEMBER';
    
    try {
      const user = JSON.parse(currentUser);
      const membership = group.members.find(member => member.userId === user.id);
      return membership?.role || 'MEMBER';
    } catch {
      return 'MEMBER';
    }
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">グループ一覧</h2>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-16 bg-gray-200 rounded-md"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">グループ一覧</h2>
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
          <button
            onClick={fetchGroups}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            再試行
          </button>
        </div>
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">グループ一覧</h2>
        <div className="text-center py-8">
          <div className="text-gray-400 text-4xl mb-4">👥</div>
          <p className="text-gray-500 mb-4">まだグループがありません</p>
          <p className="text-sm text-gray-400">新しいグループを作成して始めましょう</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-lg font-semibold text-gray-900 mb-4">グループ一覧</h2>
      <div className="space-y-3">
        {groups.map((group) => {
          const userRole = getUserRole(group);
          const isSelected = selectedGroupId === group.id;
          
          return (
            <div
              key={group.id}
              onClick={() => handleGroupClick(group)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all hover:shadow-md ${
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3">
                  <div
                    className="w-4 h-4 rounded-full mt-1"
                    style={{ backgroundColor: group.color || '#3B82F6' }}
                  ></div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">{group.name}</h3>
                    {group.description && (
                      <p className="text-sm text-gray-600 mt-1">{group.description}</p>
                    )}
                    <div className="flex items-center space-x-4 mt-2">
                      <span className="text-xs text-gray-500">
                        👥 {group.members.length}人
                      </span>
                      <span className="text-xs text-gray-500">
                        📝 {group.todos.length}個のTODO
                      </span>
                      <span className="text-xs text-gray-500">
                        {getRoleDisplay(userRole)}
                      </span>
                    </div>
                  </div>
                </div>
                {isSelected && (
                  <div className="text-blue-500">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default GroupList;
