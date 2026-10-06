import { useCallback } from "react";
import Navbar from "../components/landing/Navbar";
import Hero from "../components/landing/Hero";
import {
  StoryAndProcessSection,
  ByWiseinSection,
  WiseinSection,
  AnimatedFooterSection
} from "../components/landing/RedesignSections";

import { Navigate } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import "@fontsource-variable/manrope";
import "../styles/tokens.css";
import "../styles/page.css";
import "../styles/redesign.css";

const HOME_BY_ROLE: Record<string, string> = {
  attendee: '/dashboard',
  organizer: '/organizer/dashboard',
  admin: '/admin/dashboard',
};

const stillParam = new URLSearchParams(window.location.search).get("t");
const still = stillParam !== null ? parseFloat(stillParam) : undefined;

const LandingPage = () => {
  const isAuthenticated = useAppStore((s) => s.isAuthenticated);
  const role = useAppStore((s) => s.user?.role);

  const onConnect = useCallback(() => {
    // Add logic here if needed for when connection happens in the video
  }, []);

  if (isAuthenticated) {
    return <Navigate to={HOME_BY_ROLE[role ?? 'attendee'] ?? '/dashboard'} replace />;
  }

  return (
    <div className="page page-redesign">
      
      <Navbar />
      
      <main>
        {/* 01. HERO */}
        <Hero />
        
        {/* 02. HOW IT WORKS + STORY */}
        <StoryAndProcessSection />
        
        {/* 03. BYWISEIN EVENTS */}
        <ByWiseinSection />
        
        {/* 05. WISEIN NETWORK */}
        <WiseinSection />
      </main>
      
      {/* 06. FINAL ANIMATION & FOOTER */}
      <AnimatedFooterSection />
    </div>
  );
};

export default LandingPage;
