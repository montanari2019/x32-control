import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';

const Info = ({ width = 24, height = 24, color, ...others }: IconPropsType): JSX.Element => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none" {...others}>
    <Circle cx={12} cy={12} r={9} stroke={color} strokeWidth={1.8} />
    <Path
      d="M12 10.6V16.2"
      stroke={color}
      strokeLinecap="round"
      strokeWidth={2}
    />
    <Path
      d="M12 7.8H12.01"
      stroke={color}
      strokeLinecap="round"
      strokeWidth={2.4}
    />
  </Svg>
);

export default Info;
