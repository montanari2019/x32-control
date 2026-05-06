export type OscArg = string | number | boolean | null | Uint8Array;

export type OscMessage = {
  address: string;
  args: OscArg[];
};

export type OscDecodedPacket = OscMessage;
