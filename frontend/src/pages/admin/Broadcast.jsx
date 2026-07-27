import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { userService, notificationService } from '../../services/api';
import { extractListFromResponse } from '../../lib/apiNormalize';
import PageHeader from '../../components/PageHeader';
import Button from '../../components/Button';
import './AdminPages.css';

const BROADCAST_PRESETS = [
  {
    icon: '🌧️',
    label: 'Rain Delay',
    text: 'Dear customer, our milk delivery is delayed by 30-40 minutes today due to heavy rainfall. We appreciate your patience and support! - RaithuPalu Dairy'
  },
  {
    icon: '🐄',
    label: 'Fresh Ghee Stock',
    text: 'Dear customer, our fresh, organic pure homemade Ghee is back in stock! Order yours today via your RaithuPalu customer portal. - RaithuPalu Dairy'
  },
  {
    icon: '🧾',
    label: 'Payment Due alert',
    text: 'Dear customer, please review your outstanding monthly milk statement in your billing portal and complete your payment. Thank you! - RaithuPalu Dairy'
  },
  {
    icon: '🌾',
    label: 'Festive Holiday Pause',
    text: 'Dear customer, our deliveries will be paused on the upcoming festive holiday. Please adjust your order schedule or message us with changes. - RaithuPalu Dairy'
  }
];

