"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function ProfilesViewedPage() {
  return (
    <ActivityTabContent 
      activeTab="profiles-viewed"
      title="Recently Viewed"
      subtitle="Profiles you recently inspected"
      iconName="eye"
    />
  );
}