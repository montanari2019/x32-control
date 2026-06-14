const assertRange = (value: number, min: number, max: number, label: string): void => {
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

  static getChannelFaderPath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/mix/fader`;
  }

  static getChannelOnPath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/mix/on`;
  }

  static getChannelPanPath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/mix/pan`;
  }

  static getBusNamePath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/config/name`;
  }

  static getBusColorPath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/config/color`;
  }

  static getBusStereoLinkPath(leftBus: number, rightBus: number): string {
    assertRange(leftBus, 1, 15, 'leftBus');
    assertRange(rightBus, 2, 16, 'rightBus');

    if (leftBus % 2 !== 1 || rightBus !== leftBus + 1) {
      throw new RangeError('Stereo link deve ser consultado em pares 1-2, 3-4, ..., 15-16.');
    }

    return `/config/buslink/${leftBus}-${rightBus}`;
  }

  static getChannelLinkPath(leftChannel: number, rightChannel: number): string {
    assertRange(leftChannel, 1, 31, 'leftChannel');
    assertRange(rightChannel, 2, 32, 'rightChannel');

    if (leftChannel % 2 !== 1 || rightChannel !== leftChannel + 1) {
      throw new RangeError('Channel link deve ser consultado em pares 1-2, 3-4, ..., 31-32.');
    }

    return `/config/chlink/${leftChannel}-${rightChannel}`;
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

  static getBusSendPanPath(channel: number, bus: number): string {
    assertRange(channel, 1, 32, 'channel');
    assertRange(bus, 1, 16, 'bus');
    return `/ch/${two(channel)}/mix/${two(bus)}/pan`;
  }

  static getAuxInNamePath(aux: number): string {
    assertRange(aux, 1, 8, 'aux');
    return `/auxin/${two(aux)}/config/name`;
  }

  static getAuxInColorPath(aux: number): string {
    assertRange(aux, 1, 8, 'aux');
    return `/auxin/${two(aux)}/config/color`;
  }

  static getAuxInBusSendLevelPath(aux: number, bus: number): string {
    assertRange(aux, 1, 8, 'aux');
    assertRange(bus, 1, 16, 'bus');
    return `/auxin/${two(aux)}/mix/${two(bus)}/level`;
  }

  static getAuxInBusSendOnPath(aux: number, bus: number): string {
    assertRange(aux, 1, 8, 'aux');
    assertRange(bus, 1, 16, 'bus');
    return `/auxin/${two(aux)}/mix/${two(bus)}/on`;
  }

  static getAuxInBusSendPanPath(aux: number, bus: number): string {
    assertRange(aux, 1, 8, 'aux');
    assertRange(bus, 1, 16, 'bus');
    return `/auxin/${two(aux)}/mix/${two(bus)}/pan`;
  }

  static getFxReturnNamePath(fxReturn: number): string {
    assertRange(fxReturn, 1, 8, 'fxReturn');
    return `/fxrtn/${two(fxReturn)}/config/name`;
  }

  static getFxReturnColorPath(fxReturn: number): string {
    assertRange(fxReturn, 1, 8, 'fxReturn');
    return `/fxrtn/${two(fxReturn)}/config/color`;
  }

  static getFxReturnBusSendLevelPath(fxReturn: number, bus: number): string {
    assertRange(fxReturn, 1, 8, 'fxReturn');
    assertRange(bus, 1, 16, 'bus');
    return `/fxrtn/${two(fxReturn)}/mix/${two(bus)}/level`;
  }

  static getFxReturnBusSendOnPath(fxReturn: number, bus: number): string {
    assertRange(fxReturn, 1, 8, 'fxReturn');
    assertRange(bus, 1, 16, 'bus');
    return `/fxrtn/${two(fxReturn)}/mix/${two(bus)}/on`;
  }

  static getFxReturnBusSendPanPath(fxReturn: number, bus: number): string {
    assertRange(fxReturn, 1, 8, 'fxReturn');
    assertRange(bus, 1, 16, 'bus');
    return `/fxrtn/${two(fxReturn)}/mix/${two(bus)}/pan`;
  }

  static getBusMasterFaderPath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/mix/fader`;
  }

  static getBusMasterOnPath(bus: number): string {
    assertRange(bus, 1, 16, 'bus');
    return `/bus/${two(bus)}/mix/on`;
  }

  static getDcaFaderPath(dca: number): string {
    assertRange(dca, 1, 8, 'dca');
    return `/dca/${dca}/fader`;
  }

  static getDcaOnPath(dca: number): string {
    assertRange(dca, 1, 8, 'dca');
    return `/dca/${dca}/on`;
  }

  static getDcaNamePath(dca: number): string {
    assertRange(dca, 1, 8, 'dca');
    return `/dca/${dca}/config/name`;
  }

  static getDcaColorPath(dca: number): string {
    assertRange(dca, 1, 8, 'dca');
    return `/dca/${dca}/config/color`;
  }

  static getChannelDcaAssignmentPath(channel: number): string {
    assertRange(channel, 1, 32, 'channel');
    return `/ch/${two(channel)}/grp/dca`;
  }

  static getMeters1Path(): string {
    return '/meters/1';
  }

  static getMeters2Path(): string {
    return '/meters/2';
  }

  static getMeters13Path(): string {
    return '/meters/13';
  }

  static getMeters0Path(): string {
    return '/meters/0';
  }

  static getMetersSubscribePath(): string {
    return '/meters';
  }

  static getMetersRenewPath(): string {
    return '/renew';
  }
}
