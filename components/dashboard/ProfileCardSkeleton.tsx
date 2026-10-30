"use client";
import React from 'react';

export default function ProfileCardSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full">
      {Array.from({ length: count }).map((_, i) => (
        <div 
          key={i} 
          className="bg-white rounded-3xl overflow-hidden border border-rose-100/80 shadow-md flex flex-col relative"
        >
          {/* IMAGE CONTAINER SKELETON WITH LUXURY SILKY SHIMMER */}
          <div className="relative w-full aspect-[4/5] min-h-[440px] max-h-[500px] shimmer-luxury overflow-hidden">
            {/* Top Match Score Badge Skeleton */}
            <div className="absolute top-3.5 left-3.5 w-28 h-7 bg-white/70 backdrop-blur-md rounded-full shadow-xs" />

            {/* Bottom Dark Overlay Gradient Mimic */}
            <div className="absolute inset-x-0 bottom-0 h-52 bg-gradient-to-t from-slate-900/70 via-slate-900/30 to-transparent" />

            {/* Text Overlay Skeleton */}
            <div className="absolute bottom-[92px] inset-x-4 space-y-2.5">
              {/* Name & Age Skeleton */}
              <div className="w-2/3 h-5 bg-white/80 rounded-lg shadow-xs" />
              {/* Location Skeleton */}
              <div className="w-1/2 h-3.5 bg-white/60 rounded-md" />
              {/* Education Skeleton */}
              <div className="w-4/5 h-3.5 bg-white/60 rounded-md" />
              {/* Profession Skeleton */}
              <div className="w-2/5 h-3.5 bg-white/60 rounded-md" />
            </div>

            {/* Action Buttons Container Skeleton */}
            <div className="absolute bottom-3.5 inset-x-4 flex items-center justify-between gap-2.5 pt-2.5 border-t border-white/20">
              <div className="w-11 h-11 bg-white/80 rounded-2xl shrink-0 shadow-xs" />
              <div className="flex-1 h-11 bg-gradient-to-r from-[#d91b5c]/70 to-[#e11d48]/70 rounded-2xl shadow-xs" />
              <div className="w-11 h-11 bg-white/80 rounded-2xl shrink-0 shadow-xs" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
