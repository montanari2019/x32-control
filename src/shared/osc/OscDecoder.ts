import { Buffer } from 'buffer';
import { AppError } from '@shared/errors/AppError';
import { i18next } from '@shared/i18n';
import { OscArg, OscDecodedPacket } from './OscMessage';

const nextOffset = (offset: number): number => offset + ((4 - (offset % 4)) % 4);

const readOscString = (buffer: Buffer, offset: number): { value: string; offset: number } => {
  const end = buffer.indexOf(0, offset);

  if (end === -1) {
    throw new AppError('INVALID_OSC_RESPONSE', i18next.t('errors.invalidOscString'));
  }

  const value = buffer.toString('utf8', offset, end);
  return { value, offset: nextOffset(end + 1) };
};

export class OscDecoder {
  static decode(data: Buffer | Uint8Array): OscDecodedPacket {
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    const address = readOscString(buffer, 0);

    if (!address.value.startsWith('/')) {
      throw new AppError('INVALID_OSC_RESPONSE', i18next.t('errors.invalidOscAddress'));
    }

    const typeTags = readOscString(buffer, address.offset);

    if (!typeTags.value.startsWith(',')) {
      throw new AppError('INVALID_OSC_RESPONSE', i18next.t('errors.invalidOscTypeTag'));
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

      if (tag === 'b') {
        const size = buffer.readInt32BE(offset);
        offset += 4;
        const blob = buffer.subarray(offset, offset + size);
        args.push(Uint8Array.from(blob));
        offset = nextOffset(offset + size);
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

      throw new AppError('INVALID_OSC_RESPONSE', i18next.t('errors.unsupportedOscTypeTag', { tag }));
    }

    return { address: address.value, args };
  }
}
