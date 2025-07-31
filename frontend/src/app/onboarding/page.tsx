'use client';

import React, { useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { brandContent } from '@/components/ui/BrandKit';
import { 
  CheckCircle, 
  ArrowRight, 
  Zap, 
  BarChart3, 
  Users, 
  Shield, 
  Sparkles,
  ChevronRight
} from 'lucide-react';

const onboardingSteps = [
  {
    id: 'welcome',
    title: 'Welcome to ChannelZap',
    description: 'Your complete multi-channel business management platform',
    icon: Sparkles,
    color: 'from-blue-500 to-purple-600',
  },
  {
    id: 'features',
    title: 'Discover Key Features',
    description: 'Explore the powerful tools that will transform your business',
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
  },
  {
    id: 'setup',
    title: 'Quick Setup',
    description: 'Get your workspace configured in just a few minutes',
    icon: BarChart3,
    color: 'from-pink-500 to-red-600',
  },
  {
    id: 'team',
    title: 'Invite Your Team',
    description: 'Collaborate with your team members effectively',
    icon: Users,
    color: 'from-red-500 to-orange-600',
  },
];

const features = [
  {
    icon: BarChart3,
    title: 'Advanced Analytics',
    description: 'Get deep insights into your business performance with comprehensive reports and real-time dashboards.',
  },
  {
    icon: Shield,
    title: 'Enterprise Security',
    description: 'Your data is protected with enterprise-grade security, encryption, and compliance standards.',
  },
  {
    icon: Zap,
    title: 'Automation Tools',
    description: 'Streamline your workflows with powerful automation features that save time and reduce errors.',
  },
  {
    icon: Users,
    title: 'Team Collaboration',
    description: 'Work together seamlessly with role-based permissions and real-time collaboration tools.',
  },
];

export default function OnboardingPage() {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const handleStepComplete = (stepIndex: number) => {
    if (!completedSteps.includes(stepIndex)) {
      setCompletedSteps([...completedSteps, stepIndex]);
    }
    if (stepIndex < onboardingSteps.length - 1) {
      setCurrentStep(stepIndex + 1);
    }
  };

  const currentStepData = onboardingSteps[currentStep];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-blue-600 to-purple-600 opacity-10" />
        <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <div className="mb-6">
              <Logo size="xl" textSize="3xl" />
            </div>
            <div className="mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-4">
                Welcome to the Future of Business Management
              </h1>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                {brandContent.description}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Progress Indicator */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
        <div className="flex items-center justify-between">
          {onboardingSteps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <div
                className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-300 ${
                  completedSteps.includes(index)
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}
              >
                {completedSteps.includes(index) ? (
                  <CheckCircle className="h-6 w-6" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>
              {index < onboardingSteps.length - 1 && (
                <div
                  className={`h-1 w-24 mx-4 rounded-full transition-all duration-300 ${
                    completedSteps.includes(index)
                      ? 'bg-green-500'
                      : 'bg-gray-200'
                  }`}
                />
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Current Step Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 pb-12">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          {/* Step Header */}
          <div className={`bg-gradient-to-r ${currentStepData.color} p-8 text-white`}>
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-white/20 rounded-xl">
                <currentStepData.icon className="h-8 w-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold">{currentStepData.title}</h2>
                <p className="text-white/90">{currentStepData.description}</p>
              </div>
            </div>
          </div>

          {/* Step Content */}
          <div className="p-8">
            {currentStep === 0 && (
              <div className="text-center">
                <div className="mb-8">
                  <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                    Ready to Transform Your Business?
                  </h3>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    ChannelZap brings together all the tools you need to manage your business effectively. 
                    From inventory management to financial reporting, we've got you covered.
                  </p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {features.map((feature, index) => (
                    <div key={index} className="text-center p-4 rounded-lg bg-gray-50">
                      <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 text-blue-600 rounded-lg mb-3">
                        <feature.icon className="h-6 w-6" />
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                      <p className="text-sm text-gray-600">{feature.description}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 1 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Powerful Features at Your Fingertips</h3>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {features.map((feature, index) => (
                    <div key={index} className="flex gap-4 p-4 rounded-lg border border-gray-200 hover:border-blue-300 transition-colors">
                      <div className="flex-shrink-0">
                        <div className="w-10 h-10 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                          <feature.icon className="h-5 w-5" />
                        </div>
                      </div>
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-2">{feature.title}</h4>
                        <p className="text-gray-600">{feature.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 2 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Setup Checklist</h3>
                <div className="space-y-4">
                  {[
                    'Configure your company profile',
                    'Set up your chart of accounts',
                    'Import your inventory data',
                    'Configure user permissions',
                    'Connect your integrations'
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50">
                      <CheckCircle className="h-5 w-5 text-green-500" />
                      <span className="text-gray-900">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {currentStep === 3 && (
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Invite Your Team</h3>
                <p className="text-gray-600 mb-6">
                  Collaboration is key to success. Invite your team members and assign roles to get everyone working together.
                </p>
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Users className="h-6 w-6 text-blue-600" />
                    <h4 className="font-semibold text-blue-900">Team Collaboration Features</h4>
                  </div>
                  <ul className="space-y-2 text-blue-800">
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      Role-based access control
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      Real-time collaboration
                    </li>
                    <li className="flex items-center gap-2">
                      <ChevronRight className="h-4 w-4" />
                      Activity tracking and notifications
                    </li>
                  </ul>
                </div>
              </div>
            )}

            {/* Action Button */}
            <div className="flex justify-center mt-8">
              <button
                onClick={() => handleStepComplete(currentStep)}
                className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
              >
                {currentStep === onboardingSteps.length - 1 ? 'Get Started' : 'Continue'}
                <ArrowRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-8">
          <p className="text-gray-600 mb-2">
            Need help getting started? Contact our support team at{' '}
            <a 
              href={`mailto:${brandContent.supportEmail}`}
              className="text-blue-600 hover:text-blue-500"
            >
              {brandContent.supportEmail}
            </a>
          </p>
          <p className="text-sm text-gray-500">{brandContent.copyright}</p>
        </div>
      </div>
    </div>
  );
}
