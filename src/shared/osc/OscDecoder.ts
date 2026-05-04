import { Buffer } from 'buffer';
import { AppError } from '@shared/errors/AppError';
import { OscArg, OscDecodedPacket } from './OscMessage';

const nextOffset = (offset: number): number =>
  offset + ((4 - (offset % 4)) % 4);

const readOscString = (
  buffer: Buffer,
  offset: number,
): { value: string; offset: number } => {
  const end = buffer.indexOf(0, offset);

  if (end === -1) {
    throw new AppError(
      'INVALID_OSC_RESPONSE',
      'String OSC sem terminador nulo.',
    );
  }

  const value = buffer.toString('utf8', offset, end);
  return { value, offset: nextOffset(end + 1) };
};

export class OscDecoder {
  static decode(data: Buffer | Uint8Array): OscDecodedPacket {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const address = readOscString(buffer, 0);

    if (!address.value.startsWith('/')) {
      throw new AppError('INVALID_OSC_RESPONSE', 'Endereço OSC inválido.');
    }

    const typeTags = readOscString(buffer, address.offset);

    if (!typeTags.value.startsWith(',')) {
      throw new AppError('INVALID_OSC_RESPONSE', 'Type tag OSC inválida.');
    }

    let offset = typeTags.offset;
    const args: OscArg[] = [];

    for (const tag of typeTags.value.slice(1)) {
      if (tag === 's') {
        const stringArg = readOscString(buffer, offset);
        args.push(stringArg.value);
        offset = stringArg.offset;
        continue;
      }

      if (tag === 'i') {
        args.push(buffer.readInt32BE(offset));
        offset += 4;
        continue;
      }

      if (tag === 'f') {
        args.push(buffer.readFloatBE(offset));
        offset += 4;
        continue;
      }

      if (tag === 'T' || tag === 'F') {
        args.push(tag === 'T');
        continue;
      }

      if (tag === 'N') {
        args.push(null);
        continue;
      }

      throw new AppError(
        'INVALID_OSC_RESPONSE',
        `Type tag OSC não suportada: ${tag}`,
      );
    }

    return { address: address.value, args };
  }
}
