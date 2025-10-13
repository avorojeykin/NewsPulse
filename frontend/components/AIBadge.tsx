'use client';

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Flame, Zap, MessageSquare } from 'lucide-react';

interface AIBadgeProps {
  sentiment?: {
    label: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
  };
  priceImpact?: {
    level: 'critical' | 'high' | 'medium' | 'low';
  };
  userTier: 'free' | 'premium' | 'pro';
  onClick?: () => void;
}

export default function AIBadge({ sentiment, priceImpact, userTier, onClick }: AIBadgeProps) {
  // Free tier: No badges shown
  if (userTier === 'free') return null;

  // If no AI data yet (still processing)
  if (!sentiment || !priceImpact) return null;

  // Sentiment badge configuration
  const sentimentConfig = {
    bullish: {
      icon: TrendingUp,
      text: 'Bullish',
      bg: 'bg-green-500/10',
      border: 'border-green-500/30',
      textColor: 'text-green-400',
      iconColor: 'text-green-500',
    },
    bearish: {
      icon: TrendingDown,
      text: 'Bearish',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      textColor: 'text-red-400',
      iconColor: 'text-red-500',
    },
    neutral: {
      icon: Minus,
      text: 'Neutral',
      bg: 'bg-yellow-500/10',
      border: 'border-yellow-500/30',
      textColor: 'text-yellow-400',
      iconColor: 'text-yellow-500',
    },
  };

  // Impact badge configuration
  const impactConfig = {
    critical: {
      icon: AlertTriangle,
      text: 'Critical',
      bg: 'bg-red-500/10',
      border: 'border-red-500/30',
      textColor: 'text-red-400',
      iconColor: 'text-red-500',
    },
    high: {
      icon: Flame,
      text: 'High Impact',
      bg: 'bg-orange-500/10',
      border: 'border-orange-500/30',
      textColor: 'text-orange-400',
      iconColor: 'text-orange-500',
    },
    medium: {
      icon: Zap,
      text: 'Medium',
      bg: 'bg-blue-500/10',
      border: 'border-blue-500/30',
      textColor: 'text-blue-400',
      iconColor: 'text-blue-500',
    },
    low: {
      icon: MessageSquare,
      text: 'Low',
      bg: 'bg-slate-500/10',
      border: 'border-slate-500/30',
      textColor: 'text-slate-400',
      iconColor: 'text-slate-500',
    },
  };

  const sentimentStyle = sentimentConfig[sentiment.label];
  const impactStyle = impactConfig[priceImpact.level];

  const SentimentIcon = sentimentStyle.icon;
  const ImpactIcon = impactStyle.icon;

  const confidencePercentage = Math.round(sentiment.confidence * 100);

  // Premium tier: See badges but can't click
  // Pro tier: Can click for full AI Dashboard
  const isClickable = userTier === 'pro' && onClick;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      {/* Sentiment Badge */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all
          ${sentimentStyle.bg} ${sentimentStyle.border}
          ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? 'Click for full AI analysis' : 'Pro tier required for full analysis'}
      >
        <SentimentIcon className={`w-4 h-4 ${sentimentStyle.iconColor}`} />
        <span className={`text-xs font-bold ${sentimentStyle.textColor}`}>
          {sentimentStyle.text} {confidencePercentage}%
        </span>
      </div>

      {/* Impact Badge */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all
          ${impactStyle.bg} ${impactStyle.border}
          ${isClickable ? 'cursor-pointer hover:scale-105 hover:shadow-lg' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? 'Click for full AI analysis' : 'Pro tier required for full analysis'}
      >
        <ImpactIcon className={`w-4 h-4 ${impactStyle.iconColor}`} />
        <span className={`text-xs font-bold ${impactStyle.textColor}`}>
          {impactStyle.text}
        </span>
      </div>

      {/* AI Badge for Pro users */}
      {userTier === 'pro' && (
        <div className="px-2 py-1 rounded bg-purple-500/20 border border-purple-500/30">
          <span className="text-purple-400 text-[10px] font-bold uppercase tracking-wider">AI</span>
        </div>
      )}

      {/* Premium tier CTA - subtle hint to upgrade */}
      {userTier === 'premium' && (
        <div className="text-[10px] text-slate-500 font-medium">
          Upgrade to Pro for full AI analysis
        </div>
      )}
    </div>
  );
}
