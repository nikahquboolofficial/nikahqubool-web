"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function InterestsSentPage() {
  return (
    <ActivityTabContent 
      activeTab="interests-sent"
      title="Interests Expressed"
      subtitle="Profiles where you expressed interest"
      iconName="send"
    />
  );
}