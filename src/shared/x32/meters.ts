import { Buffer } from 'buffer';
import { OscClient } from '@shared/osc/OscClient';
import { OscMessage } from '@shared/osc/OscMessage';
import { X32Protocol } from '@shared/osc/X32Protocol';

export type MeterPacket = {
    levels: number[];
    updatedAt: number;
};

const METER_REFRESH_MS = 9000;
const FRAME_MS = 33;

const parseMetersBlob = (blob: Uint8Array): number[] => {
    const buffer = Buffer.from(blob);
    const floats: number[] = [];
    for (let offset = 0; offset + 4 <= buffer.length; offset += 4) {
        floats.push(buffer.readFloatBE(offset));
    }
    return floats;
};

const parseMetersMessage = (message: OscMessage): number[] => {
    const [firstArg] = message.args;
    if (firstArg instanceof Uint8Array) {
        return parseMetersBlob(firstArg).slice(0, 32);
    }

    if (Array.isArray(message.args) && message.args.every((arg) => typeof arg === 'number')) {
        return (message.args as number[]).slice(0, 32);
    }

    return [];
};

export const startMetersSubscription = (
    client: OscClient,
    onMeters: (packet: MeterPacket) => void,
): (() => void) => {
    let lastEmit = 0;
    const handleMeters = (message: OscMessage) => {
        const now = Date.now();
        if (now - lastEmit < FRAME_MS) {
            return;
        }
        lastEmit = now;
        const levels = parseMetersMessage(message);
        if (levels.length > 0) {
            onMeters({ levels, updatedAt: now });
        }
    };

    const unsubscribe = client.subscribe(X32Protocol.getMeters1Path(), handleMeters);

    const requestMeters = () => {
        client.send(X32Protocol.getMeters1Path(), []).catch(() => undefined);
    };

    requestMeters();
    const interval = setInterval(requestMeters, METER_REFRESH_MS);

    return () => {
        clearInterval(interval);
        unsubscribe();
    };
};
