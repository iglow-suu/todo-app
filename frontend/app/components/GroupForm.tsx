import React, { useState } from 'react';
import { groupApi } from '../lib/api';
import type { Group } from '../lib/api';

interface GroupFormProps {
  onGroupCreated: (group: Group) => void;
  onCancel: () => void;
}

const GroupForm: React.FC<GroupFormProps> = ({ onGroupCreated, onCancel }) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('グループ名は必須です');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const response = await groupApi.create({
        name: name.trim(),
        description: description.trim() || undefined,
        color
      });

      if (response.error) {
        setError(response.error);
      } else if (response.data) {
        onGroupCreated(response.data);
        // フォームをリセット
        setName('');
        setDescription('');
        setColor('#3B82F6');
      }
    } catch (error) {
      setError('グループの作成に失敗しました');
    } finally {
      setIsLoading(false);
    }
  };

  const colorOptions = [
    { value: '#3B82F6', label: '青', color: '#3B82F6' },
    { value: '#10B981', label: '緑', color: '#10B981' },
    { value: '#F59E0B', label: 'オレンジ', color: '#F59E0B' },
    { value: '#EF4444', label: '赤', color: '#EF4444' },
    { value: '#8B5CF6', label: '紫', color: '#8B5CF6' },
    { value: '#06B6D4', label: 'シアン', color: '#06B6D4' },
    { value: '#84CC16', label: 'ライム', color: '#84CC16' },
    { value: '#F97316', label: 'オレンジ', color: '#F97316' }
  ];

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">新しいグループを作成</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
            グループ名 *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="グループ名を入力してください"
            autoComplete="off"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            説明
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            placeholder="グループの説明を入力してください（任意）"
            autoComplete="off"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>

        <div>
          <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-1">
            グループカラー
          </label>
          <div className="grid grid-cols-4 gap-2">
            {colorOptions.map((option) => (
              <button
                key={option.value}
                type="button"
                onClick={() => setColor(option.value)}
                className={`w-full h-10 rounded-md border-2 flex items-center justify-center text-sm font-medium transition-all ${
                  color === option.value
                    ? 'border-gray-900 ring-2 ring-gray-900 ring-offset-2'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
                style={{ backgroundColor: option.color }}
              >
                <span className="text-white drop-shadow-sm">{option.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <div className="flex space-x-3 pt-4">
          <button
            type="submit"
            disabled={isLoading || !name.trim()}
            className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200"
          >
            {isLoading ? '作成中...' : 'グループを作成'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition duration-200"
          >
            キャンセル
          </button>
        </div>
      </form>
    </div>
  );
};

export default GroupForm;
