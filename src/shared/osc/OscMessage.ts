export type OscTypedArg =
  | { type: 'f'; value: number }
  | { type: 'i'; value: number }
  | { type: 's'; value: string };

export type OscArg = string | number | boolean | null | Uint8Array | OscTypedArg;

export type OscMessage = {
  address: string;
  args: OscArg[];
};

export type OscDecodedPacket = OscMessage;
