import React from 'react';
import { 
  Download, 
  Pin, 
  BarChart3, 
  TrendingUp, 
  TrendingDown,
  Play,
  Pause,
  Square,
  Settings,
  ExternalLink,
  Copy,
  Check
} from 'lucide-react';

/**
 * Price Card - Shows token price info
 */
export function PriceCard({ data, onSave, onDownload }) {
  const { token, pair, price, change, exchange } = data;
  const isPositive = change >= 0;

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary-600/20 rounded-lg flex items-center justify-center">
            <span className="text-primary-400 font-bold text-sm">{token?.[0]}</span>
          </div>
          <div>
            <div className="text-white font-medium">{pair || `${token}-USDT`}</div>
            <div className="text-dark-400 text-xs">{exchange}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1 ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
          {isPositive ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
          <span className="text-sm">{isPositive && '+'}{change?.toFixed(2)}%</span>
        </div>
      </div>

      <div className="text-2xl font-bold text-white mb-3">
        ${typeof price === 'number' ? price.toFixed(6) : price}
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onDownload}
          className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
        >
          <Download size={14} />
          Download
        </button>
        <button 
          onClick={onSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
        >
          <Pin size={14} />
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * Performance Card - Shows P&L and metrics
 */
export function PerformanceCard({ data, onSave, onDownload }) {
  const { token, period, pnl, pnlPercent, volume, trades } = data;
  const isPositive = pnl >= 0;

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className="text-primary-400" />
          <span className="text-white font-medium">{token} Performance</span>
        </div>
        <span className="text-dark-400 text-sm">{period}</span>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div>
          <div className="text-dark-400 text-xs mb-1">P&L</div>
          <div className={`text-xl font-bold ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive && '+'}${Math.abs(pnl).toLocaleString()}
          </div>
          <div className={`text-xs ${isPositive ? 'text-green-400' : 'text-red-400'}`}>
            {isPositive && '+'}{pnlPercent?.toFixed(2)}%
          </div>
        </div>
        <div>
          <div className="text-dark-400 text-xs mb-1">Volume</div>
          <div className="text-xl font-bold text-white">${volume?.toLocaleString()}</div>
          <div className="text-xs text-dark-400">{trades} trades</div>
        </div>
      </div>

      <div className="flex gap-2">
        <button 
          onClick={onDownload}
          className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
        >
          <Download size={14} />
          Download Report
        </button>
        <button 
          onClick={onSave}
          className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
        >
          <Pin size={14} />
          Save
        </button>
      </div>
    </div>
  );
}

/**
 * Bot Status Card - Shows bot status with controls
 */
export function BotCard({ data, onStart, onStop, onAdjust }) {
  const { name, pair, exchange, status, spread, volume24h, pnl } = data;
  const isRunning = status === 'running';

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="flex items-center justify-between mb-3">
        <div>
          <div className="text-white font-medium">{name}</div>
          <div className="text-dark-400 text-xs">{pair} • {exchange}</div>
        </div>
        <div className={`px-2 py-1 rounded-full text-xs ${
          isRunning 
            ? 'bg-green-500/20 text-green-400' 
            : 'bg-yellow-500/20 text-yellow-400'
        }`}>
          {status}
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-4 text-sm">
        <div>
          <div className="text-dark-400 text-xs">Spread</div>
          <div className="text-white">±{spread}%</div>
        </div>
        <div>
          <div className="text-dark-400 text-xs">Volume (24h)</div>
          <div className="text-white">${volume24h?.toLocaleString()}</div>
        </div>
        <div>
          <div className="text-dark-400 text-xs">P&L</div>
          <div className={pnl >= 0 ? 'text-green-400' : 'text-red-400'}>
            {pnl >= 0 && '+'}${pnl?.toLocaleString()}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {isRunning ? (
          <button 
            onClick={onStop}
            className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600/20 hover:bg-yellow-600/30 text-yellow-400 rounded-lg text-sm transition-colors"
          >
            <Pause size={14} />
            Pause
          </button>
        ) : (
          <button 
            onClick={onStart}
            className="flex items-center gap-1 px-3 py-1.5 bg-green-600/20 hover:bg-green-600/30 text-green-400 rounded-lg text-sm transition-colors"
          >
            <Play size={14} />
            Start
          </button>
        )}
        <button 
          onClick={onAdjust}
          className="flex items-center gap-1 px-3 py-1.5 bg-dark-700 hover:bg-dark-600 rounded-lg text-sm text-dark-200 transition-colors"
        >
          <Settings size={14} />
          Adjust
        </button>
      </div>
    </div>
  );
}

/**
 * Table Card - Shows data in table format
 */
export function TableCard({ title, columns, rows, onDownload }) {
  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-dark-700">
        <span className="text-white font-medium">{title}</span>
        {onDownload && (
          <button 
            onClick={onDownload}
            className="flex items-center gap-1 text-sm text-primary-400 hover:text-primary-300"
          >
            <Download size={14} />
            Export
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-dark-700/50">
              {columns.map((col, i) => (
                <th key={i} className="px-4 py-2 text-left text-xs font-medium text-dark-400">
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, i) => (
              <tr key={i} className="border-t border-dark-700/50 hover:bg-dark-700/30">
                {row.map((cell, j) => (
                  <td key={j} className="px-4 py-2 text-sm text-dark-200">
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/**
 * Action Confirmation Card
 */
export function ActionCard({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel, type = 'info' }) {
  const colors = {
    info: 'bg-primary-600 hover:bg-primary-700',
    danger: 'bg-red-600 hover:bg-red-700',
    success: 'bg-green-600 hover:bg-green-700',
    warning: 'bg-yellow-600 hover:bg-yellow-700'
  };

  return (
    <div className="bg-dark-800 rounded-xl p-4 border border-dark-700">
      <div className="text-white font-medium mb-2">{title}</div>
      <div className="text-dark-300 text-sm mb-4">{description}</div>
      <div className="flex gap-2">
        <button 
          onClick={onConfirm}
          className={`px-4 py-2 rounded-lg text-white text-sm transition-colors ${colors[type]}`}
        >
          {confirmLabel || 'Confirm'}
        </button>
        {onCancel && (
          <button 
            onClick={onCancel}
            className="px-4 py-2 bg-dark-700 hover:bg-dark-600 rounded-lg text-dark-200 text-sm transition-colors"
          >
            {cancelLabel || 'Cancel'}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Code/Text Card - For displaying formatted text or code
 */
export function TextCard({ content, copyable = true }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-dark-800 rounded-xl border border-dark-700 overflow-hidden">
      {copyable && (
        <div className="flex justify-end px-3 py-2 border-b border-dark-700">
          <button 
            onClick={handleCopy}
            className="flex items-center gap-1 text-xs text-dark-400 hover:text-dark-200"
          >
            {copied ? <Check size={12} /> : <Copy size={12} />}
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      )}
      <pre className="p-4 text-sm text-dark-200 overflow-x-auto whitespace-pre-wrap">
        {content}
      </pre>
    </div>
  );
}
