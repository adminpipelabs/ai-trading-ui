import React, { useState, useEffect } from 'react';
import { X, Wallet, Plus, Trash2, Edit2, Save } from 'lucide-react';

export function EditClientModal({ client, onClose, onUpdate, theme }) {
  const [name, setName] = useState(client.name || '');
  const [email, setEmail] = useState(client.email || '');
  const [wallets, setWallets] = useState(client.wallets || []);
  const [primaryWallet, setPrimaryWallet] = useState(client.wallet_address || client.wallets?.[0]?.address || '');
  const [editingWalletId, setEditingWalletId] = useState(null);
  const [newWalletAddress, setNewWalletAddress] = useState('');
  const [newWalletChain, setNewWalletChain] = useState('solana');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    // Initialize wallets from client
    if (client.wallets && client.wallets.length > 0) {
      setWallets(client.wallets);
      if (!primaryWallet) {
        setPrimaryWallet(client.wallets[0].address);
      }
    } else if (client.wallet_address) {
      // Legacy: create wallet entry from wallet_address
      setWallets([{
        id: 'primary',
        address: client.wallet_address,
        chain: client.wallet_address.startsWith('0x') ? 'evm' : 'solana'
      }]);
      setPrimaryWallet(client.wallet_address);
    }
  }, [client]);

  const validateWalletAddress = (address) => {
    if (!address) return false;
    const isEVM = address.match(/^0x[a-fA-F0-9]{40}$/);
    const isSolana = address.length >= 32 && address.length <= 44 && /^[1-9A-HJ-NP-Za-km-z]+$/.test(address);
    return isEVM || isSolana;
  };

  const handleSave = async () => {
    setIsSubmitting(true);
    setError('');

    try {
      const { adminAPI } = await import('../../services/api');

      // Update client info (name, email, primary wallet_address)
      await adminAPI.updateClient(client.id, {
        name,
        email: email || null,
        wallet_address: primaryWallet
      });

      // Refresh client data
      await onUpdate();
      onClose();
    } catch (err) {
      console.error('Failed to update client:', err);
      setError(err.message || 'Failed to update client. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleAddWallet = async () => {
    if (!validateWalletAddress(newWalletAddress)) {
      setError('Invalid wallet address. EVM: 0x followed by 40 hex characters. Solana: 32-44 base58 characters.');
      return;
    }

    // Check for duplicates
    if (wallets.some(w => w.address.toLowerCase() === newWalletAddress.toLowerCase())) {
      setError('Wallet address already exists for this client.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.addClientWallet(client.id, newWalletAddress, newWalletChain);
      
      // Refresh client data
      await onUpdate();
      setNewWalletAddress('');
      setNewWalletChain('solana');
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to add wallet:', err);
      setError(err.message || 'Failed to add wallet. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleUpdateWallet = async (walletId, newAddress, chain) => {
    if (!validateWalletAddress(newAddress)) {
      setError('Invalid wallet address.');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.updateClientWallet(client.id, walletId, newAddress, chain);
      
      // Refresh client data
      await onUpdate();
      setEditingWalletId(null);
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to update wallet:', err);
      setError(err.message || 'Failed to update wallet. Please try again.');
      setIsSubmitting(false);
    }
  };

  const handleDeleteWallet = async (walletId) => {
    if (!window.confirm('Are you sure you want to delete this wallet? The client will not be able to log in with this wallet.')) {
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { adminAPI } = await import('../../services/api');
      await adminAPI.deleteClientWallet(client.id, walletId);
      
      // Refresh client data
      await onUpdate();
      setIsSubmitting(false);
    } catch (err) {
      console.error('Failed to delete wallet:', err);
      setError(err.message || 'Failed to delete wallet. Please try again.');
      setIsSubmitting(false);
    }
  };

  const setAsPrimary = (walletAddress) => {
    setPrimaryWallet(walletAddress);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0, 0, 0, 0.5)' }}>
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col" style={{ background: theme.bgPrimary }}>
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b" style={{ borderColor: theme.border }}>
          <h2 className="text-xl font-semibold" style={{ color: theme.textPrimary }}>Edit Client</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:opacity-70" style={{ color: theme.textSecondary }}>
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="p-3 rounded-lg text-sm" style={{ background: 'rgba(239, 68, 68, 0.1)', color: theme.negative }}>
              {error}
            </div>
          )}

          {/* Client Name */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Client Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              placeholder="Enter client name"
            />
          </div>

          {/* Email */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>Email (Optional)</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm outline-none"
              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              placeholder="client@example.com"
            />
          </div>

          {/* Primary Wallet (Login Wallet) */}
          <div>
            <label className="block text-sm font-medium mb-2" style={{ color: theme.textSecondary }}>
              Primary Wallet Address <span className="text-xs" style={{ color: theme.textMuted }}>(Used for login)</span>
            </label>
            <input
              type="text"
              value={primaryWallet}
              onChange={e => setPrimaryWallet(e.target.value)}
              className="w-full px-4 py-2 rounded-lg text-sm font-mono outline-none"
              style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              placeholder="0x... or Solana address"
            />
            <p className="text-xs mt-1" style={{ color: theme.textMuted }}>
              This is the wallet address the client uses to log in. Changing this will update their login credentials.
            </p>
          </div>

          {/* Additional Wallets */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-sm font-medium" style={{ color: theme.textSecondary }}>
                Additional Wallets <span className="text-xs font-normal" style={{ color: theme.textMuted }}>(For team access)</span>
              </label>
            </div>
            
            <div className="space-y-2 mb-3">
              {wallets.filter(w => w.address.toLowerCase() !== primaryWallet.toLowerCase()).map((wallet) => (
                <div key={wallet.id} className="flex items-center gap-2 p-3 rounded-lg" style={{ background: theme.bgSecondary }}>
                  {editingWalletId === wallet.id ? (
                    <>
                      <input
                        type="text"
                        defaultValue={wallet.address}
                        className="flex-1 px-3 py-1.5 rounded text-xs font-mono outline-none"
                        style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                        onBlur={(e) => {
                          if (e.target.value !== wallet.address) {
                            handleUpdateWallet(wallet.id, e.target.value, wallet.chain);
                          } else {
                            setEditingWalletId(null);
                          }
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.target.blur();
                          } else if (e.key === 'Escape') {
                            setEditingWalletId(null);
                          }
                        }}
                        autoFocus
                      />
                      <select
                        value={wallet.chain}
                        onChange={(e) => handleUpdateWallet(wallet.id, wallet.address, e.target.value)}
                        className="px-2 py-1.5 rounded text-xs outline-none"
                        style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                      >
                        <option value="evm">EVM</option>
                        <option value="solana">Solana</option>
                      </select>
                    </>
                  ) : (
                    <>
                      <Wallet size={14} style={{ color: theme.textMuted }} />
                      <span className="flex-1 font-mono text-xs" style={{ color: theme.textPrimary }}>
                        {wallet.address}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded" style={{ background: theme.bgInput, color: theme.textSecondary }}>
                        {wallet.chain || 'unknown'}
                      </span>
                      <button
                        onClick={() => setEditingWalletId(wallet.id)}
                        className="p-1.5 rounded hover:opacity-70"
                        style={{ color: theme.accent }}
                        title="Edit wallet"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteWallet(wallet.id)}
                        className="p-1.5 rounded hover:opacity-70"
                        style={{ color: theme.negative }}
                        title="Delete wallet"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* Add New Wallet */}
            <div className="flex gap-2">
              <input
                type="text"
                value={newWalletAddress}
                onChange={e => setNewWalletAddress(e.target.value)}
                className="flex-1 px-4 py-2 rounded-lg text-sm font-mono outline-none"
                style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
                placeholder="Enter wallet address"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newWalletAddress) {
                    handleAddWallet();
                  }
                }}
              />
              <select
                value={newWalletChain}
                onChange={e => setNewWalletChain(e.target.value)}
                className="px-3 py-2 rounded-lg text-sm outline-none"
                style={{ background: theme.bgInput, border: `1px solid ${theme.border}`, color: theme.textPrimary }}
              >
                <option value="evm">EVM</option>
                <option value="solana">Solana</option>
              </select>
              <button
                onClick={handleAddWallet}
                disabled={!newWalletAddress || isSubmitting}
                className="px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
                style={{ background: theme.accent, color: 'white' }}
              >
                <Plus size={16} /> Add
              </button>
            </div>
            <p className="text-xs mt-2" style={{ color: theme.textMuted }}>
              Add additional wallet addresses for team members. Each wallet can be used to log in to the same client account.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t" style={{ borderColor: theme.border }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ color: theme.textSecondary, border: `1px solid ${theme.border}` }}
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={!name || !primaryWallet || isSubmitting}
            className="px-6 py-2 rounded-lg text-sm font-medium flex items-center gap-2 disabled:opacity-50"
            style={{ background: theme.accent, color: 'white' }}
          >
            {isSubmitting ? 'Saving...' : (
              <>
                <Save size={16} /> Save Changes
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
