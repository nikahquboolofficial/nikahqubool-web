"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function ShortlistedByMePage() {
  return (
    <ActivityTabContent 
      activeTab="shortlisted-by-me"
      title="Saved Favorites"
      subtitle="Bookmarks saved for later review"
      iconName="bookmark"
    />
  );
}