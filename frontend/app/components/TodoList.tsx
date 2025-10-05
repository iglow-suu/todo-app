import { useState, useEffect } from 'react';
import type { Todo, Priority, Status, Group } from '../lib/api';
import { todoApi } from '../lib/api';
import TodoFilter, { type FilterOptions } from './TodoFilter';

interface TodoListProps {
  refreshTrigger: number;
  selectedGroup?: Group | null;
}

const getPriorityDisplay = (priority: Priority) => {
  switch (priority) {
    case 'HIGH':
      return { emoji: '🔴', text: '高', color: 'border-red-500 bg-red-50' };
    case 'MEDIUM':
      return { emoji: '🟡', text: '中', color: 'border-yellow-500 bg-yellow-50' };
    case 'LOW':
      return { emoji: '🟢', text: '低', color: 'border-green-500 bg-green-50' };
    default:
      return { emoji: '🟡', text: '中', color: 'border-yellow-500 bg-yellow-50' };
  }
};

const getStatusDisplay = (status: Status) => {
  switch (status) {
    case 'PENDING':
      return { emoji: '⏳', text: '未完了', color: 'border-gray-400 bg-gray-50' };
    case 'IN_PROGRESS':
      return { emoji: '🚀', text: '進行中', color: 'border-blue-500 bg-blue-50' };
    case 'COMPLETED':
      return { emoji: '✅', text: '完了済み', color: 'border-green-500 bg-green-50' };
    default:
      return { emoji: '⏳', text: '未完了', color: 'border-gray-400 bg-gray-50' };
  }
};

const getPriorityOrder = (priority: Priority) => {
  switch (priority) {
    case 'HIGH': return 3;
    case 'MEDIUM': return 2;
    case 'LOW': return 1;
    default: return 2;
  }
};

