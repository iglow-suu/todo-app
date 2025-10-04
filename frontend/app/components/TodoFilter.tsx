import { useState } from 'react';
import type { Priority } from '../lib/api';

export interface FilterOptions {
  priority: Priority | 'ALL';
  status: 'ALL' | 'COMPLETED' | 'PENDING' | 'IN_PROGRESS';
  search: string;
}

interface TodoFilterProps {
  onFilterChange: (filters: FilterOptions) => void;
}

export default function TodoFilter({ onFilterChange }: TodoFilterProps) {
  const [filters, setFilters] = useState<FilterOptions>({
    priority: 'ALL',
    status: 'ALL',
    search: ''
  });

  const handleFilterChange = (newFilters: Partial<FilterOptions>) => {
    const updatedFilters = { ...filters, ...newFilters };
    setFilters(updatedFilters);
    onFilterChange(updatedFilters);
  };

  const clearAllFilters = () => {
    const clearedFilters: FilterOptions = {
      priority: 'ALL',
      status: 'ALL',
      search: ''
    };
    setFilters(clearedFilters);
    onFilterChange(clearedFilters);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm mb-6 border">
      <div className="flex flex-col space-y-4">
        {/* 検索バー */}
        <div>
          <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-2">
            🔍 検索
          </label>
          <input
            type="text"
            id="search"
            name="search"
            autoComplete="off"
            value={filters.search}
            onChange={(e) => handleFilterChange({ search: e.target.value })}
            placeholder="タイトルや説明で検索..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-gray-900 bg-white"
            style={{ color: '#111827', backgroundColor: '#ffffff' }}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* 優先度フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ⚡ 優先度フィルター
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange({ priority: 'ALL' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.priority === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => handleFilterChange({ priority: 'HIGH' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.priority === 'HIGH'
                    ? 'bg-red-600 text-white'
                    : 'bg-red-100 text-red-700 hover:bg-red-200'
                }`}
              >
                🔴 高
              </button>
              <button
                onClick={() => handleFilterChange({ priority: 'MEDIUM' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.priority === 'MEDIUM'
                    ? 'bg-yellow-600 text-white'
                    : 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
                }`}
              >
                🟡 中
              </button>
              <button
                onClick={() => handleFilterChange({ priority: 'LOW' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.priority === 'LOW'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                🟢 低
              </button>
            </div>
          </div>

          {/* ステータスフィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              ✅ ステータスフィルター
            </label>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => handleFilterChange({ status: 'ALL' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.status === 'ALL'
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                すべて
              </button>
              <button
                onClick={() => handleFilterChange({ status: 'PENDING' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.status === 'PENDING'
                    ? 'bg-orange-600 text-white'
                    : 'bg-orange-100 text-orange-700 hover:bg-orange-200'
                }`}
              >
                ⏳ 未完了
              </button>
              <button
                onClick={() => handleFilterChange({ status: 'IN_PROGRESS' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.status === 'IN_PROGRESS'
                    ? 'bg-blue-600 text-white'
                    : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
                }`}
              >
                🚀 進行中
              </button>
              <button
                onClick={() => handleFilterChange({ status: 'COMPLETED' })}
                className={`px-3 py-1 text-sm rounded-full transition duration-200 ${
                  filters.status === 'COMPLETED'
                    ? 'bg-green-600 text-white'
                    : 'bg-green-100 text-green-700 hover:bg-green-200'
                }`}
              >
                ✅ 完了済み
              </button>
            </div>
          </div>
        </div>

        {/* フィルタークリアボタン */}
        <div className="flex justify-end">
          <button
            onClick={clearAllFilters}
            className="px-4 py-2 text-sm bg-gray-500 text-white rounded-md hover:bg-gray-600 transition duration-200"
          >
            フィルターをクリア
          </button>
        </div>

        {/* アクティブなフィルターの表示 */}
        {(filters.priority !== 'ALL' || filters.status !== 'ALL' || filters.search) && (
          <div className="border-t pt-3">
            <p className="text-sm text-gray-600 mb-2">アクティブなフィルター:</p>
            <div className="flex flex-wrap gap-2">
              {filters.priority !== 'ALL' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  優先度: {filters.priority === 'HIGH' ? '🔴 高' : filters.priority === 'MEDIUM' ? '🟡 中' : '🟢 低'}
                </span>
              )}
              {filters.status !== 'ALL' && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  ステータス: {filters.status === 'COMPLETED' ? '✅ 完了済み' : filters.status === 'IN_PROGRESS' ? '🚀 進行中' : '⏳ 未完了'}
                </span>
              )}
              {filters.search && (
                <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">
                  検索: "{filters.search}"
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
