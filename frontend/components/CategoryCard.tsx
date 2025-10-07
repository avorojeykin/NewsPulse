'use client';

import { categories, type CategoryId } from '@/lib/theme';
import { ArrowRight, Lock } from 'lucide-react';

interface CategoryCardProps {
  categoryId: CategoryId;
  onClick: () => void;
}

export default function CategoryCard({ categoryId, onClick }: CategoryCardProps) {
  const category = categories[categoryId];
  const isComingSoon = category.comingSoon;

  return (
    <button
      onClick={isComingSoon ? undefined : onClick}
      disabled={isComingSoon}
      className={`
        group relative overflow-hidden rounded-2xl p-8 text-left transition-all duration-300
        ${isComingSoon
          ? 'cursor-not-allowed opacity-60'
          : 'cursor-pointer hover:scale-[1.02] hover:shadow-2xl'
        }
      `}
      style={{
        background: `linear-gradient(135deg, ${category.theme.glow}, transparent)`,
        borderWidth: '2px',
        borderColor: category.theme.border,
      }}
    >
      {/* Glow effect on hover */}
      {!isComingSoon && (
        <div
          className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-xl"
          style={{
            background: `radial-gradient(circle at center, ${category.theme.glow}, transparent 70%)`,
          }}
        />
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <span className="text-5xl">{category.emoji}</span>
            <div>
              <h3 className="text-2xl font-bold text-white mb-1">{category.title}</h3>
              <p className="text-sm" style={{ color: category.theme.secondary }}>
                {category.stats}
              </p>
            </div>
          </div>

          {isComingSoon ? (
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-slate-700/50 border border-slate-600">
              <Lock className="w-4 h-4 text-slate-400" />
              <span className="text-xs font-semibold text-slate-300">Phase 2</span>
            </div>
          ) : (
            <div
              className="p-3 rounded-full transition-all duration-300 group-hover:scale-110"
              style={{ backgroundColor: category.theme.glow }}
            >
              <ArrowRight
                className="w-6 h-6 transition-transform duration-300 group-hover:translate-x-1"
                style={{ color: category.theme.primary }}
              />
            </div>
          )}
        </div>

        {/* Description */}
        <p className="text-slate-300 text-base leading-relaxed mb-4">
          {category.description}
        </p>

        {/* Tagline with gradient */}
        <div className="flex items-center gap-2">
          <div
            className="h-1 w-12 rounded-full"
            style={{ backgroundColor: category.theme.primary }}
          />
          <p
            className="text-sm font-semibold"
            style={{ color: category.theme.primary }}
          >
            {category.tagline}
          </p>
        </div>

        {/* Subtle pattern overlay */}
        <div className="absolute bottom-0 right-0 w-32 h-32 opacity-5">
          <svg viewBox="0 0 100 100" className="w-full h-full">
            <pattern id={`pattern-${categoryId}`} x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
            <rect x="0" y="0" width="100" height="100" fill={`url(#pattern-${categoryId})`} />
          </svg>
        </div>
      </div>

      {/* Coming soon overlay */}
      {isComingSoon && (
        <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-[1px] rounded-2xl flex items-center justify-center">
          <div className="text-center">
            <Lock className="w-12 h-12 text-slate-400 mx-auto mb-2" />
            <p className="text-lg font-bold text-slate-300">Coming Soon</p>
            <p className="text-sm text-slate-400">Phase 2</p>
          </div>
        </div>
      )}
    </button>
  );
}
