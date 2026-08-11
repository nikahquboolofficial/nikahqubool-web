"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function GalleryRequestsPage() {
  return (
    <ActivityTabContent 
      activeTab="gallery-requests"
      title="Photo Access Sent"
      subtitle="Private photo requests you made"
      iconName="lock"
    />
  );
}