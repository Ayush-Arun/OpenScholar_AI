import { createContext, useContext, useState } from 'react';

const ProfileContext = createContext(null);

export const profileDescriptions = {
  Student: {
    "SHOULD BUILD": "Great project to learn from",
    "SHOULD WATCH": "Worth following for classes",
    "SHOULD LEARN": "Study this deeply",
    "SHOULD IGNORE": "Too advanced / irrelevant",
  },
  Developer: {
    "SHOULD BUILD": "Production-ready — ship it",
    "SHOULD WATCH": "Track for integration later",
    "SHOULD LEARN": "Add to your skill stack",
    "SHOULD IGNORE": "Not worth engineer time",
  },
  Startup: {
    "SHOULD BUILD": "Competitive advantage — move now",
    "SHOULD WATCH": "Monitor for pivot opportunities",
    "SHOULD LEARN": "Upskill the team",
    "SHOULD IGNORE": "Low ROI for stage",
  },
  Researcher: {
    "SHOULD BUILD": "Novel contribution — replicate",
    "SHOULD WATCH": "Cite in upcoming work",
    "SHOULD LEARN": "Background reading required",
    "SHOULD IGNORE": "Below publication threshold",
  },
};

export function ProfileProvider({ children }) {
  const [profile, setProfile] = useState('Developer');
  return (
    <ProfileContext.Provider value={{ profile, setProfile, descriptions: profileDescriptions[profile] }}>
      {children}
    </ProfileContext.Provider>
  );
}

export function useProfile() {
  return useContext(ProfileContext);
}
