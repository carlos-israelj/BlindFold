'use client';

import React from 'react';
import { PortfolioAnalytics } from '@/types';

interface RiskScoreCardProps {
  analytics: PortfolioAnalytics;
}

export function RiskScoreCard({ analytics }: RiskScoreCardProps) {
  const getRiskColor = (score: number) => {
    if (score < 40) return 'text-green-600';
    if (score < 70) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getConcentrationColor = (concentration: string) => {
    switch (concentration) {
      case 'Low':
        return 'bg-green-100 text-green-800';
      case 'Medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'High':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskLevel = (score: number) => {
    if (score < 40) return 'Low Risk';
    if (score < 70) return 'Moderate Risk';
    return 'High Risk';
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
      <h3 className="text-lg font-semibold mb-4 text-gray-900">
        Portfolio Risk Analysis
      </h3>

      {/* Risk Score */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Risk Score</span>
          <span className={`text-2xl font-bold ${getRiskColor(analytics.riskScore)}`}>
            {analytics.riskScore}/100
          </span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2.5">
          <div
            className={`h-2.5 rounded-full ${
              analytics.riskScore < 40
                ? 'bg-green-600'
                : analytics.riskScore < 70
                ? 'bg-yellow-600'
                : 'bg-red-600'
            }`}
            style={{ width: `${analytics.riskScore}%` }}
          ></div>
        </div>
        <p className={`text-sm mt-1 ${getRiskColor(analytics.riskScore)}`}>
          {getRiskLevel(analytics.riskScore)}
        </p>
      </div>

      {/* Concentration */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Concentration</span>
          <span
            className={`text-xs font-medium px-2.5 py-0.5 rounded ${getConcentrationColor(
              analytics.concentration
            )}`}
          >
            {analytics.concentration}
          </span>
        </div>
        <p className="text-sm text-gray-600">
          HHI: {analytics.hhi.toFixed(0)}
          <span className="text-xs text-gray-500 ml-2">
            (&lt;1500 = diversified, &gt;2500 = concentrated)
          </span>
        </p>
      </div>

      {/* Top Holding */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700">Top Holding</span>
          <span className="text-sm font-semibold text-gray-900">
            {analytics.topHolding.percentage.toFixed(1)}%
          </span>
        </div>
        <p className="text-sm text-gray-600">{analytics.topHolding.token}</p>
      </div>

      {/* Diversification */}
      <div className="mb-6">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <p className="text-sm font-medium text-gray-700">Assets</p>
            <p className="text-xl font-semibold text-gray-900">
              {analytics.diversification.numAssets}
            </p>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-700">Effective Assets</p>
            <p className="text-xl font-semibold text-gray-900">
              {analytics.diversification.effectiveAssets.toFixed(1)}
            </p>
            <p className="text-xs text-gray-500">
              (10000 / HHI)
            </p>
          </div>
        </div>
      </div>

      {/* Recommendations */}
      <div>
        <h4 className="text-sm font-semibold text-gray-900 mb-3">
          Recommendations
        </h4>
        <ul className="space-y-2">
          {analytics.recommendations.map((recommendation, index) => (
            <li key={index} className="flex items-start">
              <span className="text-blue-600 mr-2 mt-0.5">•</span>
              <span className="text-sm text-gray-700">{recommendation}</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
