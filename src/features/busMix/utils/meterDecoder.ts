export type ChannelMeterValues = {
  preFadeDb: number;
  postFadeDb: number;
  gateGrDb: number;
  dynGrDb: number;
};

const MIN_DB = -60;
const MAX_DB = 0;

const readShortDb = (view: DataView, index: number): number =>
  view.getInt16(4 + index * 2, true) / 256.0;

export const decodeMeterBlob = (blob: Uint8Array): ChannelMeterValues => {
  const view = new DataView(blob.buffer, blob.byteOffset, blob.byteLength);

  return {
    preFadeDb: readShortDb(view, 0),
    postFadeDb: readShortDb(view, 4),
    gateGrDb: readShortDb(view, 2),
    dynGrDb: readShortDb(view, 3),
  };
};

export const dbToMeterHeight = (db: number): number => {
  if (db <= MIN_DB) return 0;
  if (db >= MAX_DB) return 1;
  return (db - MIN_DB) / (MAX_DB - MIN_DB);
};
