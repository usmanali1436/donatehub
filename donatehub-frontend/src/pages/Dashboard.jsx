import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI, campaignAPI, donationAPI } from '../services/api';
import StatsCard from '../components/common/StatsCard';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import CampaignCard from '../components/campaigns/CampaignCard';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import { 
  formatCurrency, 
  formatDate, 
  formatDateTime, 
  getCategoryIcon, 
  getCategoryColor,
  getErrorMessage, 
  isNGO, 
  isDonor 
} from '../utils/helpers';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [recentCampaigns, setRecentCampaigns] = useState([]);
  const [recentDonations, setRecentDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (isNGO(user)) {
        // Fetch NGO dashboard data - the API already includes recentCampaigns
        const dashboardResponse = await dashboardAPI.getNGODashboard();
        const data = dashboardResponse.data.data;
        
        setDashboardData(data);
        setRecentCampaigns(data.recentCampaigns || []);
      } else if (isDonor(user)) {
        // Fetch Donor dashboard data - the API already includes recentDonations
        const dashboardResponse = await dashboardAPI.getDonorDashboard();
        const data = dashboardResponse.data.data;
        
        setDashboardData(data);
        setRecentDonations(data.recentDonations || []);
      }
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComponentLoading message="Loading your dashboard..." />
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Dashboard</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={fetchDashboardData}>Try Again</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Welcome Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">
          Welcome back, {user?.fullName}! 👋
        </h1>
        <p className="text-gray-600 mt-2">
          {isNGO(user) 
            ? "Here's an overview of your campaigns and donations received"
            : "Here's an overview of your donation activity and impact"
          }
        </p>
      </div>

      {/* NGO Dashboard */}
      {isNGO(user) && dashboardData && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
            <StatsCard
              title="Total Campaigns"
              value={dashboardData.overallStats?.totalCampaigns || 0}
              icon="🎯"
              color="blue"
              formatValue={false}
            />
            <StatsCard
              title="Active Campaigns"
              value={dashboardData.overallStats?.activeCampaigns || 0}
              icon="✅"
              color="green"
              formatValue={false}
            />
            <StatsCard
              title="Closed Campaigns"
              value={dashboardData.overallStats?.closedCampaigns || 0}
              icon="📋"
              color="gray"
              formatValue={false}
            />
            <StatsCard
              title="Total Raised"
              value={dashboardData.overallStats?.totalRaisedAmount || 0}
              icon="💰"
              color="yellow"
            />
            <StatsCard
              title="Unique Donors"
              value={dashboardData.overallStats?.uniqueDonors || 0}
              icon="👥"
              color="purple"
              formatValue={false}
            />
            <StatsCard
              title="Average Donation"
              value={dashboardData.overallStats?.avgDonation || 0}
              icon="📈"
              color="emerald"
            />
          </div>

          {/* Recent Campaigns */}
          <Card className="mb-8">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>Your Recent Campaigns</Card.Title>
                  <Card.Description>
                    {recentCampaigns.length} campaigns • Manage and track your fundraising efforts
                  </Card.Description>
                </div>
                <Link to="/my-campaigns">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </Card.Header>

            <Card.Content>
              {recentCampaigns.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">🎯</div>
                  <p className="text-gray-600 mb-4">No campaigns yet</p>
                  <Link to="/my-campaigns">
                    <Button>Create Your First Campaign</Button>
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {recentCampaigns.map((campaign) => (
                    <CampaignCard
                      key={campaign._id}
                      campaign={campaign}
                      showDonateButton={false}
                      showEditButton={false}
                    />
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Campaign Performance */}
          {dashboardData.campaignPerformance && dashboardData.campaignPerformance.length > 0 && (
            <Card className="mb-8">
              <Card.Header>
                <Card.Title>Campaign Performance</Card.Title>
                <Card.Description>Detailed performance metrics for your campaigns</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-6">
                  {dashboardData.campaignPerformance.map((campaign) => (
                    <div key={campaign._id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <Link 
                              to={`/campaigns/${campaign._id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {campaign.title}
                            </Link>
                            <span className={`inline-flex px-2 py-1 text-xs font-medium rounded-full ${
                              campaign.status === 'active' 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {campaign.status}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            Created on {formatDate(campaign.createdAt)}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-600">Donations received</div>
                          <div className="text-xl font-bold text-green-600">
                            {campaign.donationsCount} donation{campaign.donationsCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Progress</span>
                          <span>
                            {formatCurrency(campaign.raisedAmount)} / {formatCurrency(campaign.goalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div 
                            className={`h-3 rounded-full transition-all duration-300 ${
                              campaign.progressPercentage >= 100 
                                ? 'bg-green-500' 
                                : campaign.progressPercentage >= 75 
                                ? 'bg-blue-500' 
                                : campaign.progressPercentage >= 50 
                                ? 'bg-yellow-500' 
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${Math.min(campaign.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                          <span>{campaign.progressPercentage.toFixed(1)}% complete</span>
                          {campaign.progressPercentage >= 100 && (
                            <span className="text-green-600 font-medium">🎉 Goal exceeded!</span>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 text-center">
                        <div>
                          <div className="text-lg font-semibold text-gray-900">
                            {formatCurrency(campaign.raisedAmount)}
                          </div>
                          <div className="text-xs text-gray-600">Raised</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-blue-600">
                            {formatCurrency(campaign.goalAmount)}
                          </div>
                          <div className="text-xs text-gray-600">Goal</div>
                        </div>
                        <div>
                          <div className="text-lg font-semibold text-purple-600">
                            {campaign.donationsCount}
                          </div>
                          <div className="text-xs text-gray-600">Donations</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Monthly Donations Overview */}
          {dashboardData.monthlyDonations && dashboardData.monthlyDonations.length > 0 && (
            <Card className="mb-8">
              <Card.Header>
                <Card.Title>Monthly Donation Trends</Card.Title>
                <Card.Description>Track donation activity for your campaigns over time</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {dashboardData.monthlyDonations.map((monthData) => (
                    <div key={`${monthData._id.year}-${monthData._id.month}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📊</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(monthData._id.year, monthData._id.month - 1).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {monthData.totalDonations} donation{monthData.totalDonations !== 1 ? 's' : ''} received
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-green-600">
                          {formatCurrency(monthData.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {formatCurrency(monthData.totalAmount / monthData.totalDonations)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Overall Performance Summary */}
          <Card className="mb-8">
            <Card.Header>
              <Card.Title>Overall Performance Summary</Card.Title>
              <Card.Description>Key insights about your fundraising success</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">🎯</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Fundraising Success</h3>
                      <p className="text-sm text-gray-600">Overall campaign performance</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Goal Amount:</span>
                      <span className="font-medium">{formatCurrency(dashboardData.overallStats?.totalGoalAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Raised:</span>
                      <span className="font-medium text-green-600">{formatCurrency(dashboardData.overallStats?.totalRaisedAmount || 0)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Overall Progress:</span>
                      <span className="font-bold text-green-600">{(dashboardData.overallStats?.progressPercentage || 0).toFixed(1)}%</span>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                      <span className="text-2xl">👥</span>
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Donor Engagement</h3>
                      <p className="text-sm text-gray-600">Community support metrics</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Total Donations:</span>
                      <span className="font-medium">{dashboardData.overallStats?.totalDonations || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Unique Donors:</span>
                      <span className="font-medium text-blue-600">{dashboardData.overallStats?.uniqueDonors || 0}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Average Donation:</span>
                      <span className="font-bold text-blue-600">{formatCurrency(dashboardData.overallStats?.avgDonation || 0)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Campaign Performance */}
          {dashboardData.campaignsByCategory && (
            <Card>
              <Card.Header>
                <Card.Title>Campaigns by Category</Card.Title>
                <Card.Description>Distribution of your campaigns across different categories</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardData.campaignsByCategory.map((categoryData) => (
                    <div key={categoryData._id} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">{getCategoryIcon(categoryData._id)}</div>
                      <div className="text-xl font-bold text-gray-900 mb-1">
                        {categoryData.count}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{categoryData._id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {formatCurrency(categoryData.totalRaised)}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </>
      )}

      {/* Donor Dashboard */}
      {isDonor(user) && dashboardData && (
        <>
          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 lg:gap-6 mb-8">
            <StatsCard
              title="Total Donated"
              value={dashboardData.stats?.totalDonated || 0}
              icon="💝"
              color="green"
            />
            <StatsCard
              title="Campaigns Supported"
              value={dashboardData.stats?.campaignsSupported || 0}
              icon="🎯"
              color="blue"
              formatValue={false}
            />
            <StatsCard
              title="Total Donations"
              value={dashboardData.stats?.totalDonations || 0}
              icon="📊"
              color="purple"
              formatValue={false}
            />
            <StatsCard
              title="Average Donation"
              value={dashboardData.stats?.avgDonation || 0}
              icon="📈"
              color="yellow"
            />
            <StatsCard
              title="Campaigns Helped Complete"
              value={dashboardData.stats?.campaignsHelpedComplete || 0}
              icon="✅"
              color="emerald"
              formatValue={false}
            />
            <StatsCard
              title="Active Campaigns"
              value={dashboardData.stats?.activeCampaignsSupported || 0}
              icon="🔥"
              color="orange"
              formatValue={false}
            />
          </div>

          {/* Quick Actions */}
          <Card className="mb-8">
            <Card.Header>
              <Card.Title>Quick Actions</Card.Title>
              <Card.Description>Discover new ways to make a difference</Card.Description>
            </Card.Header>
            <Card.Content>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Link to="/campaigns" className="group">
                  <div className="p-6 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg group-hover:from-blue-100 group-hover:to-blue-200 transition-all duration-200">
                    <div className="text-2xl mb-2">🔍</div>
                    <h3 className="font-semibold text-gray-900 mb-1">Browse Campaigns</h3>
                    <p className="text-sm text-gray-600">Find new causes to support</p>
                  </div>
                </Link>
                <Link to="/donations" className="group">
                  <div className="p-6 bg-gradient-to-br from-green-50 to-green-100 rounded-lg group-hover:from-green-100 group-hover:to-green-200 transition-all duration-200">
                    <div className="text-2xl mb-2">📈</div>
                    <h3 className="font-semibold text-gray-900 mb-1">View History</h3>
                    <p className="text-sm text-gray-600">Track your donation impact</p>
                  </div>
                </Link>
                <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-lg">
                  <div className="text-2xl mb-2">🌟</div>
                  <h3 className="font-semibold text-gray-900 mb-1">Your Impact</h3>
                  <p className="text-sm text-gray-600">
                    {formatCurrency(dashboardData.stats?.totalDonated || 0)} donated across {dashboardData.stats?.campaignsSupported || 0} campaigns
                  </p>
                </div>
              </div>
            </Card.Content>
          </Card>

          {/* Recent Donations */}
          <Card className="mb-8">
            <Card.Header>
              <div className="flex items-center justify-between">
                <div>
                  <Card.Title>Recent Donations</Card.Title>
                  <Card.Description>
                    Your latest contributions to meaningful causes
                  </Card.Description>
                </div>
                <Link to="/donations">
                  <Button variant="outline" size="sm">View All</Button>
                </Link>
              </div>
            </Card.Header>

            <Card.Content>
              {recentDonations.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-2">💝</div>
                  <p className="text-gray-600 mb-4">No donations yet</p>
                  <Link to="/campaigns">
                    <Button>Browse Campaigns</Button>
                  </Link>
                </div>
              ) : (
                <div className="space-y-4">
                  {recentDonations.map((donation) => (
                    <div key={donation._id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">💝</span>
                        </div>
                        <div>
                          <Link 
                            to={`/campaigns/${donation.campaignId?._id}`}
                            className="font-medium text-gray-900 hover:text-blue-600 transition-colors"
                          >
                            {donation.campaignId?.title || 'Campaign'}
                          </Link>
                          <div className="text-sm text-gray-600">
                            {formatDateTime(donation.donatedAt)}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-green-600">
                          {formatCurrency(donation.amount)}
                        </div>
                        {donation.campaignId?.category && (
                          <span className={`inline-block px-2 py-1 rounded-full text-xs ${getCategoryColor(donation.campaignId.category)}`}>
                            {donation.campaignId.category}
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card.Content>
          </Card>

          {/* Supported Campaigns */}
          {dashboardData.supportedCampaigns && dashboardData.supportedCampaigns.length > 0 && (
            <Card className="mb-8">
              <Card.Header>
                <div className="flex items-center justify-between">
                  <div>
                    <Card.Title>Campaigns You Support</Card.Title>
                    <Card.Description>
                      Track the progress of campaigns you've contributed to
                    </Card.Description>
                  </div>
                  <Link to="/donations">
                    <Button variant="outline" size="sm">View History</Button>
                  </Link>
                </div>
              </Card.Header>

              <Card.Content>
                <div className="space-y-6">
                  {dashboardData.supportedCampaigns.map((supportedCampaign) => (
                    <div key={supportedCampaign._id} className="bg-gray-50 rounded-lg p-6">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="text-lg">{getCategoryIcon(supportedCampaign.campaign.category)}</span>
                            <Link 
                              to={`/campaigns/${supportedCampaign.campaign._id}`}
                              className="font-semibold text-gray-900 hover:text-blue-600 transition-colors"
                            >
                              {supportedCampaign.campaign.title}
                            </Link>
                            <span className={`inline-block px-2 py-1 rounded-full text-xs ${getCategoryColor(supportedCampaign.campaign.category)}`}>
                              {supportedCampaign.campaign.category}
                            </span>
                          </div>
                          <p className="text-gray-600 text-sm mb-3">
                            {supportedCampaign.campaign.description}
                          </p>
                        </div>
                        <div className="ml-4 text-right">
                          <div className="text-sm text-gray-600">Your contributions</div>
                          <div className="text-xl font-bold text-green-600">
                            {formatCurrency(supportedCampaign.totalDonated)}
                          </div>
                          <div className="text-xs text-gray-500">
                            {supportedCampaign.donationCount} donation{supportedCampaign.donationCount !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>

                      <div className="mb-3">
                        <div className="flex justify-between text-sm text-gray-600 mb-1">
                          <span>Campaign Progress</span>
                          <span>
                            {formatCurrency(supportedCampaign.campaign.raisedAmount)} / {formatCurrency(supportedCampaign.campaign.goalAmount)}
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                            style={{ width: `${Math.min(supportedCampaign.campaign.progressPercentage, 100)}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {supportedCampaign.campaign.progressPercentage.toFixed(1)}% complete
                        </div>
                      </div>

                      <div className="flex justify-between items-center text-sm text-gray-600">
                        <span>
                          Last donation: {formatDateTime(supportedCampaign.lastDonation)}
                        </span>
                        <span>
                          By {supportedCampaign.campaign.creator?.fullName}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Donations by Category */}
          {dashboardData.donationsByCategory && dashboardData.donationsByCategory.length > 0 && (
            <Card className="mb-8">
              <Card.Header>
                <Card.Title>Your Donations by Category</Card.Title>
                <Card.Description>See where your contributions have made the most impact</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {dashboardData.donationsByCategory.map((categoryData) => (
                    <div key={categoryData._id} className="text-center p-4 bg-gray-50 rounded-lg">
                      <div className="text-3xl mb-2">{getCategoryIcon(categoryData._id)}</div>
                      <div className="text-lg font-bold text-gray-900 mb-1">
                        {formatCurrency(categoryData.totalDonated)}
                      </div>
                      <div className="text-sm text-gray-600 capitalize">{categoryData._id}</div>
                      <div className="text-xs text-gray-500 mt-1">
                        {categoryData.donationCount} donation{categoryData.donationCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}

          {/* Monthly Donation Trends */}
          {dashboardData.monthlyDonations && dashboardData.monthlyDonations.length > 0 && (
            <Card>
              <Card.Header>
                <Card.Title>Monthly Donation Activity</Card.Title>
                <Card.Description>Your donation activity over time</Card.Description>
              </Card.Header>
              <Card.Content>
                <div className="space-y-4">
                  {dashboardData.monthlyDonations.map((monthData) => (
                    <div key={`${monthData._id.year}-${monthData._id.month}`} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg">📊</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">
                            {new Date(monthData._id.year, monthData._id.month - 1).toLocaleDateString('en-US', { 
                              month: 'long', 
                              year: 'numeric' 
                            })}
                          </div>
                          <div className="text-sm text-gray-600">
                            {monthData.totalDonations} donation{monthData.totalDonations !== 1 ? 's' : ''}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-lg font-semibold text-blue-600">
                          {formatCurrency(monthData.totalAmount)}
                        </div>
                        <div className="text-xs text-gray-500">
                          Avg: {formatCurrency(monthData.totalAmount / monthData.totalDonations)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card.Content>
            </Card>
          )}
        </>
      )}
    </div>
  );
};

export default Dashboard;