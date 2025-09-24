import { useState, useEffect } from 'react';
import { Todo, todoApi } from '../lib/api';

interface TodoListProps {
  refreshTrigger: number;
}

export default function TodoList({ refreshTrigger }: TodoListProps) {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

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

  if (todos.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>まだTODOがありません。</p>
        <p>上のフォームから新しいTODOを追加してみましょう！</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        TODOリスト ({todos.length}個)
      </h3>
      
      {todos.map((todo) => (
        <div
          key={todo.id}
          className={`bg-white p-4 rounded-lg shadow-sm border-l-4 ${
            todo.completed ? 'border-green-500 bg-green-50' : 'border-blue-500'
          } transition duration-200`}
        >
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <input
                type="checkbox"
                checked={todo.completed}
                onChange={() => handleToggleComplete(todo)}
                className="mt-1 h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <div className="flex-1">
                <h4 className={`font-medium ${
                  todo.completed ? 'line-through text-gray-500' : 'text-gray-800'
                }`}>
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className={`mt-1 text-sm ${
                    todo.completed ? 'line-through text-gray-400' : 'text-gray-600'
                  }`}>
                    {todo.description}
                  </p>
                )}
                <p className="mt-2 text-xs text-gray-400">
                  作成日時: {new Date(todo.createdAt).toLocaleString('ja-JP')}
                </p>
              </div>
            </div>
            
            <button
              onClick={() => handleDelete(todo.id)}
              className="ml-4 text-red-600 hover:text-red-800 transition duration-200"
              title="削除"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
