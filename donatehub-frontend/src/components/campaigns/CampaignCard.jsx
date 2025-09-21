import React from 'react';
import { Link } from 'react-router-dom';
import Card from '../common/Card';
import ProgressBar from '../common/ProgressBar';
import Button from '../common/Button';
import { formatDate, getCategoryColor, getCategoryIcon, truncateText } from '../../utils/helpers';

const CampaignCard = ({ campaign, showDonateButton = true, showEditButton = false, onEdit, onDelete, onClose }) => {
  const {
    _id,
    title,
    description,
    category,
    goalAmount,
    raisedAmount = 0,
    createdBy,
    status,
    createdAt
  } = campaign;

  const isActive = status === 'active';
  const progress = (raisedAmount / goalAmount) * 100;

  return (
    <Card hover className="h-full flex flex-col">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-2">
          <span className="text-2xl">{getCategoryIcon(category)}</span>
          <span className={`px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
            {category}
          </span>
        </div>
        {!isActive && (
          <span className="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
            Closed
          </span>
        )}
      </div>

      <Link to={`/campaigns/${_id}`} className="flex-1">
        <h3 className="text-lg font-semibold text-gray-900 mb-2 hover:text-blue-600 transition-colors">
          {title}
        </h3>
        <p className="text-gray-600 text-sm mb-4 leading-relaxed">
          {truncateText(description, 120)}
        </p>
      </Link>

      <div className="mt-auto space-y-4">
        <ProgressBar
          current={raisedAmount}
          target={goalAmount}
          size="sm"
        />

        <div className="flex justify-between text-sm text-gray-500">
          <span>By {createdBy?.fullName || 'Anonymous'}</span>
          <span>{formatDate(createdAt)}</span>
        </div>

        {(showDonateButton || showEditButton) && (
          <div className="flex space-x-2 pt-2">
            {showDonateButton && isActive && (
              <>
                <Link to={`/checkout?campaignId=${_id}&amount=50`} className="flex-1">
                  <Button variant="primary" size="sm" className="w-full">
                    Quick $50
                  </Button>
                </Link>
                <Link to={`/campaigns/${_id}`} className="flex-1">
                  <Button variant="outline" size="sm" className="w-full">
                    Learn More
                  </Button>
                </Link>
              </>
            )}
            
            {showEditButton && (
              <div className="space-y-2">
                <div className="flex space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => onEdit && onEdit(campaign)}
                  >
                    Edit
                  </Button>
                  {isActive && onClose && (
                    <Button
                      variant="warning"
                      size="sm"
                      className="flex-1"
                      onClick={() => onClose && onClose(_id)}
                    >
                      Close
                    </Button>
                  )}
                </div>
                <Button
                  variant="danger"
                  size="sm"
                  className="w-full"
                  onClick={() => onDelete && onDelete(_id)}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
};

export default CampaignCard;