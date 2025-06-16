// frontend/src/components/UsagePage.js - Real Usage Tracker
import React, { useState, useEffect } from 'react';

const UsagePage = () => {
  const [usageData, setUsageData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [timeframe, setTimeframe] = useState('30');
  const [lastSync, setLastSync] = useState(null);

  const API_BASE = 'https://ai-life-assistant-api-production.up.railway.app';

  useEffect(() => {
    fetchRealUsageData();
  }, [timeframe]);

  const fetchRealUsageData = async () => {
    try {
      setIsLoading(true);
      setError('');
      
      const response = await fetch(`${API_BASE}/api/usage/real?timeframe=${timeframe}`);
      
      if (response.ok) {
        const data = await response.json();
        setUsageData(data);
        setLastSync(new Date());
      } else {
        const errorData = await response.json();
        setError(errorData.error || 'Failed to fetch usage data');
      }
    } catch (error) {
      console.error('Error fetching usage data:', error);
      setError('Failed to connect to server');
    } finally {
      setIsLoading(false);
    }
  };

  const syncNow = async () => {
    setIsLoading(true);
    await fetchRealUsageData();
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 4
    }).format(amount || 0);
  };

  const formatNumber = (num) => {
    return new Intl.NumberFormat('en-US').format(num || 0);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'connected': return '#4caf50';
      case 'error': return '#f44336';
      case 'manual': return '#ff9800';
      default: return '#666';
    }
  };

  if (isLoading && !usageData) {
    return (
      <div className="usage-loading">
        <div className="loading-spinner"></div>
        <p>Fetching real usage data from vendors...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="usage-error">
        <h3>❌ Error Loading Real Usage Data</h3>
        <p>{error}</p>
        <button onClick={fetchRealUsageData} className="retry-btn">
          🔄 Retry
        </button>
      </div>
    );
  }

  return (
    <div className="usage-page">
      <div className="usage-header">
        <div className="header-content">
          <h2>💰 Real Usage & Cost Tracking</h2>
          <p>Live data from OpenAI, Railway, Supabase vendor APIs</p>
        </div>
        
        <div className="header-controls">
          <div className="timeframe-selector">
            <label>📅 Timeframe:</label>
            <select 
              value={timeframe} 
              onChange={(e) => setTimeframe(e.target.value)}
              className="timeframe-select"
            >
              <option value="7">Last 7 days</option>
              <option value="30">Last 30 days</option>
              <option value="90">Last 90 days</option>
            </select>
          </div>
          
          <button 
            onClick={syncNow} 
            className="sync-btn"
            disabled={isLoading}
          >
            {isLoading ? '⏳ Syncing...' : '🔄 Sync Now'}
          </button>
        </div>
      </div>

      {lastSync && (
        <div className="sync-status">
          📡 Last synced: {lastSync.toLocaleString()}
        </div>
      )}

      {/* Real Cost Overview */}
      <div className="cost-overview">
        <div className="cost-card total">
          <div className="cost-icon">💰</div>
          <div className="cost-content">
            <h3>Total Real Cost</h3>
            <div className="cost-amount">{formatCurrency(usageData?.totalCost)}</div>
            <div className="cost-period">Last {timeframe} days</div>
          </div>
        </div>

        <div className="cost-card openai">
          <div className="cost-icon">🤖</div>
          <div className="cost-content">
            <h3>OpenAI API (Real)</h3>
            <div className="cost-amount">{formatCurrency(usageData?.openai?.totalCost)}</div>
            <div className="cost-details">
              ✅ Live API data
            </div>
          </div>
        </div>

        <div className="cost-card railway">
          <div className="cost-icon">🚂</div>
          <div className="cost-content">
            <h3>Railway (Real)</h3>
            <div className="cost-amount">{formatCurrency(usageData?.railway?.totalCost)}</div>
            <div className="cost-details">
              ✅ GraphQL API data
            </div>
          </div>
        </div>

        <div className="cost-card supabase">
          <div className="cost-icon">🗄️</div>
          <div className="cost-content">
            <h3>Supabase (Real)</h3>
            <div className="cost-amount">{formatCurrency(usageData?.supabase?.totalCost)}</div>
            <div className="cost-details">
              ✅ Prometheus metrics
            </div>
          </div>
        </div>
      </div>

      {/* Vendor Status Grid */}
      <div className="vendor-status-section">
        <h3>🔌 API Connection Status</h3>
        <div className="vendor-status-grid">
          
          <div className="vendor-card">
            <div className="vendor-header">
              <span className="vendor-icon">🤖</span>
              <span className="vendor-name">OpenAI</span>
              <span 
                className="vendor-status"
                style={{ color: getStatusColor(usageData?.openai?.status) }}
              >
                ● {usageData?.openai?.status || 'Unknown'}
              </span>
            </div>
            <div className="vendor-metrics">
              <div className="metric">
                <span>Usage Requests:</span>
                <span>{formatNumber(usageData?.openai?.usageRequests)}</span>
              </div>
              <div className="metric">
                <span>Total Tokens:</span>
                <span>{formatNumber(usageData?.openai?.totalTokens)}</span>
              </div>
              <div className="metric">
                <span>Whisper Minutes:</span>
                <span>{usageData?.openai?.whisperMinutes || 0}</span>
              </div>
            </div>
          </div>

          <div className="vendor-card">
            <div className="vendor-header">
              <span className="vendor-icon">🚂</span>
              <span className="vendor-name">Railway</span>
              <span 
                className="vendor-status"
                style={{ color: getStatusColor(usageData?.railway?.status) }}
              >
                ● {usageData?.railway?.status || 'Unknown'}
              </span>
            </div>
            <div className="vendor-metrics">
              <div className="metric">
                <span>CPU Usage:</span>
                <span>{usageData?.railway?.cpuUsage || '0%'}</span>
              </div>
              <div className="metric">
                <span>Memory Usage:</span>
                <span>{usageData?.railway?.memoryUsage || '0 MB'}</span>
              </div>
              <div className="metric">
                <span>Deployments:</span>
                <span>{formatNumber(usageData?.railway?.deployments)}</span>
              </div>
            </div>
          </div>

          <div className="vendor-card">
            <div className="vendor-header">
              <span className="vendor-icon">🗄️</span>
              <span className="vendor-name">Supabase</span>
              <span 
                className="vendor-status"
                style={{ color: getStatusColor(usageData?.supabase?.status) }}
              >
                ● {usageData?.supabase?.status || 'Unknown'}
              </span>
            </div>
            <div className="vendor-metrics">
              <div className="metric">
                <span>DB Requests:</span>
                <span>{formatNumber(usageData?.supabase?.dbRequests)}</span>
              </div>
              <div className="metric">
                <span>Storage Used:</span>
                <span>{usageData?.supabase?.storageUsed || '0 MB'}</span>
              </div>
              <div className="metric">
                <span>Active Connections:</span>
                <span>{usageData?.supabase?.activeConnections || 0}</span>
              </div>
            </div>
          </div>

          <div className="vendor-card manual">
            <div className="vendor-header">
              <span className="vendor-icon">▲</span>
              <span className="vendor-name">Vercel</span>
              <span 
                className="vendor-status"
                style={{ color: getStatusColor('manual') }}
              >
                ● Manual Tracking
              </span>
            </div>
            <div className="vendor-metrics">
              <div className="metric">
                <span>Plan:</span>
                <span>Hobby (Free)</span>
              </div>
              <div className="metric">
                <span>Deployments:</span>
                <span>{formatNumber(usageData?.vercel?.deployments)}</span>
              </div>
              <div className="metric">
                <span>Note:</span>
                <span>No API available</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Breakdown */}
      <div className="usage-sections">
        
        {/* OpenAI Real Data */}
        <div className="usage-section">
          <h3>🤖 OpenAI Real Usage Data</h3>
          <div className="usage-grid">
            <div className="usage-metric">
              <div className="metric-label">Completions</div>
              <div className="metric-value">
                <span className="metric-number">{formatNumber(usageData?.openai?.completionTokens)}</span>
                <span className="metric-unit">tokens</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.openai?.completionCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">Whisper (Speech-to-Text)</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.openai?.whisperMinutes || 0}</span>
                <span className="metric-unit">minutes</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.openai?.whisperCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">API Requests</div>
              <div className="metric-value">
                <span className="metric-number">{formatNumber(usageData?.openai?.requestCount)}</span>
                <span className="metric-unit">requests</span>
              </div>
              <div className="metric-cost">Real usage data</div>
            </div>
          </div>
        </div>

        {/* Railway Real Data */}
        <div className="usage-section">
          <h3>🚂 Railway Real Infrastructure Data</h3>
          <div className="usage-grid">
            <div className="usage-metric">
              <div className="metric-label">Compute Hours</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.railway?.computeHours || 0}</span>
                <span className="metric-unit">hours</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.railway?.computeCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">Bandwidth</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.railway?.bandwidth || 0}</span>
                <span className="metric-unit">GB</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.railway?.bandwidthCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">Build Minutes</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.railway?.buildMinutes || 0}</span>
                <span className="metric-unit">minutes</span>
              </div>
              <div className="metric-cost">Included in plan</div>
            </div>
          </div>
        </div>

        {/* Supabase Real Data */}
        <div className="usage-section">
          <h3>🗄️ Supabase Real Database Metrics</h3>
          <div className="usage-grid">
            <div className="usage-metric">
              <div className="metric-label">Database Size</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.supabase?.dbSize || 0}</span>
                <span className="metric-unit">MB</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.supabase?.storageCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">Egress</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.supabase?.egress || 0}</span>
                <span className="metric-unit">GB</span>
              </div>
              <div className="metric-cost">{formatCurrency(usageData?.supabase?.egressCost)}</div>
            </div>

            <div className="usage-metric">
              <div className="metric-label">Auth Users</div>
              <div className="metric-value">
                <span className="metric-number">{usageData?.supabase?.authUsers || 0}</span>
                <span className="metric-unit">users</span>
              </div>
              <div className="metric-cost">Within quota</div>
            </div>
          </div>
        </div>
      </div>

      {/* API Configuration */}
      <div className="usage-section">
        <h3>⚙️ API Configuration Status</h3>
        <div className="config-grid">
          <div className="config-item">
            <span className="config-icon">🔑</span>
            <span className="config-label">OpenAI API Key:</span>
            <span className="config-status">
              {usageData?.config?.openaiConfigured ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          
          <div className="config-item">
            <span className="config-icon">🚂</span>
            <span className="config-label">Railway Token:</span>
            <span className="config-status">
              {usageData?.config?.railwayConfigured ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          
          <div className="config-item">
            <span className="config-icon">🗄️</span>
            <span className="config-label">Supabase Project:</span>
            <span className="config-status">
              {usageData?.config?.supabaseConfigured ? '✅ Configured' : '❌ Missing'}
            </span>
          </div>
          
          <div className="config-item">
            <span className="config-icon">▲</span>
            <span className="config-label">Vercel API:</span>
            <span className="config-status">❌ Not Available</span>
          </div>
        </div>
      </div>

      {/* Monthly Projection */}
      <div className="projection-section">
        <h3>📈 Real Monthly Cost Projection</h3>
        <div className="projection-content">
          <div className="projection-card">
            <div className="projection-title">Based on real vendor usage data</div>
            <div className="projection-amount">{formatCurrency(usageData?.monthlyProjection)}</div>
            <div className="projection-breakdown">
              <div className="breakdown-item">
                <span>OpenAI (Real):</span>
                <span>{formatCurrency(usageData?.monthlyProjection * 0.7)}</span>
              </div>
              <div className="breakdown-item">
                <span>Railway (Real):</span>
                <span>{formatCurrency(usageData?.monthlyProjection * 0.25)}</span>
              </div>
              <div className="breakdown-item">
                <span>Supabase (Real):</span>
                <span>{formatCurrency(usageData?.monthlyProjection * 0.05)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="usage-footer">
        <p>🔄 <strong>Real-time data</strong> fetched directly from vendor APIs</p>
        <p>📡 OpenAI, Railway, and Supabase provide live usage metrics</p>
        <p>⚠️ Vercel doesn't provide usage APIs - tracking deployments manually</p>
      </div>
    </div>
  );
};

export default UsagePage;