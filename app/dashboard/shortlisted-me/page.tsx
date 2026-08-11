"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function ShortlistedMePage() {
  return (
    <ActivityTabContent 
      activeTab="shortlisted-me"
      title="Saved By Members"
      subtitle="Members who bookmarked your profile"
      iconName="heart"
    />
  );
}