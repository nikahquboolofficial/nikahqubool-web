"use client";
import ActivityTabContent from '@/components/dashboard/ActivityTabContent';

export default function GalleryRequestsReceivedPage() {
  return (
    <ActivityTabContent 
      activeTab="gallery-requests-received"
      title="Photo Access Requests"
      subtitle="Members requesting your photo unlock"
      iconName="sparkles"
    />
  );
}