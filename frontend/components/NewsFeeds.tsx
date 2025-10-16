'use client';

import { useEffect, useState } from 'react';
import { ExternalLink, Clock, Sparkles } from 'lucide-react';
import { useIframeSdk } from '@whop/react';
import { categories, theme } from '@/lib/theme';
import TickerSearch from './TickerSearch';
import AIBadge from './AIBadge';

interface NewsItem {
  id: number;
  source: string;
  vertical: 'crypto' | 'stocks' | 'sports';
  ticker?: string;
  title: string;
  content: string;
  url: string;
  published_at: string;
  fetched_at: string;
  ai_processed?: boolean;
  ai_sentiment?: {
    label: 'bullish' | 'bearish' | 'neutral' | 'favorable' | 'unfavorable';
    confidence: number;
    reasoning: string;
  };
  ai_price_impact?: {
    level: 'critical' | 'high' | 'medium' | 'low';
    direction: 'up' | 'down' | 'uncertain';
    reasoning: string;
  };
  ai_summary?: {
    tldr: string;
    key_points: string[];
    entities: string[];
  };
  ai_processed_at?: string;
}

type Vertical = 'crypto' | 'stocks' | 'sports';

interface NewsFeedsProps {
  initialCategory?: Vertical;
  userId?: string;
}

