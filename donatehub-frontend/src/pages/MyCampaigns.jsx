import React, { useState, useEffect, useCallback } from 'react';
import { campaignAPI } from '../services/api';
import CampaignCard from '../components/campaigns/CampaignCard';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import { getErrorMessage } from '../utils/helpers';

const MyCampaigns = () => {
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
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); // 'all', 'active', 'closed'

  const [campaignForm, setCampaignForm] = useState({
    title: '',
    description: '',
    category: 'others',
    goalAmount: '',
  });
  const [formErrors, setFormErrors] = useState({});

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
        status: filter !== 'all' ? filter : undefined,
      };

      const response = await campaignAPI.getMyCampaigns(params);
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
  }, [filter]);

  useEffect(() => {
    fetchCampaigns(1, false);
  }, [fetchCampaigns]);

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setCampaignForm(prev => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const errors = {};
    
    if (!campaignForm.title.trim()) {
      errors.title = 'Title is required';
    }
    
    if (!campaignForm.description.trim()) {
      errors.description = 'Description is required';
    }
    
    if (!campaignForm.goalAmount || isNaN(campaignForm.goalAmount) || parseFloat(campaignForm.goalAmount) <= 0) {
      errors.goalAmount = 'Please enter a valid goal amount';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const resetForm = () => {
    setCampaignForm({
      title: '',
      description: '',
      category: 'others',
      goalAmount: '',
    });
    setFormErrors({});
  };

  const handleCreateCampaign = async () => {
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);
      
      const campaignData = {
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim(),
        category: campaignForm.category,
        goalAmount: parseFloat(campaignForm.goalAmount),
      };

      await campaignAPI.create(campaignData);
      
      setShowCreateModal(false);
      resetForm();
      fetchCampaigns(1, false);
      
      alert('Campaign created successfully!');
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditCampaign = (campaign) => {
    setEditingCampaign(campaign);
    setCampaignForm({
      title: campaign.title,
      description: campaign.description,
      category: campaign.category,
      goalAmount: campaign.goalAmount.toString(),
    });
    setShowEditModal(true);
  };

  const handleUpdateCampaign = async () => {
    if (!validateForm() || !editingCampaign) return;

    try {
      setIsSubmitting(true);
      
      const campaignData = {
        title: campaignForm.title.trim(),
        description: campaignForm.description.trim(),
        category: campaignForm.category,
        goalAmount: parseFloat(campaignForm.goalAmount),
        status: editingCampaign.status, // Keep existing status
      };

      await campaignAPI.update(editingCampaign._id, campaignData);
      
      setShowEditModal(false);
      setEditingCampaign(null);
      resetForm();
      fetchCampaigns(1, false);
      
      alert('Campaign updated successfully!');
    } catch (error) {
      alert(getErrorMessage(error));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to delete this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      await campaignAPI.delete(campaignId);
      setCampaigns(prev => prev.filter(c => c._id !== campaignId));
      alert('Campaign deleted successfully!');
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleCloseCampaign = async (campaignId) => {
    if (!confirm('Are you sure you want to close this campaign? This will stop all donations and cannot be undone.')) {
      return;
    }

    try {
      const campaign = campaigns.find(c => c._id === campaignId);
      if (!campaign) return;

      const updateData = {
        title: campaign.title,
        description: campaign.description,
        category: campaign.category,
        goalAmount: campaign.goalAmount,
        status: 'closed'
      };

      await campaignAPI.update(campaignId, updateData);
      
      setCampaigns(prev => 
        prev.map(c => 
          c._id === campaignId 
            ? { ...c, status: 'closed' }
            : c
        )
      );
      
      alert('Campaign closed successfully!');
    } catch (error) {
      alert(getErrorMessage(error));
    }
  };

  const handleLoadMore = () => {
    if (!isLoadingMore && pagination.hasNext) {
      fetchCampaigns(pagination.currentPage + 1, true);
    }
  };

  const categories = [
    { value: 'health', label: 'Health' },
    { value: 'education', label: 'Education' },
    { value: 'disaster', label: 'Disaster Relief' },
    { value: 'others', label: 'Others' },
  ];

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
          <p className="text-gray-600 mt-2">Manage your fundraising campaigns</p>
        </div>
        <ComponentLoading message="Loading your campaigns..." />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Campaigns</h1>
            <p className="text-gray-600 mt-2">
              Manage your fundraising campaigns - {pagination.totalCampaigns} campaigns total
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <Button onClick={() => setShowCreateModal(true)}>
              + Create Campaign
            </Button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-6">
        <div className="flex flex-wrap gap-2">
          {[
            { value: 'all', label: 'All Campaigns' },
            { value: 'active', label: 'Active' },
            { value: 'closed', label: 'Closed' },
          ].map((option) => (
            <button
              key={option.value}
              onClick={() => setFilter(option.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === option.value
                  ? 'bg-blue-100 text-blue-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      {/* Error state */}
      {error && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Failed to Load Campaigns</h3>
          <p className="text-gray-600 mb-6">{error}</p>
          <Button onClick={() => fetchCampaigns(1, false)}>Try Again</Button>
        </div>
      )}

      {/* Campaigns Grid */}
      {!error && (
        <>
          {campaigns.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No Campaigns Yet</h3>
              <p className="text-gray-600 mb-6">
                Create your first campaign to start raising funds for your cause.
              </p>
              <Button onClick={() => setShowCreateModal(true)}>
                Create Your First Campaign
              </Button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
                {campaigns.map((campaign) => (
                  <CampaignCard
                    key={campaign._id}
                    campaign={campaign}
                    showDonateButton={false}
                    showEditButton={true}
                    onEdit={handleEditCampaign}
                    onDelete={handleDeleteCampaign}
                    onClose={handleCloseCampaign}
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
                  >
                    {isLoadingMore ? 'Loading More...' : 'Load More Campaigns'}
                  </Button>
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* Create Campaign Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          resetForm();
        }}
        title="Create New Campaign"
        size="lg"
      >
        <Modal.Content>
          <div className="space-y-6">
            <Input
              label="Campaign Title"
              name="title"
              value={campaignForm.title}
              onChange={handleFormChange}
              error={formErrors.title}
              placeholder="Enter a compelling title for your campaign"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={campaignForm.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Goal Amount ($)"
              type="number"
              name="goalAmount"
              value={campaignForm.goalAmount}
              onChange={handleFormChange}
              error={formErrors.goalAmount}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={campaignForm.description}
                onChange={handleFormChange}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe your campaign, its goals, and how the funds will be used..."
                required
              />
              {formErrors.description && (
                <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>
              )}
            </div>
          </div>
        </Modal.Content>

        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => {
              setShowCreateModal(false);
              resetForm();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreateCampaign}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Creating...' : 'Create Campaign'}
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Edit Campaign Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => {
          setShowEditModal(false);
          setEditingCampaign(null);
          resetForm();
        }}
        title="Edit Campaign"
        size="lg"
      >
        <Modal.Content>
          <div className="space-y-6">
            <Input
              label="Campaign Title"
              name="title"
              value={campaignForm.title}
              onChange={handleFormChange}
              error={formErrors.title}
              placeholder="Enter a compelling title for your campaign"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Category <span className="text-red-500">*</span>
              </label>
              <select
                name="category"
                value={campaignForm.category}
                onChange={handleFormChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              >
                {categories.map((cat) => (
                  <option key={cat.value} value={cat.value}>
                    {cat.label}
                  </option>
                ))}
              </select>
            </div>

            <Input
              label="Goal Amount ($)"
              type="number"
              name="goalAmount"
              value={campaignForm.goalAmount}
              onChange={handleFormChange}
              error={formErrors.goalAmount}
              placeholder="0.00"
              min="1"
              step="0.01"
              required
            />

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                name="description"
                value={campaignForm.description}
                onChange={handleFormChange}
                rows={6}
                className={`w-full px-3 py-2 border rounded-lg text-sm transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  formErrors.description ? 'border-red-300 bg-red-50' : 'border-gray-300'
                }`}
                placeholder="Describe your campaign, its goals, and how the funds will be used..."
                required
              />
              {formErrors.description && (
                <p className="text-sm text-red-600 mt-1">{formErrors.description}</p>
              )}
            </div>

            {editingCampaign && editingCampaign.raisedAmount > 0 && (
              <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                <div className="flex items-start">
                  <div className="text-yellow-600 mr-3">⚠️</div>
                  <div>
                    <h4 className="text-sm font-medium text-yellow-800">Note</h4>
                    <p className="text-sm text-yellow-700 mt-1">
                      This campaign has already received donations. Some changes may not be reversible.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </Modal.Content>

        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => {
              setShowEditModal(false);
              setEditingCampaign(null);
              resetForm();
            }}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            onClick={handleUpdateCampaign}
            isLoading={isSubmitting}
            disabled={isSubmitting}
          >
            {isSubmitting ? 'Updating...' : 'Update Campaign'}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MyCampaigns;