
export enum Biome {
  TUNDRA = 'Tundra',
  RAINFOREST = 'Rainforest',
  DESERT = 'Desert',
  WOODLAND = 'Woodland',
  SAVANNA = 'Savanna'
}

export interface BoundingBox {
  top: number;
  left: number;
  width: number;
  height: number;
}

export interface GameChallenge {
  imageUrl: string;
  animal: string;
  biome: Biome;
  boundingBox: BoundingBox;
  hints: string[];
  natureFact: string;
  fieldBrief: string;
  timestamp: number;
  isUltraHD: boolean; // Flag for Ghillie Pass / 4K renders
}

export enum GameState {
  START = 'START',
  BRIEFING = 'BRIEFING',
  LOADING = 'LOADING',
  PLAYING = 'PLAYING',
  FOUND = 'FOUND',
  FACTS = 'FACTS'
}
