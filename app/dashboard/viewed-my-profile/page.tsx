"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function ViewedMyProfilePage() {
  return (
    <ActivityTabContent 
      activeTab="viewed-my-profile"
      title="Profile Visitors"
      subtitle="Members who checked your profile"
      iconName="flame"
    />
  );
}