export interface ShaderConfig {
  id: string;
  name: string;
  duration: number;
  speed: number;
  startOffset: number;
  stickyRange: number;
  scrollRange: number;
  shaderId?: string;
  text?: string;
  animationMode?: 'always' | 'scroll';
}

export interface AppConfig {
  shaders: ShaderConfig[];
}
