export type OscArg = string | number | boolean | null;

export type OscMessage = {
  address: string;
  args: OscArg[];
};

export type OscDecodedPacket = OscMessage;