export default function TodoList({ refreshTrigger, selectedGroup }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editPriority, setEditPriority] = useState<Priority>('MEDIUM');
  const [editStatus, setEditStatus] = useState<Status>('PENDING');
  const [filters, setFilters] = useState<FilterOptions>({
    priority: 'ALL',
    status: 'ALL',
    search: ''
  });

  const fetchTodos = async () => {
    setIsLoading(true);
    setError('');
    
    const result = await todoApi.getAll();
    
    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setTodos(result.data);
    }
    
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTodos();
  }, [refreshTrigger]);

  const handleToggleComplete = async (todo: Todo) => {
    const result = await todoApi.update(todo.id, { completed: !todo.completed });
    
    if (result.error) {
      setError(result.error);
    } else {
      setTodos(prev => prev.map(t => 
        t.id === todo.id ? { ...t, completed: !t.completed } : t
      ));
    }
  };

  const handleDelete = async (todoId: string) => {
    if (!confirm('このTODOを削除しますか？')) {
      return;
    }

    const result = await todoApi.delete(todoId);
    
    if (result.error) {
      setError(result.error);
    } else {
      setTodos(prev => prev.filter(t => t.id !== todoId));
    }
  };

  const handleStartEdit = (todo: Todo) => {
    setEditingId(todo.id);
    setEditTitle(todo.title);
    setEditDescription(todo.description || '');
    setEditPriority(todo.priority || 'MEDIUM');
    setEditStatus(todo.status || 'PENDING');
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditTitle('');
    setEditDescription('');
    setEditPriority('MEDIUM');
    setEditStatus('PENDING');
  };

  const handleSaveEdit = async (todoId: string) => {
    if (!editTitle.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    const result = await todoApi.update(todoId, {
      title: editTitle.trim(),
      description: editDescription.trim() || undefined,
      priority: editPriority,
      status: editStatus
    });

    if (result.error) {
      setError(result.error);
    } else if (result.data) {
      setTodos(prev => prev.map(t => 
        t.id === todoId ? result.data! : t
      ));
      handleCancelEdit();
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent, todoId: string) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSaveEdit(todoId);
    } else if (e.key === 'Escape') {
      handleCancelEdit();
    }
  };

  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p className="mt-2 text-gray-600">TODOを読み込み中...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
        エラー: {error}
        <button 
          onClick={fetchTodos}
          className="ml-4 text-red-800 underline hover:no-underline"
        >
          再読み込み
        </button>
      </div>
    );
  }

  // フィルタリング機能
  const applyFilters = (todoList: Todo[]) => {
    return todoList.filter(todo => {
      // グループフィルター
      if (selectedGroup && todo.groupId !== selectedGroup.id) {
        return false;
      }

      // 優先度フィルター
      if (filters.priority !== 'ALL' && todo.priority !== filters.priority) {
        return false;
      }

      // ステータスフィルター
      if (filters.status !== 'ALL') {
        const todoStatus = todo.status || (todo.completed ? 'COMPLETED' : 'PENDING');
        if (todoStatus !== filters.status) {
          return false;
        }
      }

      // 検索フィルター
      if (filters.search) {
        const searchTerm = filters.search.toLowerCase();
        const matchesTitle = todo.title.toLowerCase().includes(searchTerm);
        const matchesDescription = todo.description?.toLowerCase().includes(searchTerm) || false;
        if (!matchesTitle && !matchesDescription) {
          return false;
        }
      }

      return true;
    });
  };

  // フィルタリング後にソート
  const filteredTodos = applyFilters(todos);
  const sortedTodos = [...filteredTodos].sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1; // 未完了を上に
    }
    return getPriorityOrder(b.priority || 'MEDIUM') - getPriorityOrder(a.priority || 'MEDIUM');
  });

  const handleFilterChange = (newFilters: FilterOptions) => {
    setFilters(newFilters);
  };

  return (
    <div className="space-y-3">
      {/* フィルターコンポーネント */}
      <TodoFilter onFilterChange={handleFilterChange} />
      
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-800">
          TODOリスト ({sortedTodos.length}/{todos.length}個)
        </h3>
        {filteredTodos.length !== todos.length && (
          <span className="text-sm text-gray-500">
            {todos.length - filteredTodos.length}個を非表示
          </span>
        )}
      </div>
      
      {sortedTodos.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {!selectedGroup ? (
            <>
              <p>グループを選択してください。</p>
              <p>左側のグループ一覧からグループを選択してTODOを表示します。</p>
            </>
          ) : todos.length === 0 ? (
            <>
              <p>まだTODOがありません。</p>
              <p>上のフォームから新しいTODOを追加してみましょう！</p>
            </>
          ) : (
            <>
              <p>フィルター条件に一致するTODOがありません。</p>
              <p>フィルターを変更するか、新しいTODOを追加してください。</p>
            </>
          )}
        </div>
      ) : (
        sortedTodos.map((todo) => {
        // 既存データの互換性を確保
        const safeTodo = {
          ...todo,
          priority: todo.priority || 'MEDIUM' as Priority
        };
        const priorityDisplay = getPriorityDisplay(safeTodo.priority);
        return (
          <div
            key={safeTodo.id}
            className={`group bg-white p-4 rounded-lg shadow-sm border-l-4 hover:shadow-md ${
              safeTodo.completed ? priorityDisplay.color : priorityDisplay.color
            } transition duration-200`}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                <input
                  type="checkbox"
                  checked={safeTodo.completed}
                  onChange={() => handleToggleComplete(safeTodo)}
                  className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <div className="flex-1">
                  {editingId === safeTodo.id ? (
                    // 編集モード
                    <div className="space-y-2">
                      <input
                        type="text"
                        name="editTitle"
                        autoComplete="off"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onKeyDown={(e) => handleKeyPress(e, safeTodo.id)}
                        className="w-full px-2 py-1 text-sm font-medium border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                        style={{ color: '#111827', backgroundColor: '#ffffff' }}
                        placeholder="タイトルを入力..."
                        autoFocus
                      />
                    <textarea
                      name="editDescription"
                      autoComplete="off"
                      value={editDescription}
                      onChange={(e) => setEditDescription(e.target.value)}
                      onKeyDown={(e) => handleKeyPress(e, safeTodo.id)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none text-gray-900 bg-white"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                      placeholder="説明を入力..."
                      rows={2}
                    />
                    <select
                      name="editPriority"
                      value={editPriority}
                      onChange={(e) => setEditPriority(e.target.value as Priority)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    >
                      <option value="LOW">🟢 低</option>
                      <option value="MEDIUM">🟡 中</option>
                      <option value="HIGH">🔴 高</option>
                    </select>
                    <select
                      name="editStatus"
                      value={editStatus}
                      onChange={(e) => setEditStatus(e.target.value as Status)}
                      className="w-full px-2 py-1 text-sm border border-blue-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900 bg-white"
                      style={{ color: '#111827', backgroundColor: '#ffffff' }}
                    >
                      <option value="PENDING">⏳ 未完了</option>
                      <option value="IN_PROGRESS">🚀 進行中</option>
                      <option value="COMPLETED">✅ 完了済み</option>
                    </select>
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleSaveEdit(safeTodo.id)}
                        className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition duration-200"
                      >
                        保存
                      </button>
                      <button
                        onClick={handleCancelEdit}
                        className="px-3 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition duration-200"
                      >
                        キャンセル
                      </button>
                    </div>
                  </div>
                ) : (
                  // 表示モード
                  <div className="p-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h4 className={`font-medium flex-1 ${
                        safeTodo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                      }`}>
                        {safeTodo.title}
                      </h4>
                      <div className="flex space-x-1">
                        <span className="text-xs px-2 py-1 rounded-full bg-gray-100 text-gray-600">
                          {priorityDisplay.emoji} {priorityDisplay.text}
                        </span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          safeTodo.status === 'COMPLETED' ? 'bg-green-100 text-green-700' :
                          safeTodo.status === 'IN_PROGRESS' ? 'bg-blue-100 text-blue-700' :
                          'bg-orange-100 text-orange-700'
                        }`}>
                          {getStatusDisplay(safeTodo.status || 'PENDING').emoji} {getStatusDisplay(safeTodo.status || 'PENDING').text}
                        </span>
                      </div>
                    </div>
                    {safeTodo.description && (
                      <p className={`mt-1 text-sm ${
                        safeTodo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                      }`}>
                        {safeTodo.description}
                      </p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">
                      作成日時: {new Date(safeTodo.createdAt).toLocaleString('ja-JP')}
                    </p>
                  </div>
                )}
              </div>
            </div>
            
            <div className="flex space-x-2">
              {editingId === safeTodo.id ? (
                // 編集中は編集ボタンを非表示
                <div className="w-10"></div>
              ) : (
                <button
                  onClick={() => handleStartEdit(safeTodo)}
                  className="text-blue-600 hover:text-blue-800 transition duration-200"
                  title="編集"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                </button>
              )}
              
              <button
                onClick={() => handleDelete(safeTodo.id)}
                className="text-red-600 hover:text-red-800 transition duration-200"
                title="削除"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
              </div>
            </div>
          </div>
        );
      })
      )}
    </div>
  );
}
