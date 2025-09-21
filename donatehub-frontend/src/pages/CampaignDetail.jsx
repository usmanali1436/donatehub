import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { campaignAPI, donationAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Input from '../components/common/Input';
import Modal from '../components/common/Modal';
import ProgressBar from '../components/common/ProgressBar';
import { ComponentLoading } from '../components/common/LoadingSpinner';
import paymentService from '../services/paymentService';
import { formatDate, formatDateTime, formatCurrency, getCategoryColor, getCategoryIcon, getErrorMessage, isNGO } from '../utils/helpers';

const CampaignDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [campaign, setCampaign] = useState(null);
  const [donations, setDonations] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationError, setDonationError] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCampaignDetails();
  }, [id]);

  const fetchCampaignDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [campaignResponse, donationsResponse] = await Promise.all([
        campaignAPI.getById(id),
        donationAPI.getCampaignDonations(id, { page: 1, limit: 10 })
      ]);

      setCampaign(campaignResponse.data.data);
      setDonations(donationsResponse.data.data.donations || []);
    } catch (error) {
      setError(getErrorMessage(error));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDonate = async () => {
    if (!donationAmount || isNaN(donationAmount) || parseFloat(donationAmount) <= 0) {
      setDonationError('Please enter a valid donation amount');
      return;
    }

    // Navigate to checkout page with campaign and amount info
    navigate(`/checkout?campaignId=${id}&amount=${donationAmount}`);
  };

  const formatDonorName = (donor) => {
    if (!donor) return 'Anonymous';
    return donor.fullName || 'Anonymous Donor';
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <ComponentLoading message="Loading campaign details..." />
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center py-12">
          <div className="text-6xl mb-4">😔</div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Campaign Not Found</h3>
          <p className="text-gray-600 mb-6">{error || 'The campaign you are looking for does not exist.'}</p>
          <Button onClick={() => navigate('/campaigns')}>Back to Campaigns</Button>
        </div>
      </div>
    );
  }

  const isActive = campaign.status === 'active';
  const canDonate = !isNGO(user) && isActive;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Back button */}
      <div className="mb-6">
        <Button variant="outline" size="sm" onClick={() => navigate('/campaigns')}>
          ← Back to Campaigns
        </Button>
      </div>

      {/* Campaign Header */}
      <Card className="mb-8">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between mb-6">
          <div className="flex items-center space-x-3 mb-4 sm:mb-0">
            <span className="text-3xl">{getCategoryIcon(campaign.category)}</span>
            <div>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getCategoryColor(campaign.category)}`}>
                {campaign.category}
              </span>
              {!isActive && (
                <span className="inline-block ml-2 px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-600">
                  Campaign Closed
                </span>
              )}
            </div>
          </div>
          {canDonate && (
            <Button onClick={() => setShowDonateModal(true)} size="lg">
              💝 Donate Now
            </Button>
          )}
        </div>

        <h1 className="text-3xl font-bold text-gray-900 mb-4">{campaign.title}</h1>
        
        <div className="prose max-w-none text-gray-700 mb-6">
          <p className="text-lg leading-relaxed whitespace-pre-line">{campaign.description}</p>
        </div>

        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <ProgressBar
            current={campaign.raisedAmount || 0}
            target={campaign.goalAmount}
            size="lg"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center">
          <div>
            <div className="text-2xl font-bold text-green-600">
              ${(campaign.raisedAmount || 0).toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Raised</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-blue-600">
              ${campaign.goalAmount.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600">Goal</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-purple-600">
              {donations.length}
            </div>
            <div className="text-sm text-gray-600">Donors</div>
          </div>
        </div>

        <div className="mt-6 pt-6 border-t border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm text-gray-600">
          <div>
            Created by <span className="font-medium">{campaign.createdBy?.fullName || 'Unknown'}</span>
          </div>
          <div>
            Created on {formatDate(campaign.createdAt)}
          </div>
        </div>
      </Card>

      {/* Recent Donations */}
      <Card>
        <Card.Header>
          <Card.Title>Recent Donations ({donations.length})</Card.Title>
          <Card.Description>
            Support from generous donors making this campaign possible
          </Card.Description>
        </Card.Header>
        
        <Card.Content>
          {donations.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-4xl mb-2">💝</div>
              <p className="text-gray-600">Be the first to support this campaign!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {donations.map((donation, index) => (
                <div key={donation._id || index} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                  <div className="flex items-center space-x-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      {donation.paymentMethod ? 
                        paymentService.getPaymentMethodIcon(donation.paymentMethod, donation.paymentDetails?.card?.brand) : 
                        '💝'
                      }
                    </div>
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatDonorName(donation.donorId)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {formatDateTime(donation.donatedAt)}
                        {donation.paymentMethod && (
                          <span className="ml-2 text-xs text-gray-500">
                            via {donation.paymentMethod === 'stripe' ? 'Card' : 'PayPal'}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-lg font-semibold text-green-600">
                    {formatCurrency(donation.amount)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card.Content>
      </Card>

      {/* Donation Modal */}
      <Modal
        isOpen={showDonateModal}
        onClose={() => setShowDonateModal(false)}
        title="Make a Donation"
        size="md"
      >
        <Modal.Content>
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-2">You're supporting:</h4>
            <p className="text-gray-700">{campaign.title}</p>
          </div>
          
          <Input
            label="Donation Amount ($)"
            type="number"
            value={donationAmount}
            onChange={(e) => {
              setDonationAmount(e.target.value);
              if (donationError) setDonationError('');
            }}
            error={donationError}
            placeholder="0.00"
            min="1"
            step="0.01"
            required
          />

          {/* Quick Amount Buttons */}
          <div className="mt-4">
            <p className="text-sm text-gray-600 mb-2">Quick amounts:</p>
            <div className="flex flex-wrap gap-2">
              {[25, 50, 100, 250, 500].map(quickAmount => (
                <Button
                  key={quickAmount}
                  variant={donationAmount == quickAmount ? 'primary' : 'outline'}
                  size="sm"
                  type="button"
                  onClick={() => {
                    setDonationAmount(quickAmount.toString());
                    if (donationError) setDonationError('');
                  }}
                >
                  ${quickAmount}
                </Button>
              ))}
            </div>
          </div>

          {donationAmount && !isNaN(donationAmount) && parseFloat(donationAmount) > 0 && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <div className="text-sm text-blue-800">
                <div className="flex justify-between">
                  <span>Donation Amount:</span>
                  <span className="font-medium">${parseFloat(donationAmount).toFixed(2)}</span>
                </div>
                <div className="flex justify-between mt-2 pt-2 border-t border-blue-200 font-medium">
                  <span>Total:</span>
                  <span>${parseFloat(donationAmount).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}
        </Modal.Content>

        <Modal.Footer>
          <Button
            variant="outline"
            onClick={() => setShowDonateModal(false)}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDonate}
          >
            Continue to Checkout
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default CampaignDetail;