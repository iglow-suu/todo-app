import { useState } from 'react';
import { todoApi } from '../lib/api';
import type { Priority, Status, Group } from '../lib/api';

interface TodoFormProps {
  onTodoCreated: () => void;
  selectedGroup?: Group | null;
}

export default function TodoForm({ onTodoCreated, selectedGroup }: TodoFormProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');
  const [status, setStatus] = useState<Status>('PENDING');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!title.trim()) {
      setError('タイトルを入力してください');
      return;
    }

    if (!selectedGroup) {
      setError('グループを選択してください');
      return;
    }

    setIsLoading(true);

    const result = await todoApi.create({
      title: title.trim(),
      description: description.trim() || undefined,
      priority: priority,
      status: status,
      groupId: selectedGroup.id
    });

    if (result.error) {
      setError(result.error);
    } else {
      setTitle('');
      setDescription('');
      setPriority('MEDIUM');
      setStatus('PENDING');
      onTodoCreated();
    }

    setIsLoading(false);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4 text-gray-800">新しいTODOを追加</h3>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}

      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            タイトル *
          </label>
          <input
            type="text"
            id="title"
            name="title"
            autoComplete="off"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="何をしますか？"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isLoading}
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            説明（任意）
          </label>
          <textarea
            id="description"
            name="description"
            autoComplete="off"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="詳細を入力してください..."
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none text-gray-900 bg-white"
            disabled={isLoading}
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>
        
        <div>
          <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">
            優先度
          </label>
          <select
            id="priority"
            name="priority"
            value={priority}
            onChange={(e) => setPriority(e.target.value as Priority)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isLoading}
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          >
            <option value="LOW">🟢 低</option>
            <option value="MEDIUM">🟡 中</option>
            <option value="HIGH">🔴 高</option>
          </select>
        </div>

        <div>
          <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
            ステータス
          </label>
          <select
            id="status"
            name="status"
            value={status}
            onChange={(e) => setStatus(e.target.value as Status)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            disabled={isLoading}
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          >
            <option value="PENDING">⏳ 未完了</option>
            <option value="IN_PROGRESS">🚀 進行中</option>
            <option value="COMPLETED">✅ 完了済み</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={isLoading || !title.trim() || !selectedGroup}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
        >
          {isLoading ? '追加中...' : 'TODOを追加'}
        </button>
      </form>
    </div>
  );
}
