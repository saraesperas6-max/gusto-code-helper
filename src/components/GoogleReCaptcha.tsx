import React from 'react';
import AlphanumericCaptcha from '@/components/AlphanumericCaptcha';

interface GoogleReCaptchaProps {
  onVerified: (verified: boolean) => void;
}

const GoogleReCaptcha: React.FC<GoogleReCaptchaProps> = ({ onVerified }) => {
  return <AlphanumericCaptcha onVerified={onVerified} />;
};

export default GoogleReCaptcha;
