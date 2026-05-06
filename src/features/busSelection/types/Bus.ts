export type Bus = {
  number: number;
  label: string;
  name: string;
  linkedBusNumber?: number;
  isStereoLinked?: boolean;
  rawNames?: {
    left?: string;
    right?: string;
  };
};
