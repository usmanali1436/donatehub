import React, { useState, useEffect, useRef } from 'react';
import { campaignAPI } from '../../services/api';
import Input from '../common/Input';
import Button from '../common/Button';
import { debounce } from '../../utils/helpers';

const CampaignFilters = ({ onFiltersChange, filters: externalFilters }) => {
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const debouncedSearchRef = useRef();

  const filters = externalFilters || {
    search: '',
    category: 'all',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  };

  useEffect(() => {
    // Create debounced search function
    debouncedSearchRef.current = debounce((searchValue) => {
      const newFilters = { ...filters, search: searchValue };
      onFiltersChange(newFilters);
    }, 300);
    
    return () => {
      if (debouncedSearchRef.current?.cancel) {
        debouncedSearchRef.current.cancel();
      }
    };
  }, []);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setIsLoading(true);
      const response = await campaignAPI.getCategories();
      setCategories(response.data.data || []);
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFilterChange = (key, value) => {
    if (key === 'search') {
      // Use debounced search for search input
      debouncedSearchRef.current(value);
    } else {
      // Immediate update for other filters
      const newFilters = { ...filters, [key]: value };
      onFiltersChange(newFilters);
    }
  };

  const clearFilters = () => {
    const clearedFilters = {
      search: '',
      category: 'all',
      status: 'active',
      sortBy: 'createdAt',
      sortOrder: 'desc',
    };
    onFiltersChange(clearedFilters);
  };

  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        {/* Search */}
        <div className="flex-1">
          <Input
            type="text"
            placeholder="Search campaigns..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="w-full"
          />
        </div>

        {/* Category Filter */}
        <div className="lg:w-48">
          <select
            value={filters.category}
            onChange={(e) => handleFilterChange('category', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            disabled={isLoading}
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat.category} value={cat.category}>
                {cat.category} ({cat.count})
              </option>
            ))}
          </select>
        </div>

        {/* Status Filter */}
        <div className="lg:w-40">
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="closed">Closed</option>
          </select>
        </div>

        {/* Sort By */}
        <div className="lg:w-40">
          <select
            value={filters.sortBy}
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="createdAt">Date Created</option>
            <option value="title">Title</option>
            <option value="goalAmount">Goal Amount</option>
            <option value="raisedAmount">Raised Amount</option>
          </select>
        </div>

        {/* Sort Order */}
        <div className="lg:w-32">
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange('sortOrder', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="desc">Newest</option>
            <option value="asc">Oldest</option>
          </select>
        </div>

        {/* Clear Filters */}
        <Button
          variant="outline"
          size="sm"
          onClick={clearFilters}
          className="lg:w-auto w-full"
        >
          Clear
        </Button>
      </div>

      {/* Active filters summary */}
      <div className="mt-4 flex flex-wrap gap-2">
        {filters.search && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800">
            Search: "{filters.search}"
            <button
              onClick={() => handleFilterChange('search', '')}
              className="ml-2 text-blue-600 hover:text-blue-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.category !== 'all' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800">
            Category: {filters.category}
            <button
              onClick={() => handleFilterChange('category', 'all')}
              className="ml-2 text-green-600 hover:text-green-800"
            >
              ×
            </button>
          </span>
        )}
        {filters.status !== 'active' && (
          <span className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-yellow-100 text-yellow-800">
            Status: {filters.status}
            <button
              onClick={() => handleFilterChange('status', 'active')}
              className="ml-2 text-yellow-600 hover:text-yellow-800"
            >
              ×
            </button>
          </span>
        )}
      </div>
    </div>
  );
};

export default CampaignFilters;