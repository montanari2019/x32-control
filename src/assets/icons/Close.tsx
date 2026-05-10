import React from 'react';
import Svg, { Path } from 'react-native-svg';

const Close = ({ width = 24, height = 24, color, ...others }: IconPropsType): JSX.Element => (
  <Svg width={width} height={height} viewBox="-0.5 0 25 25" fill="none" {...others}>
    <Path
      d="M3 21.32L21 3.32001"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M3 3.32001L21 21.32"
      stroke={color}
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

export default Close;
