const assertRange = (
  value: number,
  min: number,
  max: number,
  label: string,
): void => {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new RangeError(`${label} deve estar entre ${min} e ${max}.`);
  }
};

const two = (value: number): string => value.toString().padStart(2, '0');

export class X32Protocol {
  static readonly defaultPort = 10023;

  static getInfoPath(): string {
    return '/info';
  }

  static getStatusPath(): string {
    return '/status';
  }

  static getXRemotePath(): string {
    return '/xremote';
  }

  static getChannelNamePath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/config/name`;
  }

  static getChannelColorPath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/config/color`;
  }

  static getBusNamePath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/config/name`;
  }

  static getBusSendLevelPath(channel: number, bus: number): string {
    assertRange(channel, 1, 32, 'channel');
    assertRange(bus, 1, 16, 'bus');
    return `/ch/${two(channel)}/mix/${two(bus)}/level`;
  }

  static getBusSendOnPath(channel: number, bus: number): string {
    assertRange(channel, 1, 32, 'channel');
    assertRange(bus, 1, 16, 'bus');
    return `/ch/${two(channel)}/mix/${two(bus)}/on`;
  }

  static getBusMasterFaderPath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/mix/fader`;
  }

  static getBusMasterOnPath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/mix/on`;
  }
}
