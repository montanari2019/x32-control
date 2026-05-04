export type ConsoleStatus =
  | 'connected'
  | 'disconnected'
  | 'searching'
  | 'error';

export type ConsoleDevice = {
  id: string;
  ip: string;
  port: number;
  name: string;
  model: string;
  status: ConsoleStatus;
  firmware?: string;
};
