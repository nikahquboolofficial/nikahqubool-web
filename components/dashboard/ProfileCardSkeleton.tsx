"use client";
import React from 'react';

export default function ProfileCardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-md flex flex-col relative animate-pulse"
        >
          {/* IMAGE CONTAINER SKELETON */}
          <div className="relative w-full aspect-[4/5] min-h-[480px] max-h-[520px] bg-slate-200 overflow-hidden">
            {/* Top Match Score Badge Skeleton */}
            <div className="absolute top-3.5 left-3.5 w-24 h-6 bg-slate-300 rounded-full" />

            {/* Bottom Dark Overlay Gradient Mimic */}
            <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-slate-400/50 via-slate-300/30 to-transparent" />

            {/* Text Overlay Skeleton */}
            <div className="absolute bottom-[96px] inset-x-3.5 space-y-2">
              {/* Name & Age Skeleton */}
              <div className="w-2/3 h-5 bg-slate-400/80 rounded-md" />
              {/* Location Skeleton */}
              <div className="w-1/2 h-3.5 bg-slate-400/60 rounded-md" />
              {/* Education Skeleton */}
              <div className="w-3/4 h-3.5 bg-slate-400/60 rounded-md" />
              {/* Profession Skeleton */}
              <div className="w-2/5 h-3.5 bg-slate-400/60 rounded-md" />
            </div>

            {/* Action Buttons Container Skeleton */}
            <div className="absolute bottom-3.5 inset-x-3.5 flex items-center justify-between gap-2 pt-2 border-t border-slate-300/40">
              <div className="w-11 h-11 bg-slate-400/80 rounded-2xl shrink-0" />
              <div className="flex-1 h-11 bg-slate-400/80 rounded-2xl" />
              <div className="w-11 h-11 bg-slate-400/80 rounded-2xl shrink-0" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
