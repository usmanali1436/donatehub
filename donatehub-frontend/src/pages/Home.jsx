import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const Home = () => {
  const { isAuthenticated, user } = useAuth();

  const features = [
    {
      icon: '🎯',
      title: 'Campaign Management',
      description: 'Create and manage donation campaigns with detailed tracking and progress monitoring.',
    },
    {
      icon: '💝',
      title: 'Secure Donations',
      description: 'Safe and secure donation processing with full transparency and receipt tracking.',
    },
    {
      icon: '📊',
      title: 'Analytics Dashboard',
      description: 'Comprehensive dashboards for both NGOs and donors with detailed insights.',
    },
    {
      icon: '🌟',
      title: 'Impact Tracking',
      description: 'Track the real-world impact of your donations and campaigns.',
    },
  ];

  const stats = [
    { label: 'Total Raised', value: '$2.5M+' },
    { label: 'Active Campaigns', value: '150+' },
    { label: 'NGO Partners', value: '80+' },
    { label: 'Donors', value: '5,000+' },
  ];

  if (isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        {/* Navigation for authenticated users */}
        <nav className="bg-white shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between h-16">
              <Link to="/" className="flex items-center">
                <span className="text-2xl font-bold text-blue-600">DonateHub</span>
              </Link>
              <div className="flex items-center space-x-4">
                <span className="text-gray-700">Welcome back, {user?.fullName}</span>
                <Link to="/dashboard">
                  <Button>Go to Dashboard</Button>
                </Link>
              </div>
            </div>
          </div>
        </nav>

        {/* Welcome back section */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              Welcome back to DonateHub
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Continue making a difference with your {user?.role === 'ngo' ? 'campaigns' : 'donations'}
            </p>
            <div className="flex justify-center space-x-4">
              <Link to="/dashboard">
                <Button size="lg">View Dashboard</Button>
              </Link>
              <Link to="/campaigns">
                <Button variant="outline" size="lg">Browse Campaigns</Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <span className="text-2xl font-bold text-blue-600">DonateHub</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link to="/login">
                <Button variant="outline">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero section */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-16 pb-24">
        <div className="text-center">
          <h1 className="text-5xl font-bold text-gray-900 mb-6">
            Empowering Change Through
            <span className="text-blue-600"> Digital Donations</span>
          </h1>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            Connect NGOs with donors in a transparent, secure, and efficient platform.
            Track your impact, manage campaigns, and make a real difference in the world.
          </p>
          <div className="flex justify-center space-x-4">
            <Link to="/register">
              <Button size="lg" className="px-8 py-3">
                Start Donating
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="px-8 py-3">
                Create Campaign
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats section */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 mt-16">
          {stats.map((stat, index) => (
            <div key={index} className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">{stat.value}</div>
              <div className="text-gray-600">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Features section */}
      <div className="bg-white py-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">
              Why Choose DonateHub?
            </h2>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Our platform provides everything you need to create meaningful impact
              through strategic charitable giving and campaign management.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="text-center" hover>
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </div>
      </div>

      {/* CTA section */}
      <div className="bg-blue-600 py-16">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-white mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of donors and NGOs creating positive change worldwide.
          </p>
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Link to="/register">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto px-8">
                Sign Up as Donor
              </Button>
            </Link>
            <Link to="/register">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 text-white border-white hover:bg-white hover:text-blue-600">
                Register as NGO
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <div className="text-2xl font-bold mb-4">DonateHub</div>
            <p className="text-gray-400 mb-4">
              Empowering change through digital donations
            </p>
            <div className="text-sm text-gray-500">
              © 2025 DonateHub. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;