export interface GameState {
  status: 'menu' | 'playing' | 'settings' | 'about';
  background: string;
  videoOverlay?: string;
  soundtrack?: string;
  gameSoundtrack?: string;
  rainSound?: string;
  isDevMode: boolean;
  musicVolume: number;
  rainVolume: number;
  brightness: number;
}
