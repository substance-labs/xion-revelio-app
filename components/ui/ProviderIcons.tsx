import React from 'react';
import Svg, { Path, G } from 'react-native-svg';
import { ViewStyle, Image, ImageStyle } from 'react-native';

interface ProviderIconProps {
  size?: number;
  color?: string;
  style?: ViewStyle;
}

export const GithubIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  color = '#24292e', 
  style 
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 20 20" 
    style={style}
  >
    <Path
      d="M10,0 C4.477,0 0,4.59 0,10.253 C0,14.782 2.862,18.624 6.833,19.981 C7.34,20.082 7.52,19.762 7.52,19.489 C7.52,19.151 7.508,18.047 7.508,16.675 C7.508,15.719 7.828,15.095 8.187,14.777 C5.96,14.523 3.62,13.656 3.62,9.718 C3.62,8.598 4.008,7.684 4.65,6.966 C4.546,6.707 4.203,5.664 4.748,4.252 C4.748,4.252 5.586,3.977 7.495,5.303 C8.294,5.076 9.15,4.962 10,4.958 C10.85,4.962 11.705,5.076 12.503,5.303 C14.414,3.977 15.254,4.252 15.254,4.252 C15.797,5.664 15.454,6.707 15.351,6.966 C15.99,7.684 16.381,8.598 16.381,9.718 C16.381,13.646 14.046,14.526 11.825,14.785 C12.111,15.041 12.37,15.493 12.46,16.156 C13.03,16.418 14.478,16.871 15.37,15.304 C15.37,15.304 15.899,14.319 16.903,14.247 C16.903,14.247 17.878,14.234 16.971,14.87 C16.971,14.87 16.316,15.185 15.861,16.37 C15.861,16.37 15.274,18.2 12.492,17.58 C12.487,18.437 12.478,19.245 12.478,19.489 C12.478,19.76 12.662,20.077 13.161,19.982 C17.135,18.627 20,14.783 20,10.253 C20,4.59 15.522,0 10,0"
      fill={color}
    />
  </Svg>
);

export const GoogleIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  color = '#ea4335', 
  style 
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    style={style}
  >
    <Path
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      fill="#4285F4"
    />
    <Path
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      fill="#34A853"
    />
    <Path
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      fill="#FBBC05"
    />
    <Path
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      fill="#EA4335"
    />
  </Svg>
);

export const LinkedInIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  color = '#0a66c2', 
  style 
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    style={style}
  >
    <Path
      d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"
      fill={color}
    />
  </Svg>
);

export const StravaIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  color = '#fc4c02', 
  style 
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    style={style}
  >
    <Path
      d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.598h4.172L10.463 0z"
      fill={color}
    />
  </Svg>
);

export const TwitterIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  color = '#000000', 
  style 
}) => (
  <Svg 
    width={size} 
    height={size} 
    viewBox="0 0 24 24" 
    style={style}
  >
    <Path
      d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"
      fill={color}
    />
  </Svg>
);

export const LogoIcon: React.FC<ProviderIconProps> = ({ 
  size = 24, 
  style 
}) => (
  <Image 
    source={require('@/assets/images/icon.png')} 
    style={[{ width: size, height: size }, style as ImageStyle]}
    resizeMode="contain"
  />
);

// Provider icon mapping
export const ProviderIconComponents = {
  github: GithubIcon,
  google: GoogleIcon,
  gmail: GoogleIcon, // Gmail uses Google icon
  linkedin: LinkedInIcon,
  strava: StravaIcon,
  twitter: TwitterIcon,
  x: TwitterIcon, // X (formerly Twitter) uses Twitter icon
  logo: LogoIcon, // App logo for "No verification required"
};

// Main provider icon component
interface ProviderIconComponentProps {
  provider: string;
  size?: number;
  style?: ViewStyle;
}

export const ProviderIconComponent: React.FC<ProviderIconComponentProps> = ({ 
  provider, 
  size = 24, 
  style 
}) => {
  const normalizedProvider = provider.toLowerCase();
  const IconComponent = ProviderIconComponents[normalizedProvider as keyof typeof ProviderIconComponents];
  
  if (!IconComponent) {
    return null;
  }
  
  return <IconComponent size={size} style={style} />;
};
