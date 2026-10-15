import React from 'react';
import Svg, { Path } from 'react-native-svg';

const ArrowLeft = ({ width = 24, height = 24, color, ...others }: IconPropsType): JSX.Element => (
  <Svg width={width} height={height} viewBox="0 0 100 100" fill="none" {...others}>
    <Path
      d="M33.934 54.458L64.756 82.396C65.139 82.744 65.62 82.915 66.1 82.915C66.645 82.915 67.187 82.693 67.582 82.258C68.323 81.44 68.262 80.175 67.443 79.434L37.801 52.564L64.67 22.921C65.412 22.103 65.35 20.838 64.531 20.097C63.714 19.355 62.449 19.418 61.707 20.236L33.768 51.059C33.329 51.544 33.178 52.185 33.293 52.782C33.234 53.39 33.446 54.017 33.934 54.458Z"
      fill={color}
      stroke={color}
      strokeWidth={1.4}
    />
  </Svg>
);

export default ArrowLeft;
