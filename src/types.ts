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
}

export interface AppConfig {
  shaders: ShaderConfig[];
}
