"use client";
import React from 'react';

export default function ProfileCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6 w-full animate-pulse">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-3xl overflow-hidden border border-rose-100/70 shadow-sm flex flex-col relative transition-opacity duration-300"
        >
          {/* IMAGE CONTAINER SKELETON */}
          <div className="relative w-full aspect-[4/5] min-h-[420px] max-h-[480px] bg-gradient-to-b from-[#f5ede5] to-[#ece3d8] overflow-hidden">
            {/* Top Match Score Badge Skeleton */}
            <div className="absolute top-3.5 left-3.5 w-24 h-6 bg-white/70 backdrop-blur-md rounded-full shadow-xs" />

            {/* Bottom Dark Overlay Gradient Mimic */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-900/60 via-slate-900/20 to-transparent" />

            {/* Text Overlay Skeleton */}
            <div className="absolute bottom-[84px] inset-x-4 space-y-2">
              <div className="w-2/3 h-5 bg-white/85 rounded-lg shadow-xs" />
              <div className="w-1/2 h-3.5 bg-white/70 rounded-md" />
              <div className="w-3/4 h-3.5 bg-white/70 rounded-md" />
            </div>

            {/* Action Buttons Container Skeleton */}
            <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-between gap-2.5 pt-2 border-t border-white/20">
              <div className="w-10 h-10 bg-white/80 rounded-2xl shrink-0" />
              <div className="flex-1 h-10 bg-[#e21e5b]/40 rounded-2xl" />
              <div className="w-10 h-10 bg-white/80 rounded-2xl shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
