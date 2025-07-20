'use client';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Settings, Users, Globe, AlertTriangle } from 'lucide-react';
import { useState } from 'react';

interface FeatureFlag {
  id: number;
  name: string;
  description?: string;
  is_enabled_globally: boolean;
  enabled_companies: number[];
  disabled_companies: number[];
  rollout_percentage: number;
  created_at: string;
  updated_at: string;
}

interface FeatureFlagCardProps {
  feature: FeatureFlag;
  onUpdate: (data: Partial<FeatureFlag>) => void;
}

export function FeatureFlagCard({ feature, onUpdate }: FeatureFlagCardProps) {
  const [localRollout, setLocalRollout] = useState(feature.rollout_percentage);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleGlobalToggle = (enabled: boolean) => {
    onUpdate({
      is_enabled_globally: enabled,
      rollout_percentage: enabled ? 100 : localRollout,
    });
  };

  const handleRolloutChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newRollout = parseInt(event.target.value);
    setLocalRollout(newRollout);
    if (!feature.is_enabled_globally) {
      onUpdate({ rollout_percentage: newRollout });
    }
  };

  const getStatusColor = () => {
    if (feature.is_enabled_globally) return 'bg-green-100 text-green-800 border-green-200';
    if (feature.rollout_percentage > 0) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-gray-100 text-gray-800 border-gray-200';
  };

  const getStatusText = () => {
    if (feature.is_enabled_globally) return 'Global';
    if (feature.rollout_percentage > 0) return `${feature.rollout_percentage}% Rollout`;
    return 'Disabled';
  };

  const formatFeatureName = (name: string) => {
    return name
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <Card className="p-6">
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-900">
              {formatFeatureName(feature.name)}
            </h3>
            {feature.description && (
              <p className="text-sm text-gray-600 mt-1">{feature.description}</p>
            )}
          </div>
          <Badge className={`ml-3 ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </div>

        {/* Global Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Globe className="h-4 w-4 text-gray-500" />
            <Label htmlFor={`global-${feature.id}`} className="text-sm font-medium">
              Enable Globally
            </Label>
          </div>
          <Switch
            id={`global-${feature.id}`}
            checked={feature.is_enabled_globally}
            onCheckedChange={handleGlobalToggle}
          />
        </div>

        {/* Rollout Percentage */}
        {!feature.is_enabled_globally && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Rollout Percentage</Label>
              <span className="text-sm text-gray-600">{localRollout}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={localRollout}
              onChange={handleRolloutChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            />
          </div>
        )}

        {/* Company Overrides */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Users className="h-4 w-4 text-gray-500" />
              <span className="text-sm font-medium">Company Overrides</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              <Settings className="h-4 w-4" />
            </Button>
          </div>

          {isExpanded && (
            <div className="space-y-3 pt-2 border-t">
              {feature.enabled_companies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-green-700 mb-1">
                    Enabled Companies ({feature.enabled_companies.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {feature.enabled_companies.map((companyId) => (
                      <Badge key={companyId} variant="outline" className="text-xs bg-green-50">
                        Company {companyId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {feature.disabled_companies.length > 0 && (
                <div>
                  <p className="text-xs font-medium text-red-700 mb-1">
                    Disabled Companies ({feature.disabled_companies.length})
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {feature.disabled_companies.map((companyId) => (
                      <Badge key={companyId} variant="outline" className="text-xs bg-red-50">
                        Company {companyId}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {feature.enabled_companies.length === 0 && feature.disabled_companies.length === 0 && (
                <p className="text-xs text-gray-500 italic">No company overrides configured</p>
              )}
            </div>
          )}
        </div>

        {/* Warning for partial rollouts */}
        {!feature.is_enabled_globally && feature.rollout_percentage > 0 && feature.rollout_percentage < 100 && (
          <div className="flex items-center space-x-2 p-2 bg-yellow-50 border border-yellow-200 rounded-md">
            <AlertTriangle className="h-4 w-4 text-yellow-600" />
            <p className="text-xs text-yellow-700">
              Feature is partially rolled out. Some users may not have access.
            </p>
          </div>
        )}

        {/* Metadata */}
        <div className="text-xs text-gray-500 pt-2 border-t">
          <p>Created: {new Date(feature.created_at).toLocaleDateString()}</p>
          <p>Updated: {new Date(feature.updated_at).toLocaleDateString()}</p>
        </div>
      </div>
    </Card>
  );
}
