import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { donationAPI } from '../services/api';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import { formatDateTime, formatCurrency, getCategoryIcon, getCategoryColor, getErrorMessage } from '../utils/helpers';

const MyDonations = () => {
  const [donations, setDonations] = useState([]);
  const [donationStats, setDonationStats] = useState(null);
  const [supportedCampaigns, setSupportedCampaigns] = useState([]);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    totalDonations: 0,
    hasMore: false,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [activeTab, setActiveTab] = useState('donations'); // 'donations' | 'campaigns'
  const [error, setError] = useState(null);

  const fetchDonations = useCallback(async (page = 1, append = false) => {
    try {
      if (page === 1) {
        setIsLoading(true);
      } else {
        setIsLoadingMore(true);
      }
      setError(null);

      const response = await donationAPI.getHistory({
        page,
        limit: 10,
        sortBy: 'donatedAt',
        sortOrder: 'desc'
      });

      const { donations: newDonations, stats, pagination: newPagination } = response.data.data;

      if (append) {
        setDonations(prev => [...prev, ...newDonations]);
      } else {
        setDonations(newDonations);
        setDonationStats(stats);
      }

      setPagination(newPagination);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, []);

  const fetchSupportedCampaigns = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const response = await donationAPI.getSupportedCampaigns({
        page: 1,
        limit: 20,
        status: 'all'
      });

      setSupportedCampaigns(response.data.data.supportedCampaigns || []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (activeTab === 'donations') {
      fetchDonations(1, false);
    } else {
      fetchSupportedCampaigns();
    }
  }, [activeTab, fetchDonations, fetchSupportedCampaigns]);

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasNext && activeTab === 'donations') {
      fetchDonations(pagination.currentPage + 1, true);
    }
  };

  const calculateTotalDonated = () => {
    return donationStats?.totalDonated || donations.reduce((total, donation) => total + (donation.amount || 0), 0);
  };

  const tabs = [
    { id: 'donations', label: 'Donation History', icon: '💝' },
    { id: 'campaigns', label: 'Supported Campaigns', icon: '🎯' },
  ];

  if (isLoading && activeTab === 'donations') {
    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Donations</h1>
          <p className="text-gray-600 mt-2">Track your donation history and supported campaigns</p>
        </div>
        <ComponentLoading message="Loading your donations..." />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">My Donations</h1>
        <p className="text-gray-600 mt-2">Track your donation history and supported campaigns</p>
      </div>

      {/* Stats Cards */}
      {activeTab === 'donations' && donations.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(calculateTotalDonated())}
            </div>
            <div className="text-gray-600">Total Donated</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {pagination.totalDonations || donations.length}
            </div>
            <div className="text-gray-600">Total Donations</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {donationStats?.campaignsSupported || supportedCampaigns.length}
            </div>
            <div className="text-gray-600">Campaigns Supported</div>
          </Card>
        </div>
      )}

      {/* Campaign Stats Cards */}
      {activeTab === 'campaigns' && supportedCampaigns.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="text-center">
            <div className="text-3xl font-bold text-green-600 mb-2">
              {formatCurrency(supportedCampaigns.reduce((total, item) => total + (item.totalDonated || 0), 0))}
            </div>
            <div className="text-gray-600">Total Contributed</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-blue-600 mb-2">
              {supportedCampaigns.reduce((total, item) => total + (item.donationCount || 0), 0)}
            </div>
            <div className="text-gray-600">Total Donations</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-purple-600 mb-2">
              {supportedCampaigns.length}
            </div>
            <div className="text-gray-600">Campaigns Supported</div>
          </Card>
          <Card className="text-center">
            <div className="text-3xl font-bold text-orange-600 mb-2">
              {supportedCampaigns.filter(item => item.campaign.status === 'active').length}
            </div>
            <div className="text-gray-600">Active Campaigns</div>
          </Card>
        </div>
      )}

      {/* Tabs */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 py-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                activeTab === tab.id
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span>{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </nav>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Data</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => activeTab === 'donations' ? fetchDonations(1, false) : fetchSupportedCampaigns()}>
            Try Again
          </Button>
        </div>
      )}

      {/* Donations Tab */}
      {activeTab === 'donations' && !error && (
        <>
          {donations.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💝</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Donations Yet</h3>
              <p className="text-gray-600 mb-6">
                Start making a difference by supporting campaigns that matter to you.
              </p>
              <Link to="/campaigns">
                <Button>Browse Campaigns</Button>
              </Link>
            </div>
          ) : (
            <>
              <div className="space-y-4 mb-8">
                {donations.map((donation) => (
                  <Card key={donation._id} className="hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between">
                      <div className="flex items-start space-x-4 mb-4 sm:mb-0">
                        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center flex-shrink-0">
                          <span className="text-xl">💝</span>
                        </div>
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-1">
                            <Link 
                              to={`/campaigns/${donation.campaignId}`}
                              className="hover:text-blue-600 transition-colors"
                            >
                              {donation.campaign?.title || 'Campaign'}
                            </Link>
                          </h3>
                          <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
                            {donation.campaign?.category && (
                              <span className={`px-2 py-1 rounded-full text-xs ${getCategoryColor(donation.campaign.category)}`}>
                                {getCategoryIcon(donation.campaign.category)} {donation.campaign.category}
                              </span>
                            )}
                            {donation.campaign?.status && donation.campaign.status !== 'active' && (
                              <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                {donation.campaign.status}
                              </span>
                            )}
                          </div>
                          <div className="text-sm text-gray-600">
                            Donated on {formatDateTime(donation.donatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-green-600 mb-1">
                          {formatCurrency(donation.amount)}
                        </div>
                        <Link to={`/campaigns/${donation.campaignId}`}>
                          <Button size="sm" variant="outline">
                            View Campaign
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Load More */}
              {pagination.hasNext && (
                <div className="text-center">
                  <Button
                    onClick={handleLoadMore}
                    isLoading={isLoadingMore}
                    disabled={isLoadingMore}
                  >
                    {isLoadingMore ? 'Loading More...' : 'Load More Donations'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Supported Campaigns Tab */}
      {activeTab === 'campaigns' && !error && (
        <>
          {isLoading ? (
            <ComponentLoading message="Loading supported campaigns..." />
          ) : supportedCampaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Supported</h3>
              <p className="text-gray-600 mb-6">
                Once you make donations, the campaigns you support will appear here.
              </p>
              <Link to="/campaigns">
                <Button>Browse Campaigns</Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {supportedCampaigns.map((supportedCampaign) => {
                const campaign = supportedCampaign.campaign;
                return (
                  <Card key={campaign._id} hover className="h-full flex flex-col">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <span className="text-xl">{getCategoryIcon(campaign.category)}</span>
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(campaign.category)}`}>
                          {campaign.category}
                        </span>
                        {campaign.status !== 'active' && (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                            {campaign.status}
                          </span>
                        )}
                      </div>
                      <div className="text-right">
                        <div className="text-sm text-green-600 font-medium">
                          You donated: {formatCurrency(supportedCampaign.totalDonated)}
                        </div>
                        <div className="text-xs text-gray-500">
                          {supportedCampaign.donationCount} donation{supportedCampaign.donationCount !== 1 ? 's' : ''}
                        </div>
                      </div>
                    </div>

                    <h3 className="font-semibold text-gray-900 mb-2">
                      <Link 
                        to={`/campaigns/${campaign._id}`}
                        className="hover:text-blue-600 transition-colors"
                      >
                        {campaign.title}
                      </Link>
                    </h3>

                    <div className="text-sm text-gray-600 mb-4 flex-1">
                      {campaign.description.length > 100 
                        ? campaign.description.substring(0, 100) + '...'
                        : campaign.description
                      }
                    </div>

                    <div className="bg-gray-50 rounded-lg p-3 mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">Progress</span>
                        <span className="font-medium">
                          {Math.round((campaign.raisedAmount / campaign.goalAmount) * 100)}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full transition-all duration-300 ${
                            campaign.progressPercentage >= 100 
                              ? 'bg-green-500' 
                              : campaign.progressPercentage >= 75 
                              ? 'bg-blue-500' 
                              : campaign.progressPercentage >= 50 
                              ? 'bg-yellow-500' 
                              : 'bg-red-500'
                          }`}
                          style={{ 
                            width: `${Math.min(campaign.progressPercentage, 100)}%` 
                          }}
                        />
                      </div>
                      <div className="flex justify-between text-sm mt-2 text-gray-600">
                        <span>{formatCurrency(campaign.raisedAmount)}</span>
                        <span>{formatCurrency(campaign.goalAmount)}</span>
                      </div>
                      {campaign.progressPercentage >= 100 && (
                        <div className="text-xs text-green-600 font-medium mt-1 text-center">
                          🎉 Goal achieved!
                        </div>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 mb-3">
                      Last donated: {formatDateTime(supportedCampaign.lastDonation)}
                    </div>

                    <div className="flex space-x-2">
                      <Link to={`/campaigns/${campaign._id}`} className="flex-1">
                        <Button variant="outline" size="sm" className="w-full">
                          View Details
                        </Button>
                      </Link>
                      {campaign.status === 'active' && (
                        <Link to={`/checkout?campaignId=${campaign._id}&amount=25`} className="flex-1">
                          <Button size="sm" className="w-full">
                            Donate Again
                          </Button>
                        </Link>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default MyDonations;