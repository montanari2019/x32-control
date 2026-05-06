export type Channel = {
  id: string;
  number: number;
  label: string;
  name: string;
  color?: number | string;
  level: number;
  signalLevel: number;
  pan: number;
  on: boolean;
};
