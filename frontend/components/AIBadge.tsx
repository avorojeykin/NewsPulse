'use client';

import { TrendingUp, TrendingDown, Minus, AlertTriangle, Flame, Zap, MessageSquare, Sparkles } from 'lucide-react';

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

  // Sentiment badge configuration with vibrant colors
  const sentimentConfig = {
    bullish: {
      icon: TrendingUp,
      text: 'Bullish',
      bg: 'bg-gradient-to-r from-green-500/20 to-emerald-500/20',
      border: 'border-green-400',
      textColor: 'text-green-300',
      iconColor: 'text-green-400',
      glow: 'shadow-lg shadow-green-500/20',
    },
    bearish: {
      icon: TrendingDown,
      text: 'Bearish',
      bg: 'bg-gradient-to-r from-red-500/20 to-rose-500/20',
      border: 'border-red-400',
      textColor: 'text-red-300',
      iconColor: 'text-red-400',
      glow: 'shadow-lg shadow-red-500/20',
    },
    neutral: {
      icon: Minus,
      text: 'Neutral',
      bg: 'bg-gradient-to-r from-yellow-500/20 to-amber-500/20',
      border: 'border-yellow-400',
      textColor: 'text-yellow-300',
      iconColor: 'text-yellow-400',
      glow: 'shadow-lg shadow-yellow-500/20',
    },
  };

  // Impact badge configuration with vibrant colors
  const impactConfig = {
    critical: {
      icon: AlertTriangle,
      text: 'Critical',
      bg: 'bg-gradient-to-r from-red-600/20 to-orange-600/20',
      border: 'border-red-500',
      textColor: 'text-red-300',
      iconColor: 'text-red-400',
      glow: 'shadow-lg shadow-red-600/30',
    },
    high: {
      icon: Flame,
      text: 'High Impact',
      bg: 'bg-gradient-to-r from-orange-500/20 to-amber-500/20',
      border: 'border-orange-400',
      textColor: 'text-orange-300',
      iconColor: 'text-orange-400',
      glow: 'shadow-lg shadow-orange-500/30',
    },
    medium: {
      icon: Zap,
      text: 'Medium',
      bg: 'bg-gradient-to-r from-blue-500/20 to-cyan-500/20',
      border: 'border-blue-400',
      textColor: 'text-blue-300',
      iconColor: 'text-blue-400',
      glow: 'shadow-lg shadow-blue-500/20',
    },
    low: {
      icon: MessageSquare,
      text: 'Low',
      bg: 'bg-gradient-to-r from-slate-500/20 to-gray-500/20',
      border: 'border-slate-400',
      textColor: 'text-slate-300',
      iconColor: 'text-slate-400',
      glow: 'shadow-lg shadow-slate-500/10',
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
      {/* AI Powered Badge - Prominent branding */}
      <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 via-pink-500/20 to-purple-500/20 border-2 border-purple-400/50 shadow-lg shadow-purple-500/30">
        <Sparkles className="w-3.5 h-3.5 text-purple-300 animate-pulse" />
        <span className="text-xs font-bold text-purple-300">
          AI POWERED
        </span>
      </div>

      {/* Sentiment Badge */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all
          ${sentimentStyle.bg} ${sentimentStyle.border} ${sentimentStyle.glow}
          ${isClickable ? 'cursor-pointer hover:scale-105 hover:brightness-110' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? 'Click for full AI analysis' : 'Pro tier required for full analysis'}
      >
        <SentimentIcon className={`w-4 h-4 ${sentimentStyle.iconColor}`} />
        <div className="flex flex-col">
          <span className={`text-xs font-bold leading-tight ${sentimentStyle.textColor}`}>
            {sentimentStyle.text}
          </span>
          <span className={`text-[10px] font-semibold leading-tight ${sentimentStyle.textColor} opacity-80`}>
            {confidencePercentage}% confidence
          </span>
        </div>
      </div>

      {/* Impact Badge */}
      <div
        className={`
          flex items-center gap-2 px-3 py-1.5 rounded-lg border-2 transition-all
          ${impactStyle.bg} ${impactStyle.border} ${impactStyle.glow}
          ${isClickable ? 'cursor-pointer hover:scale-105 hover:brightness-110' : ''}
        `}
        onClick={isClickable ? onClick : undefined}
        title={isClickable ? 'Click for full AI analysis' : 'Pro tier required for full analysis'}
      >
        <ImpactIcon className={`w-4 h-4 ${impactStyle.iconColor}`} />
        <span className={`text-xs font-bold ${impactStyle.textColor}`}>
          {impactStyle.text}
        </span>
      </div>

      {/* Premium tier CTA - subtle hint to upgrade */}
      {userTier === 'premium' && (
        <div className="text-[10px] text-slate-500 font-medium italic">
          Upgrade to Pro for detailed analysis
        </div>
      )}
    </div>
  );
}