export default function NewsFeeds({ initialCategory = 'crypto', userId }: NewsFeedsProps) {
  const iframeSdk = useIframeSdk();
  const [activeTab, setActiveTab] = useState<Vertical>(initialCategory);
  const [selectedTicker, setSelectedTicker] = useState<string | null>(null);
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);
  const [isPremium, setIsPremium] = useState<boolean>(false);
  const [userTier, setUserTier] = useState<'free' | 'premium' | 'pro'>('free');
  const [checkingTier, setCheckingTier] = useState(true);
  const [analyzingArticles, setAnalyzingArticles] = useState<Set<number>>(new Set());
  const [analysisProgress, setAnalysisProgress] = useState<Map<number, string>>(new Map());

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
        setIsPremium(data.isPremium || data.tier === 'pro');
        setUserTier(data.tier);
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

  useEffect(() => {
    fetchNews(activeTab, selectedTicker);
  }, [activeTab, selectedTicker, userId]);

  const fetchNews = async (vertical: Vertical, ticker: string | null = null) => {
    setLoading(true);
    setError(null);
    try {
      const tickerParam = ticker ? `&ticker=${ticker}` : '';
      const userParam = userId ? `&userId=${userId}` : '';
      console.log(`🔵 [FRONTEND] Fetching news from Next.js proxy: /api/news/${vertical}`);
      const response = await fetch(`/api/news/${vertical}?limit=20${tickerParam}${userParam}`);
      if (!response.ok) throw new Error('Failed to fetch news');
      const data = await response.json();
      setNews(data.news);
    } catch (err) {
      setError('The system is currently undergoing maintenance. We will be back shortly.');
      console.error('Error fetching news:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTickerSelect = (ticker: string | null) => {
    setSelectedTicker(ticker);
  };

  const handleGenerateAI = async (articleId: number) => {
    console.log(`\n🔵 [FRONTEND] handleGenerateAI called for article ${articleId}`);
    console.log(`🔵 [FRONTEND] Current window.location:`, window.location.href);

    try {
      // Mark as analyzing
      console.log(`🔵 [FRONTEND] Setting analyzingArticles state...`);
      setAnalyzingArticles((prev) => new Set(prev).add(articleId));
      setAnalysisProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(articleId, 'Sending request...');
        return newMap;
      });
      console.log(`✅ [FRONTEND] State updated`);

      const apiUrl = `/api/analyze/${articleId}`;
      console.log(`🔵 [FRONTEND] Constructed API URL (Next.js proxy): ${apiUrl}`);
      console.log(`🔵 [FRONTEND] Sending POST request to Next.js proxy...`);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      console.log(`🔵 [FRONTEND] Response received`);
      console.log(`📊 [FRONTEND] Response status: ${response.status} ${response.statusText}`);
      console.log(`📊 [FRONTEND] Response headers:`, Object.fromEntries(response.headers.entries()));

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ [FRONTEND] AI analysis request failed: ${response.status} - ${errorText}`);
        throw new Error('Failed to request AI analysis');
      }

      console.log(`🔵 [FRONTEND] Parsing JSON response...`);
      const data = await response.json();
      console.log(`✅ [FRONTEND] AI analysis response:`, data);

      if (data.status === 'processing') {
        setAnalysisProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(articleId, 'AI analyzing...');
          return newMap;
        });

        // Poll for completion with progressive feedback
        let attempts = 0;
        const maxAttempts = 15; // 15 attempts × 2 seconds = 30 seconds max
        const pollInterval = 2000; // Check every 2 seconds

        const pollForCompletion = async () => {
          attempts++;

          // Update progress message
          if (attempts <= 3) {
            setAnalysisProgress((prev) => {
              const newMap = new Map(prev);
              newMap.set(articleId, 'Analyzing sentiment...');
              return newMap;
            });
          } else if (attempts <= 6) {
            setAnalysisProgress((prev) => {
              const newMap = new Map(prev);
              newMap.set(articleId, 'Evaluating impact...');
              return newMap;
            });
          } else {
            setAnalysisProgress((prev) => {
              const newMap = new Map(prev);
              newMap.set(articleId, 'Finalizing analysis...');
              return newMap;
            });
          }

          // Fetch updated news to check if analysis is complete
          try {
            const tickerParam = selectedTicker ? `&ticker=${selectedTicker}` : '';
            const userParam = userId ? `&userId=${userId}` : '';
            const checkResponse = await fetch(`/api/news/${activeTab}?limit=20${tickerParam}${userParam}`);

            if (checkResponse.ok) {
              const checkData = await checkResponse.json();
              const updatedArticle = checkData.news.find((n: NewsItem) => n.id === articleId);

              if (updatedArticle?.ai_processed) {
                // Success! Analysis complete
                console.log(`✅ AI analysis complete for article ${articleId}`);
                setAnalysisProgress((prev) => {
                  const newMap = new Map(prev);
                  newMap.set(articleId, '✓ Analysis complete!');
                  return newMap;
                });

                // Update the news list
                setNews(checkData.news);

                // Clean up after showing success message briefly
                setTimeout(() => {
                  setAnalyzingArticles((prev) => {
                    const newSet = new Set(prev);
                    newSet.delete(articleId);
                    return newSet;
                  });
                  setAnalysisProgress((prev) => {
                    const newMap = new Map(prev);
                    newMap.delete(articleId);
                    return newMap;
                  });
                }, 1500);

                return; // Stop polling
              }
            }
          } catch (pollError) {
            console.error('Polling error:', pollError);
          }

          // Continue polling if not complete and haven't exceeded max attempts
          if (attempts < maxAttempts) {
            setTimeout(pollForCompletion, pollInterval);
          } else {
            // Timeout after max attempts
            console.warn(`⏱️ AI analysis timeout for article ${articleId} after ${maxAttempts} attempts`);
            setAnalysisProgress((prev) => {
              const newMap = new Map(prev);
              newMap.set(articleId, '⚠️ Taking longer than expected...');
              return newMap;
            });

            // Clean up after timeout
            setTimeout(() => {
              setAnalyzingArticles((prev) => {
                const newSet = new Set(prev);
                newSet.delete(articleId);
                return newSet;
              });
              setAnalysisProgress((prev) => {
                const newMap = new Map(prev);
                newMap.delete(articleId);
                return newMap;
              });
              // Force refresh to see if it completed
              fetchNews(activeTab, selectedTicker);
            }, 2000);
          }
        };

        // Start polling after initial delay
        setTimeout(pollForCompletion, pollInterval);

      } else if (data.status === 'already_processed') {
        // Article already has analysis, just refresh
        console.log(`ℹ️ Article ${articleId} already has AI analysis`);
        setAnalysisProgress((prev) => {
          const newMap = new Map(prev);
          newMap.set(articleId, '✓ Already analyzed!');
          return newMap;
        });

        fetchNews(activeTab, selectedTicker);

        setTimeout(() => {
          setAnalyzingArticles((prev) => {
            const newSet = new Set(prev);
            newSet.delete(articleId);
            return newSet;
          });
          setAnalysisProgress((prev) => {
            const newMap = new Map(prev);
            newMap.delete(articleId);
            return newMap;
          });
        }, 1500);
      }
    } catch (error) {
      console.error('Error generating AI analysis:', error);
      setAnalysisProgress((prev) => {
        const newMap = new Map(prev);
        newMap.set(articleId, '❌ Failed - Try again');
        return newMap;
      });

      // Clean up error state after showing message
      setTimeout(() => {
        setAnalyzingArticles((prev) => {
          const newSet = new Set(prev);
          newSet.delete(articleId);
          return newSet;
        });
        setAnalysisProgress((prev) => {
          const newMap = new Map(prev);
          newMap.delete(articleId);
          return newMap;
        });
      }, 3000);
    }
  };

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

  const getTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return 'just now';
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  const currentCategory = categories[activeTab];
  const categoryTheme = currentCategory.theme;

  return (
    <div className="w-full max-w-7xl mx-auto">
      {/* Header with category info */}
      <div className="mb-8">
        <div className="flex items-center gap-4 mb-6">
          <span className="text-6xl">{currentCategory.emoji}</span>
          <div>
            <h2 className="text-4xl font-bold text-white mb-2">{currentCategory.title}</h2>
            <p className="text-slate-300 text-lg">{currentCategory.description}</p>
          </div>
        </div>

        {/* Tab Navigation - Redesigned */}
        <div className="flex gap-3 p-1.5 rounded-2xl" style={{ backgroundColor: theme.colors.background.secondary }}>
          {(['crypto', 'stocks', 'sports'] as Vertical[]).map((vertical) => {
            const cat = categories[vertical];
            const isActive = activeTab === vertical;
            return (
              <button
                key={vertical}
                onClick={() => setActiveTab(vertical)}
                className={`
                  flex-1 py-4 px-6 rounded-xl font-bold capitalize transition-all duration-300
                  ${isActive
                    ? 'shadow-lg transform scale-[1.02]'
                    : 'hover:scale-105 hover:shadow-xl hover:-translate-y-0.5'
                  }
                `}
                style={{
                  backgroundColor: isActive ? cat.theme.glow : 'transparent',
                  color: isActive ? cat.theme.primary : theme.colors.text.tertiary,
                  borderWidth: isActive ? '2px' : '2px',
                  borderColor: isActive ? cat.theme.border : 'transparent',
                  filter: isActive ? 'none' : undefined,
                }}
                onMouseEnter={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = cat.theme.glow;
                    e.currentTarget.style.borderColor = cat.theme.border;
                    e.currentTarget.style.color = cat.theme.secondary;
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActive) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.borderColor = 'transparent';
                    e.currentTarget.style.color = theme.colors.text.tertiary;
                  }
                }}
              >
                <span className="mr-2 text-xl">{cat.emoji}</span>
                <span className="text-base">{cat.name}</span>
              </button>
            );
          })}
        </div>

        {/* Ticker Search - Only show for stocks category */}
        {activeTab === 'stocks' && (
          <div className="mb-6">
            <TickerSearch onTickerSelect={handleTickerSelect} selectedTicker={selectedTicker} />
          </div>
        )}
      </div>

      {/* News Feed - Redesigned */}
      <div className="space-y-4">
        {loading && (
          <div className="text-center py-20">
            <div className="relative w-16 h-16 mx-auto mb-6">
              <div
                className="absolute inset-0 rounded-full animate-ping"
                style={{ backgroundColor: categoryTheme.primary, opacity: 0.2 }}
              />
              <div
                className="absolute inset-0 rounded-full animate-spin border-4 border-transparent"
                style={{ borderTopColor: categoryTheme.primary }}
              />
            </div>
            <p className="text-slate-300 font-medium">Loading {activeTab} news...</p>
          </div>
        )}

        {error && (
          <div className="bg-orange-500/10 border-2 border-orange-500/30 rounded-2xl p-8 text-center backdrop-blur-sm">
            <div className="text-5xl mb-4">🔧</div>
            <p className="text-orange-400 font-bold text-lg mb-2">System Maintenance</p>
            <p className="text-sm text-slate-300">
              The system is currently undergoing maintenance. We will be back shortly.
            </p>
            <p className="text-xs text-slate-400 mt-2">
              Thank you for your patience! 🙏
            </p>
          </div>
        )}

        {!loading && !error && news.length === 0 && (
          <div
            className="rounded-2xl p-12 text-center border-2"
            style={{
              backgroundColor: categoryTheme.glow,
              borderColor: categoryTheme.border,
            }}
          >
            <span className="text-7xl mb-6 block">{currentCategory.emoji}</span>
            <p className="font-bold text-xl mb-2" style={{ color: categoryTheme.primary }}>
              No news yet
            </p>
            <p className="text-slate-300">
              The RSS worker is fetching news. Check back in a minute!
            </p>
          </div>
        )}

        {!loading && !error && news.length > 0 && (
          <>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5" style={{ color: categoryTheme.primary }} />
                <p className="text-slate-300 font-medium">
                  {news.length} latest updates
                </p>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <Clock className="w-4 h-4" />
                <span>Updated moments ago</span>
              </div>
            </div>

            <div className="grid gap-4">
              {news.map((item, index) => (
                <article
                  key={item.id}
                  className="group relative overflow-hidden rounded-2xl p-6 transition-all duration-300 hover:scale-[1.01] hover:shadow-2xl cursor-pointer border-2"
                  style={{
                    backgroundColor: theme.colors.background.secondary,
                    borderColor: categoryTheme.border,
                  }}
                  onClick={() => window.open(item.url, '_blank')}
                >
                  {/* Hover glow effect */}
                  <div
                    className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    style={{
                      background: `radial-gradient(circle at top left, ${categoryTheme.glow}, transparent 70%)`,
                    }}
                  />

                  {/* Content */}
                  <div className="relative z-10">
                    {/* Source and time */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider"
                          style={{
                            backgroundColor: categoryTheme.glow,
                            color: categoryTheme.primary,
                          }}
                        >
                          {item.source}
                        </div>
                        {index < 3 && (
                          <div className="px-2 py-1 rounded bg-red-500/20 border border-red-500/30">
                            <span className="text-red-400 text-xs font-bold">HOT</span>
                          </div>
                        )}
                      </div>
                      <span className="text-sm text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {getTimeAgo(item.published_at)}
                      </span>
                    </div>

                    {/* Title */}
                    <h3 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-opacity-90 transition-all">
                      {item.title}
                    </h3>

                    {/* AI Badges */}
                    {item.ai_processed && (
                      <div className="mb-3">
                        <AIBadge
                          sentiment={item.ai_sentiment}
                          priceImpact={item.ai_price_impact}
                          userTier={userTier}
                        />
                      </div>
                    )}

                    {/* Generate AI Analysis Button (if not processed) */}
                    {!item.ai_processed && (
                      <div className="mb-3">
                        <button
                          onClick={(e) => {
                            console.log(`🔵 [FRONTEND] Button clicked for article ${item.id}`);
                            console.log(`🔵 [FRONTEND] Event:`, e.type);
                            e.stopPropagation();
                            console.log(`🔵 [FRONTEND] Calling handleGenerateAI...`);
                            handleGenerateAI(item.id);
                          }}
                          disabled={analyzingArticles.has(item.id)}
                          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg font-semibold text-sm transition-all duration-300 disabled:cursor-not-allowed"
                          style={{
                            backgroundColor: categoryTheme.glow,
                            color: categoryTheme.primary,
                            borderWidth: '2px',
                            borderColor: categoryTheme.border,
                            opacity: analyzingArticles.has(item.id) ? 0.9 : 1,
                          }}
                          onMouseEnter={(e) => {
                            if (!analyzingArticles.has(item.id)) {
                              e.currentTarget.style.backgroundColor = categoryTheme.primary;
                              e.currentTarget.style.color = theme.colors.background.primary;
                            }
                          }}
                          onMouseLeave={(e) => {
                            if (!analyzingArticles.has(item.id)) {
                              e.currentTarget.style.backgroundColor = categoryTheme.glow;
                              e.currentTarget.style.color = categoryTheme.primary;
                            }
                          }}
                        >
                          {analyzingArticles.has(item.id) ? (
                            <>
                              <div
                                className="w-4 h-4 border-2 border-transparent rounded-full animate-spin"
                                style={{ borderTopColor: categoryTheme.primary }}
                              />
                              <span>{analysisProgress.get(item.id) || 'Analyzing...'}</span>
                            </>
                          ) : (
                            <>
                              <Sparkles className="w-4 h-4" />
                              <span>Generate AI Analysis</span>
                            </>
                          )}
                        </button>
                      </div>
                    )}

                    {/* Content preview */}
                    {item.content && (
                      <p className="text-slate-300 text-sm leading-relaxed line-clamp-2 mb-4">
                        {item.content}
                      </p>
                    )}

                    {/* Read more link */}
                    <div className="flex items-center gap-2 text-sm font-semibold group-hover:gap-3 transition-all" style={{ color: categoryTheme.primary }}>
                      <span>Read Full Article</span>
                      <ExternalLink className="w-4 h-4 group-hover:scale-110 transition-transform" />
                    </div>
                  </div>

                  {/* Decorative corner element */}
                  <div
                    className="absolute top-0 right-0 w-24 h-24 opacity-5 group-hover:opacity-10 transition-opacity"
                    style={{ color: categoryTheme.primary }}
                  >
                    <span className="text-6xl">{currentCategory.emoji}</span>
                  </div>
                </article>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Tier Notice - Premium or Free */}
      {!checkingTier && (
        <div className="mt-8">
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
            <div className="rounded-2xl p-6 border-2 border-slate-700" style={{ backgroundColor: theme.colors.background.secondary }}>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Clock className="w-5 h-5 text-yellow-400" />
                <p className="text-slate-300">
                  <span className="font-bold text-white">Free Tier:</span> News delivered with 15-minute delay
                </p>
                <button
                  onClick={handleUpgrade}
                  className="px-6 py-3 rounded-xl font-bold text-white text-sm bg-gradient-to-r from-orange-500 to-purple-500 hover:from-orange-400 hover:to-purple-400 hover:shadow-2xl hover:shadow-purple-500/50 active:scale-95 transition-all duration-300 transform hover:scale-110 hover:-translate-y-1 border-2 border-white/20 cursor-pointer"
                >
                  ✨ Upgrade to Premium ($4.99/mo) for Real-Time ⚡
                </button>
              </div>
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
  );
}
