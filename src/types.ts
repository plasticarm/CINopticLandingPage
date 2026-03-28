export interface ShaderConfig {
  id: string;
  name: string;
  duration: number;
  speed: number;
  startOffset: number;
  stickyRange: number;
  scrollRange: number;
}

export interface AppConfig {
  shaders: ShaderConfig[];
}
