import React, { useState, useEffect, useCallback } from 'react';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/campaigns/CampaignCard';
import CampaignFilters from '../components/campaigns/CampaignFilters';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import Button from '../components/common/Button';
import { getErrorMessage, debounce } from '../utils/helpers';

const CampaignList = () => {
  const [campaigns, setCampaigns] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalCampaigns: 0,
    hasNext: false,
    hasPrev: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    category: 'all',
    status: 'active',
    sortBy: 'createdAt',
    sortOrder: 'desc',
  });

  const fetchCampaigns = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const params = {
        page,
        limit: 12,
        ...filters,
      };

      const response = await campaignAPI.getAll(params);
      const { campaigns: newCampaigns, pagination: newPagination } = response.data.data;

      if (append) {
        setCampaigns(prev => [...prev, ...newCampaigns]);
      } else {
        setCampaigns(newCampaigns);
      }

      setPagination(newPagination);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filters]);

  useEffect(() => {
    fetchCampaigns(1, false);
  }, []);

  useEffect(() => {
    fetchCampaigns(1, false);
  }, [filters]);

  const handleFiltersChange = useCallback((newFilters) => {
    setFilters(prev => {
      // Only update if filters actually changed
      if (JSON.stringify(prev) !== JSON.stringify(newFilters)) {
        return newFilters;
      }
      return prev;
    });
  }, []);

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasNext) {
      fetchCampaigns(pagination.currentPage + 1, true);
    }
  };

  const handleRefresh = () => {
    fetchCampaigns(1, false);
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Campaigns</h1>
          <p className="text-gray-600 mt-2">Discover and support meaningful causes</p>
        </div>
        <ComponentLoading message="Loading campaigns..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">All Campaigns</h1>
          <p className="text-gray-600 mt-2">Discover and support meaningful causes</p>
        </div>
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Campaigns</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={handleRefresh}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">All Campaigns</h1>
            <p className="text-gray-600 mt-2">
              Discover and support meaningful causes - {pagination.totalCampaigns} campaigns available
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={handleRefresh} variant="outline" size="sm">
              🔄 Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <CampaignFilters 
        filters={filters}
        onFiltersChange={handleFiltersChange} 
      />

      {/* Campaigns Grid */}
      {campaigns.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Found</h3>
          <p className="text-gray-600">
            Try adjusting your filters or search terms to find campaigns.
          </p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
            {campaigns.map((campaign) => (
              <CampaignCard
                key={campaign._id}
                campaign={campaign}
                showDonateButton={true}
              />
            ))}
          </div>

          {/* Load More */}
          {pagination.hasNext && (
            <div className="text-center">
              <Button
                onClick={handleLoadMore}
                isLoading={isLoadingMore}
                disabled={isLoadingMore}
                size="lg"
              >
                {isLoadingMore ? 'Loading More...' : 'Load More Campaigns'}
              </Button>
            </div>
          )}

          {/* Pagination Info */}
          <div className="text-center text-sm text-gray-500 mt-6">
            Showing {campaigns.length} of {pagination.totalCampaigns} campaigns
            {pagination.currentPage > 1 && (
              <span> (Page {pagination.currentPage} of {pagination.totalPages})</span>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default CampaignList;