const Broadcast = () => {
  const [targetUserId, setTargetUserId] = useState('all');
  const [message, setMessage] = useState('');
  const [sending, setDeletingId] = useState(false);
  const [statusBanner, setSubmitStatus] = useState(null);
  const [resultsLog, setResultsLog] = useState([]);

  // Fetch active customers
  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['admin', 'users-list'],
    queryFn: async () => {
      const response = await userService.getAll();
      const list = extractListFromResponse(response);
      return list.filter(u => u.role === 'customer' && u.isActive);
    }
  });

  const customers = usersData || [];

  const handleApplyPreset = (text) => {
    setMessage(text);
  };

  const handleSendBroadcast = async (e) => {
    e.preventDefault();
    if (!message.trim()) {
      setSubmitStatus({
        type: 'error',
        message: 'Please write a message before sending.'
      });
      return;
    }

    try {
      setDeletingId(true);
      setSubmitStatus(null);
      
      const payload = {
        targetUserId,
        message: message.trim()
      };

      const response = await notificationService.broadcast(payload);
      
      if (response.data?.success) {
        setSubmitStatus({
          type: 'success',
          message: response.data.message || 'Broadcast completed successfully!'
        });
        
        // Log individual results
        if (response.data.results) {
          setResultsLog(response.data.results);
        }
        
        // Clear message box on success
        setMessage('');
      } else {
        setSubmitStatus({
          type: 'error',
          message: 'Failed to process broadcast.'
        });
      }
    } catch (err) {
      console.error('Error broadcasting message:', err);
      setSubmitStatus({
        type: 'error',
        message: err.message || 'Failed to dispatch alert. Check your network or Twilio API credentials.'
      });
    } finally {
      setDeletingId(false);
    }
  };

  return (
    <div className="admin-page">
      <PageHeader title="Notification Broadcaster" subtitle="Dispatch high-importance alerts via WhatsApp and In-App notification logs" />

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '32px' }} className="buffalo-details-grid">
        {/* Form Column */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="page-card"
          style={{ padding: '24px' }}
        >
          <h3 className="section-title" style={{ fontSize: '1.2rem', marginBottom: '20px' }}>📢 Compose New Alert</h3>
          
          <form onSubmit={handleSendBroadcast} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Target Audience */}
            <div className="form-group-custom">
              <label className="form-label">Target Audience</label>
              {usersLoading ? (
                <div style={{ fontSize: '0.9rem', color: '#999' }}>Loading clients roster...</div>
              ) : (
                <select
                  className="form-select-custom"
                  value={targetUserId}
                  onChange={(e) => setTargetUserId(e.target.value)}
                  style={{ width: '100%' }}
                >
                  <option value="all">🌐 All Active Customers ({customers.length} users)</option>
                  {customers.map(c => (
                    <option key={c._id} value={c._id}>
                      👤 @{c.username} ({c.phone || 'No Phone'})
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Presets */}
            <div className="form-group-custom">
              <label className="form-label" style={{ marginBottom: '10px' }}>💡 Message Templates</label>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                {BROADCAST_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    className="filter-button"
                    onClick={() => handleApplyPreset(preset.text)}
                    style={{ padding: '6px 12px', fontSize: '0.8rem', minHeight: '36px', display: 'flex', alignItems: 'center', gap: '6px' }}
                  >
                    <span>{preset.icon}</span> {preset.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Message Textbox */}
            <div className="form-group-custom">
              <label className="form-label">Alert Message (WhatsApp & In-App)</label>
              <textarea
                className="form-input"
                rows={6}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                required
                style={{ resize: 'vertical', width: '100%', fontFamily: 'inherit', padding: '12px' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px', fontSize: '0.8rem', color: '#999' }}>
                <span>Keep text clear and brief.</span>
                <span>{message.length} characters</span>
              </div>
            </div>

            {statusBanner && (
              <div className={`alert ${statusBanner.type === 'success' ? 'alert-success' : 'alert-error'}`}>
                {statusBanner.type === 'success' ? '✓ ' : '⚠️ '} {statusBanner.message}
              </div>
            )}

            <Button
              type="submit"
              variant="primary"
              disabled={sending}
              style={{ padding: '14px 28px', width: '100%' }}
            >
              {sending ? '🚀 Broadcasting Alert...' : '🚀 Dispatch Broadcast Alert'}
            </Button>
          </form>
        </motion.div>

        {/* Info & Logs Column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Dispatch summary guide */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="page-card"
            style={{ padding: '24px', background: 'linear-gradient(135deg, rgba(37,99,235,0.02), rgba(37,99,235,0.06))', border: '1px solid rgba(37,99,235,0.15)' }}
          >
            <h4 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '12px', color: '#2563eb' }}>ℹ️ Multi-Channel Dispatch</h4>
            <ul style={{ margin: 0, paddingLeft: '20px', fontSize: '0.88rem', color: 'var(--ds-text-muted)', lineHeight: '1.6', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <li><strong>Twilio WhatsApp API</strong>: Triggers immediate push message warnings to customer mobile phones.</li>
              <li><strong>In-App Log Notifications</strong>: Injects an alert entry in the customer's feed on their personal dashboard.</li>
              <li><strong>Auto-Formatting</strong>: Phone numbers are automatically converted to clean +91 Indian format on dispatch.</li>
              <li><strong>Brute Prevention</strong>: Uses exponential backoff handler to retry on network dropouts.</li>
            </ul>
          </motion.div>

          {/* Results table */}
          {resultsLog.length > 0 && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="page-card"
              style={{ padding: '24px' }}
            >
              <h4 className="card-title" style={{ fontSize: '1.1rem', marginBottom: '16px' }}>📋 Last Broadcast Dispatch Log</h4>
              
              <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid var(--ds-border)', textAlign: 'left' }}>
                      <th style={{ padding: '8px', color: 'var(--ds-text-muted)' }}>Customer</th>
                      <th style={{ padding: '8px', color: 'var(--ds-text-muted)' }}>WhatsApp Push</th>
                    </tr>
                  </thead>
                  <tbody>
                    {resultsLog.map((log) => (
                      <tr key={log.userId} style={{ borderBottom: '1px solid var(--ds-border)' }}>
                        <td style={{ padding: '8px', fontWeight: '600', color: 'var(--ds-text)' }}>@{log.username}</td>
                        <td style={{ padding: '8px' }}>
                          {log.whatsappSent ? (
                            <span style={{ color: '#16a34a', fontWeight: 'bold' }}>✓ Dispatched</span>
                          ) : (
                            <span style={{ color: '#dc2626', fontWeight: 'bold' }} title={log.error}>
                              ✕ Failed ({log.error || 'Unknown'})
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Broadcast;