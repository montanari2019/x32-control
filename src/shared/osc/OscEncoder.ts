import { Buffer } from 'buffer';
import { OscArg, OscMessage } from './OscMessage';

const pad4 = (length: number): number => (4 - (length % 4)) % 4;

const encodeString = (value: string): Buffer => {
  const content = Buffer.from(`${value}\0`, 'utf8');
  return Buffer.concat([content, Buffer.alloc(pad4(content.length))]);
};

const encodeInt = (value: number): Buffer => {
  const buffer = Buffer.alloc(4);
  buffer.writeInt32BE(value, 0);
  return buffer;
};

const encodeFloat = (value: number): Buffer => {
  const buffer = Buffer.alloc(4);
  buffer.writeFloatBE(value, 0);
  return buffer;
};

const isTypedArg = (arg: OscArg): arg is Extract<OscArg, { type: string }> =>
  typeof arg === 'object' && arg !== null && 'type' in arg && 'value' in arg;

const getTypeTag = (arg: OscArg): string => {
  if (isTypedArg(arg)) {
    return arg.type;
  }

  if (typeof arg === 'string') {
    return 's';
  }

  if (typeof arg === 'boolean') {
    return arg ? 'T' : 'F';
  }

  if (arg === null) {
    return 'N';
  }

  return Number.isInteger(arg) ? 'i' : 'f';
};

const encodeArg = (arg: OscArg): Buffer => {
  if (isTypedArg(arg)) {
    if (arg.type === 's') return encodeString(arg.value);
    if (arg.type === 'i') return encodeInt(Math.round(arg.value));
    return encodeFloat(arg.value);
  }

  if (typeof arg === 'string') {
    return encodeString(arg);
  }

  if (typeof arg === 'number') {
    return Number.isInteger(arg) ? encodeInt(arg) : encodeFloat(arg);
  }

  return Buffer.alloc(0);
};

export class OscEncoder {
  static encode(message: OscMessage): Buffer {
    const tags = `,${message.args.map(getTypeTag).join('')}`;
    return Buffer.concat([
      encodeString(message.address),
      encodeString(tags),
      ...message.args.map(encodeArg),
    ]);
  }
}
