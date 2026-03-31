export interface ShaderConfig {
  id: string;
  name: string;
  duration: number;
  speed: number;
  startOffset: number;
  stickyRange: number;
  scrollRange: number;
  shaderId?: string;
  imageSequenceUrl?: string; // e.g. https://example.com/frames/{index}.webp
  imageSequenceFrameCount?: number;
  text?: string;
  imageUrl?: string;
  imageLink?: string;
  animationMode?: 'always' | 'scroll';
  // Project properties
  projectMediaUrl?: string;
  projectText?: string;
  projectLinkUrl?: string;
  projectParallaxSpeed?: number;
  projectAlignment?: 'left' | 'right';
  projectDistance?: number; // 0 to 1, where 0 is center and 1 is edge
  projectHorizontalPosition?: number; // 0 to 1, where 0 is left edge and 1 is right edge
  projectVerticalPosition?: number;
  projectSize?: number; // Width in vw
  projectVisible?: boolean;
  projectFade?: boolean;
  // Secondary Graphic properties
  projectSecondaryMediaUrl?: string;
  projectSecondaryParallaxSpeed?: number;
  projectSecondaryHorizontalPosition?: number;
  projectSecondaryVerticalPosition?: number;
  projectSecondarySize?: number;
  projectSecondaryFade?: boolean;
}

export interface AppConfig {
  shaders: ShaderConfig[];
}
