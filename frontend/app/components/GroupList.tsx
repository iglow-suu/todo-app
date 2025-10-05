import React, { useState, useEffect } from 'react';
import { groupApi } from '../lib/api';
import type { Group, GroupMember } from '../lib/api';

interface GroupListProps {
  onGroupSelect: (group: Group) => void;
  selectedGroupId?: string;
  onGroupDeleted?: () => void;
}

const GroupList: React.FC<GroupListProps> = ({ onGroupSelect, selectedGroupId, onGroupDeleted }) => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteConfirmGroup, setDeleteConfirmGroup] = useState<Group | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleDeleteClick = (e: React.MouseEvent, group: Group) => {
    e.stopPropagation(); // グループ選択を防ぐ
    setDeleteConfirmGroup(group);
  };

  const handleDeleteConfirm = async () => {
    if (!deleteConfirmGroup) return;

    try {
      setIsDeleting(true);
      const response = await groupApi.delete(deleteConfirmGroup.id);
      
      if (response.error) {
        setError(response.error);
      } else {
        // 削除されたグループが選択されていた場合、別のグループを選択
        if (selectedGroupId === deleteConfirmGroup.id) {
          const remainingGroups = groups.filter(g => g.id !== deleteConfirmGroup.id);
          if (remainingGroups.length > 0) {
            onGroupSelect(remainingGroups[0]);
          }
        }
        
        // グループリストを更新
        await fetchGroups();
        
        // 親コンポーネントに削除完了を通知
        if (onGroupDeleted) {
          onGroupDeleted();
        }
      }
    } catch (error) {
      setError('グループの削除に失敗しました');
    } finally {
      setIsDeleting(false);
      setDeleteConfirmGroup(null);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmGroup(null);
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
                <div className="flex items-center space-x-2">
                  {userRole === 'OWNER' && (
                    <button
                      onClick={(e) => handleDeleteClick(e, group)}
                      className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition-colors"
                      title="グループを削除"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  )}
                  {isSelected && (
                    <div className="text-blue-500">
                      <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 削除確認ダイアログ */}
      {deleteConfirmGroup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center mb-4">
              <div className="w-10 h-10 bg-red-100 rounded-full flex items-center justify-center mr-3">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900">グループを削除</h3>
            </div>
            
            <p className="text-gray-600 mb-6">
              「<span className="font-semibold">{deleteConfirmGroup.name}</span>」を削除しますか？
              <br />
              <span className="text-sm text-red-600 mt-2 block">
                ⚠️ この操作は取り消せません。グループ内のすべてのTODOも削除されます。
              </span>
            </p>
            
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteCancel}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors disabled:opacity-50"
              >
                キャンセル
              </button>
              <button
                onClick={handleDeleteConfirm}
                disabled={isDeleting}
                className="flex-1 px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                {isDeleting ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    削除中...
                  </div>
                ) : (
                  '削除する'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GroupList;
