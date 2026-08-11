"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function InterestsReceivedPage() {
  return (
    <ActivityTabContent 
      activeTab="interests-received"
      title="Incoming Interests"
      subtitle="Members looking to connect with you"
      iconName="inbox"
    />
  );
}