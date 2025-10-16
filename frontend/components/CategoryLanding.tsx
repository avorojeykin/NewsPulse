'use client';

import { useState, useEffect } from 'react';
import CategoryCard from './CategoryCard';
import NewsFeeds from './NewsFeeds';
import { categories, type CategoryId } from '@/lib/theme';
import { ArrowLeft } from 'lucide-react';
import { useIframeSdk } from '@whop/react';

interface CategoryLandingProps {
  userId?: string;
}

export default function CategoryLanding({ userId }: CategoryLandingProps) {
  const iframeSdk = useIframeSdk();
  const [selectedCategory, setSelectedCategory] = useState<CategoryId | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [checkingTier, setCheckingTier] = useState(true);

  // Check premium status when userId is available
  useEffect(() => {
    const checkTier = async () => {
      if (!userId) {
        console.warn('No user ID available, defaulting to free tier');
        setIsPremium(false);
        setCheckingTier(false);
        return;
      }

      try {
        const response = await fetch(`/api/tier/${userId}`);
        if (!response.ok) {
          console.error('Failed to check tier, defaulting to free');
          setIsPremium(false);
          setCheckingTier(false);
          return;
        }

        const data = await response.json();
        setIsPremium(data.isPremium);
        console.log(`✅ User tier: ${data.tier.toUpperCase()} (${data.deliveryDelayMinutes}min delay)`);
      } catch (error) {
        console.error('Error checking tier:', error);
        setIsPremium(false);
      } finally {
        setCheckingTier(false);
      }
    };

    checkTier();
  }, [userId]);

  const handleUpgrade = async () => {
    if (!iframeSdk) {
      setPurchaseError('Please wait for the app to load');
      return;
    }

    try {
      setPurchaseError(null);
      const result = await iframeSdk.inAppPurchase({
        planId: 'plan_nox6lp5V6fd2A',
      });

      if (result.status === 'ok') {
        alert('🎉 Welcome to Premium! You now have real-time news access.');
        window.location.reload();
      } else {
        setPurchaseError(result.error || 'Purchase cancelled');
      }
    } catch (err) {
      setPurchaseError('Failed to initiate purchase');
      console.error('Purchase error:', err);
    }
  };

  // Show news feed if category is selected (only for available categories)
  if (selectedCategory && !categories[selectedCategory].comingSoon && selectedCategory !== 'xMentions') {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#0a0e1a' }}>
        <div className="max-w-7xl mx-auto px-4 py-8">
          {/* Back button */}
          <button
            onClick={() => setSelectedCategory(null)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-300 hover:text-white transition-all duration-300 mb-6 group hover:bg-slate-800/50 border-2 border-transparent hover:border-slate-700"
          >
            <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-2 group-hover:scale-110" />
            <span className="font-semibold">Back to Categories</span>
          </button>

          {/* Pass the selected category and userId to NewsFeeds */}
          <NewsFeeds initialCategory={selectedCategory as 'crypto' | 'stocks' | 'sports'} userId={userId} />
        </div>
      </div>
    );
  }

  // Show category selection landing page
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0a0e1a' }}>
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Hero Section - Redesigned */}
        <div className="text-center mb-16">
          {/* Live Status Badge */}
          <div className="inline-block mb-8">
            <div className="flex items-center gap-3 px-6 py-3 rounded-full bg-gradient-to-r from-orange-500/10 to-purple-500/10 border-2 border-slate-700 shadow-lg">
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-green-400 animate-ping opacity-75" />
              </div>
              <span className="text-sm font-bold text-slate-200 tracking-wide">LIVE NEWS UPDATES</span>
            </div>
          </div>

          {/* Logo and Title */}
          <div className="flex flex-col items-center gap-6 mb-8">
            <div className="relative group">
              {/* Glow effect behind logo */}
              <div className="absolute inset-0 bg-gradient-to-r from-orange-500/20 via-purple-500/20 to-pink-500/20 blur-3xl opacity-60 group-hover:opacity-100 transition-opacity duration-500" />

              {/* Logo */}
              <img
                src="/logo.png"
                alt="NewsPulse Logo"
                className="relative w-48 h-48 object-contain drop-shadow-2xl transition-transform duration-300 group-hover:scale-105"
              />
            </div>

            <div>
              <h1 className="text-7xl font-black leading-tight tracking-wide"
                style={{
                  fontFamily: '"Orbitron", "Exo 2", "Rajdhani", system-ui, sans-serif',
                  fontWeight: 900,
                  background: 'linear-gradient(135deg, #f59e0b 0%, #ec4899 50%, #8b5cf6 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  backgroundClip: 'text',
                  textShadow: 'none',
                  filter: 'drop-shadow(0 0 30px rgba(245, 158, 11, 0.5)) drop-shadow(0 0 60px rgba(139, 92, 246, 0.3))',
                }}>
                NewsPulse
              </h1>
            </div>
          </div>

          {/* Tagline */}
          <p className="text-xl text-slate-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Your premium source for breaking news in{' '}
            <span className="font-bold text-orange-400">Crypto</span>,{' '}
            <span className="font-bold text-green-400">Stocks</span>, and{' '}
            <span className="font-bold text-blue-400">Sports Betting</span>
          </p>

          {/* Stats Boxes - Redesigned */}
          <div className="flex flex-wrap items-center justify-center gap-4 max-w-4xl mx-auto">
            {/* 36 Premium Sources */}
            <div className="group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl min-w-[220px]"
              style={{
                backgroundColor: 'rgba(245, 158, 11, 0.05)',
                borderColor: 'rgba(245, 158, 11, 0.3)',
              }}>
              <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="text-5xl font-extrabold text-orange-400 mb-2">36</div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wide">Premium Sources</div>
                <div className="text-xs text-slate-500 mt-1">12 per Category</div>
              </div>
            </div>

            {/* Real-time Updates */}
            <div className="group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl min-w-[220px] text-center"
              style={{
                backgroundColor: 'rgba(16, 185, 129, 0.05)',
                borderColor: 'rgba(16, 185, 129, 0.3)',
              }}>
              <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="flex items-center justify-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse" />
                  <div className="text-2xl font-extrabold text-green-400">LIVE</div>
                </div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wide">Real-time Updates</div>
                <div className="text-xs text-slate-500 mt-1">60-Second Refresh</div>
              </div>
            </div>

            {/* AI-Powered Analysis */}
            <div className="group relative overflow-hidden rounded-2xl p-6 border-2 transition-all duration-300 hover:scale-105 hover:shadow-2xl min-w-[220px]"
              style={{
                backgroundColor: 'rgba(139, 92, 246, 0.05)',
                borderColor: 'rgba(139, 92, 246, 0.3)',
              }}>
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="relative z-10">
                <div className="text-5xl mb-2">🤖</div>
                <div className="text-sm font-bold text-slate-300 uppercase tracking-wide">AI-Powered</div>
                <div className="flex items-center justify-center gap-2 mt-1">
                  <div className="px-2 py-0.5 rounded-full bg-purple-500/20 border border-purple-500/30">
                    <span className="text-xs font-bold text-purple-400">ACTIVE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Category Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {Object.keys(categories).map((key) => (
            <CategoryCard
              key={key}
              categoryId={key as CategoryId}
              onClick={() => setSelectedCategory(key as CategoryId)}
            />
          ))}
        </div>

        {/* Tier Info */}
        {!checkingTier && (
          <div>
            {isPremium ? (
              // Premium Member Badge
              <div className="rounded-2xl p-6 border-2 border-yellow-500/30 bg-gradient-to-br from-yellow-500/10 to-orange-500/10">
                <div className="text-center space-y-2">
                  <div className="inline-block px-6 py-3 rounded-xl border-2 border-yellow-500/50 bg-yellow-500/20">
                    <div className="flex items-center gap-2 text-lg font-bold text-yellow-400">
                      <span>👑</span>
                      <span>Premium Member</span>
                    </div>
                    <div className="text-sm text-slate-300 mt-1">
                      Real-time news • Zero delay
                    </div>
                  </div>
                  <div className="text-sm font-semibold text-green-400 flex items-center justify-center gap-2">
                    <span>✨</span>
                    <span>Instant updates enabled</span>
                  </div>
                </div>
              </div>
            ) : (
              // Free Tier with Upgrade Button
              <div className="bg-gradient-to-br from-slate-800/50 to-slate-900/50 border border-slate-700 rounded-2xl p-8 text-center">
                <p className="text-sm font-semibold text-slate-300 mb-2">
                  ⏱️ Free Tier Active
                </p>
                <p className="text-slate-400 text-sm mb-4">
                  News delivered with 15-minute delay
                </p>
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-400 hover:to-purple-400 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 border-2 border-white/20 cursor-pointer"
                >
                  ✨ Upgrade to Premium ($4.99/mo) for Real-Time ⚡
                </button>
                {purchaseError && (
                  <p className="text-center text-red-400 text-sm mt-2">
                    {purchaseError}
                  </p>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
