export interface Coordinate {
  lat: number;
  lng: number;
}

export interface RouteStop {
  name: string;
  description: string;
  distanceFromPrev: string;
  coordinates: Coordinate;
  type: 'start' | 'rest' | 'end';
}

export interface RouteOption {
  id: string;
  name: string;
  totalDistance: string;
  estimatedDuration: string;
  description: string;
  stops: RouteStop[];
  path?: Coordinate[]; // 真實路徑的座標點集合
}

export interface UserInput {
  origin: string;
  destination: string;
  interval: number; // in km
}