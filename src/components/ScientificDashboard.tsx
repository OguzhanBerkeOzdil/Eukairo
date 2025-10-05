/**
 * V3.0 SCIENTIFIC DASHBOARD
 * 
 * Advanced analytics interface showing:
 * - Real-time algorithm performance
 * - Confidence metrics
 * - Ensemble voting transparency
 * - Transfer learning insights
 * - Hierarchical model health
 */

import React, { useEffect, useState } from 'react';
import { FaBrain, FaChartLine, FaNetworkWired, FaBalanceScale } from 'react-icons/fa';
import { Line, Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';

import { loadData } from '../state/storage';
import { buildHierarchicalModel, diagnoseHierarchicalModel, exportHierarchicalInsights } from '../state/bayesian-hierarchical';
import { initializeTransferLearning, getTransferInsights, extractProtocolFeatures } from '../state/transfer-learning';
import type { SessionRecord, Goal } from '../types';

// Register ChartJS components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  RadialLinearScale,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardMetrics {
  totalTrials: number;
  convergenceRate: number;
  averageConfidence: number;
  explorationEfficiency: number;
  transferLearningGain: number;
}

export const ScientificDashboard: React.FC = () => {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal>('focus');
  const [hierarchicalHealth, setHierarchicalHealth] = useState<{
    diagnosis: ReturnType<typeof diagnoseHierarchicalModel>;
    insights: ReturnType<typeof exportHierarchicalInsights>;
  } | null>(null);
  const [transferInsights, setTransferInsights] = useState<ReturnType<typeof getTransferInsights> | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = () => {
    const data = loadData();
    const allSessions = data.history;
    setSessions(allSessions);

    if (allSessions.length === 0) {
      return;
    }

    // Calculate protocol-goal performance
    const protocolData: Record<string, Record<Goal, { alpha: number; beta: number; trials: number }>> = {};

    allSessions.forEach((session: SessionRecord) => {
      if (!protocolData[session.protocolId]) {
        protocolData[session.protocolId] = {
          focus: { alpha: 1.5, beta: 1.0, trials: 0 },
          calm: { alpha: 1.5, beta: 1.0, trials: 0 },
          'pre-sleep': { alpha: 1.5, beta: 1.0, trials: 0 }
        };
      }

      const model = protocolData[session.protocolId][session.goal as Goal];
      model.trials++;
      
      if (session.delta >= 0) {  // delta is -1, 0, or 1
        model.alpha += 1;
      } else {
        model.beta += 1;
      }
    });

    // Build hierarchical model
    const hierarchical = buildHierarchicalModel(protocolData);
    const diagnosis = diagnoseHierarchicalModel(hierarchical);
    const insights = exportHierarchicalInsights(hierarchical);

    setHierarchicalHealth({
      diagnosis,
      insights
    });

    // Transfer learning insights
    const knowledge = initializeTransferLearning();
    
    // Extract features for all protocols
    Object.keys(protocolData).forEach(protocolId => {
      const goalsWithData = Object.entries(protocolData[protocolId])
        .filter(([, model]) => model.trials > 0)
        .map(([goalKey]) => goalKey as Goal);
      
      if (goalsWithData.length > 0) {
        knowledge.protocolFeatures[protocolId] = extractProtocolFeatures(
          protocolId,
          240, // Default duration
          goalsWithData
        );
      }
    });

    const transferData = getTransferInsights(knowledge);
    setTransferInsights(transferData);

    // Calculate overall metrics
    const totalTrials = allSessions.length;
    const recentSessions = allSessions.slice(-20); // Last 20 sessions
    
    const convergenceRate = diagnosis.globalCoverage;
    const averageConfidence = 1 - diagnosis.averageShrinkage;
    const explorationEfficiency = recentSessions.filter((s: SessionRecord) => s.delta >= 0).length / recentSessions.length;
    const transferLearningGain = transferData.transferEffectiveness;

    setMetrics({
      totalTrials,
      convergenceRate,
      averageConfidence,
      explorationEfficiency,
      transferLearningGain
    });
  };

  const getConvergenceChartData = () => {
    if (!sessions.length) return null;

    const goalSessions = sessions.filter(s => s.goal === selectedGoal);
    const convergencePoints = [];

    for (let i = 0; i < goalSessions.length; i++) {
      const windowSize = 10;
      const window = goalSessions.slice(Math.max(0, i - windowSize), i + 1);
      
      const successRate = window.filter(s => s.delta >= 0).length / window.length;
      convergencePoints.push(successRate);
    }

    return {
      labels: goalSessions.map((_, i) => `Trial ${i + 1}`),
      datasets: [
        {
          label: 'Success Rate (10-trial moving avg)',
          data: convergencePoints,
          borderColor: 'rgb(59, 130, 246)',
          backgroundColor: 'rgba(59, 130, 246, 0.1)',
          fill: true,
          tension: 0.4
        },
        {
          label: 'Target (85%)',
          data: new Array(convergencePoints.length).fill(0.85),
          borderColor: 'rgb(34, 197, 94)',
          borderDash: [5, 5],
          pointRadius: 0
        }
      ]
    };
  };

  const getProtocolPerformanceChartData = () => {
    if (!hierarchicalHealth) return null;

    const protocolNames: string[] = [];
    const performanceScores: number[] = [];
    
    Object.entries(hierarchicalHealth.insights.goalStats).forEach(([, stats]) => {
      if (stats.bestProtocol) {
        protocolNames.push(stats.bestProtocol);
        performanceScores.push(stats.mean);
      }
    });

    return {
      labels: protocolNames,
      datasets: [
        {
          label: 'Performance Score',
          data: performanceScores,
          backgroundColor: [
            'rgba(59, 130, 246, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(34, 197, 94, 0.8)'
          ],
          borderColor: [
            'rgb(59, 130, 246)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
            'rgb(251, 146, 60)',
            'rgb(34, 197, 94)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  const getShrinkageDistributionChart = () => {
    if (!hierarchicalHealth) return null;

    const dist = hierarchicalHealth.insights.shrinkageDistribution;

    return {
      labels: ['Low Shrinkage\n(High Confidence)', 'Medium Shrinkage', 'High Shrinkage\n(Low Data)'],
      datasets: [
        {
          label: 'Protocol Count',
          data: [dist.low, dist.medium, dist.high],
          backgroundColor: [
            'rgba(34, 197, 94, 0.8)',
            'rgba(251, 146, 60, 0.8)',
            'rgba(239, 68, 68, 0.8)'
          ],
          borderColor: [
            'rgb(34, 197, 94)',
            'rgb(251, 146, 60)',
            'rgb(239, 68, 68)'
          ],
          borderWidth: 2
        }
      ]
    };
  };

  if (!metrics) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8 flex items-center justify-center">
        <div className="text-center">
          <FaBrain className="text-6xl text-blue-500 mx-auto mb-4 animate-pulse" />
          <p className="text-xl text-gray-600">No data yet. Complete some sessions to see analytics!</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50 p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2 flex items-center gap-3">
            <FaBrain className="text-blue-500" />
            V3.0 Scientific Dashboard
          </h1>
          <p className="text-gray-600">
            Advanced algorithmic insights powered by hierarchical Bayesian inference, ensemble methods, and transfer learning
          </p>
        </div>

        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
          <MetricCard
            icon={<FaChartLine />}
            title="Total Trials"
            value={metrics.totalTrials}
            color="blue"
          />
          <MetricCard
            icon={<FaBalanceScale />}
            title="Convergence Rate"
            value={`${(metrics.convergenceRate * 100).toFixed(1)}%`}
            subtitle={metrics.convergenceRate >= 0.85 ? 'Target Achieved!' : 'Building...'}
            color={metrics.convergenceRate >= 0.85 ? 'green' : 'orange'}
          />
          <MetricCard
            icon={<FaBrain />}
            title="Avg Confidence"
            value={`${(metrics.averageConfidence * 100).toFixed(1)}%`}
            color="purple"
          />
          <MetricCard
            icon={<FaNetworkWired />}
            title="Exploration Efficiency"
            value={`${(metrics.explorationEfficiency * 100).toFixed(1)}%`}
            color="pink"
          />
          <MetricCard
            icon={<FaNetworkWired />}
            title="Transfer Learning Gain"
            value={`${(metrics.transferLearningGain * 100).toFixed(1)}%`}
            color="indigo"
          />
        </div>

        {/* Goal Selector */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Goal for Detailed Analysis
          </label>
          <div className="flex gap-2">
            {(['focus', 'calm', 'pre-sleep'] as Goal[]).map(goal => (
              <button
                key={goal}
                onClick={() => setSelectedGoal(goal)}
                className={`px-6 py-2 rounded-lg font-medium transition-all ${
                  selectedGoal === goal
                    ? 'bg-blue-500 text-white shadow-lg scale-105'
                    : 'bg-white text-gray-700 hover:bg-gray-50'
                }`}
              >
                {goal === 'pre-sleep' ? 'Pre-Sleep' : goal.charAt(0).toUpperCase() + goal.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
          {/* Convergence Chart */}
          <ChartCard title="Convergence Over Time" subtitle="How quickly are we learning?">
            {getConvergenceChartData() && (
              <Line
                data={getConvergenceChartData()!}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { position: 'top' },
                    tooltip: { mode: 'index', intersect: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 1,
                      title: { display: true, text: 'Success Rate' }
                    }
                  }
                }}
              />
            )}
          </ChartCard>

          {/* Protocol Performance */}
          <ChartCard title="Protocol Performance by Goal" subtitle="Best performers for each goal">
            {getProtocolPerformanceChartData() && (
              <Bar
                data={getProtocolPerformanceChartData()!}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      max: 1,
                      title: { display: true, text: 'Mean Performance' }
                    }
                  }
                }}
              />
            )}
          </ChartCard>

          {/* Shrinkage Distribution */}
          <ChartCard title="Hierarchical Model Health" subtitle="Data sufficiency across protocols">
            {getShrinkageDistributionChart() && (
              <Bar
                data={getShrinkageDistributionChart()!}
                options={{
                  responsive: true,
                  plugins: {
                    legend: { display: false }
                  },
                  scales: {
                    y: {
                      beginAtZero: true,
                      title: { display: true, text: 'Number of Protocols' }
                    }
                  }
                }}
              />
            )}
          </ChartCard>

          {/* Model Diagnostics */}
          <DiagnosticsCard diagnosis={hierarchicalHealth?.diagnosis || {
            globalCoverage: 0,
            averageShrinkage: 0,
            dataSufficiency: 'poor',
            recommendations: []
          }} />
        </div>

        {/* Transfer Learning Insights */}
        {transferInsights && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <h2 className="text-2xl font-bold text-gray-800 mb-4 flex items-center gap-2">
              <FaNetworkWired className="text-indigo-500" />
              Transfer Learning Insights
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Most Similar Protocols</h3>
                <div className="space-y-2">
                  {transferInsights.mostSimilarPairs.slice(0, 5).map((pair, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">
                        {pair.protocol1} ↔ {pair.protocol2}
                      </span>
                      <span className="text-sm font-semibold text-indigo-600">
                        {(pair.similarity * 100).toFixed(0)}% similar
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">Fastest Learners</h3>
                <div className="space-y-2">
                  {transferInsights.fastestLearners.slice(0, 5).map((learner, i: number) => (
                    <div key={i} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-sm text-gray-700">
                        {learner.protocolId} ({learner.goal})
                      </span>
                      <span className="text-sm font-semibold text-green-600">
                        {learner.trialsToConvergence} trials
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper Components

interface MetricCardProps {
  icon: React.ReactNode;
  title: string;
  value: string | number;
  subtitle?: string;
  color: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ icon, title, value, subtitle, color }) => {
  const colorClasses = {
    blue: 'from-blue-500 to-blue-600',
    green: 'from-green-500 to-green-600',
    purple: 'from-purple-500 to-purple-600',
    pink: 'from-pink-500 to-pink-600',
    indigo: 'from-indigo-500 to-indigo-600',
    orange: 'from-orange-500 to-orange-600'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
      <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${colorClasses[color as keyof typeof colorClasses]} text-white mb-3`}>
        <div className="text-2xl">{icon}</div>
      </div>
      <h3 className="text-sm font-medium text-gray-600 mb-1">{title}</h3>
      <p className="text-3xl font-bold text-gray-800">{value}</p>
      {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
    </div>
  );
};

interface ChartCardProps {
  title: string;
  subtitle: string;
  children: React.ReactNode;
}

const ChartCard: React.FC<ChartCardProps> = ({ title, subtitle, children }) => (
  <div className="bg-white rounded-xl shadow-lg p-6">
    <h2 className="text-xl font-bold text-gray-800 mb-1">{title}</h2>
    <p className="text-sm text-gray-600 mb-4">{subtitle}</p>
    <div className="h-64">
      {children}
    </div>
  </div>
);

const DiagnosticsCard: React.FC<{ diagnosis: ReturnType<typeof diagnoseHierarchicalModel> }> = ({ diagnosis }) => {
  if (!diagnosis) return null;

  const sufficiencyColors = {
    excellent: 'text-green-600 bg-green-50',
    good: 'text-blue-600 bg-blue-50',
    fair: 'text-orange-600 bg-orange-50',
    poor: 'text-red-600 bg-red-50'
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Model Diagnostics</h2>
      
      <div className="space-y-4">
        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Global Coverage</span>
            <span className="text-sm font-bold text-blue-600">
              {(diagnosis.globalCoverage * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${diagnosis.globalCoverage * 100}%` }}
            />
          </div>
        </div>

        <div>
          <div className="flex justify-between items-center mb-2">
            <span className="text-sm font-medium text-gray-700">Average Shrinkage</span>
            <span className="text-sm font-bold text-purple-600">
              {(diagnosis.averageShrinkage * 100).toFixed(1)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-purple-500 h-2 rounded-full transition-all"
              style={{ width: `${diagnosis.averageShrinkage * 100}%` }}
            />
          </div>
        </div>

        <div className={`p-4 rounded-lg ${sufficiencyColors[diagnosis.dataSufficiency as keyof typeof sufficiencyColors]}`}>
          <p className="font-semibold">Data Sufficiency: {diagnosis.dataSufficiency.toUpperCase()}</p>
        </div>

        {diagnosis.recommendations.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-2">Recommendations</h3>
            <ul className="space-y-1">
              {diagnosis.recommendations.map((rec: string, i: number) => (
                <li key={i} className="text-xs text-gray-600 flex items-start gap-2">
                  <span className="text-blue-500 mt-0.5">•</span>
                  <span>{rec}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScientificDashboard;
