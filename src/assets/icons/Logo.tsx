import React from 'react';
import Svg, { G, Path } from 'react-native-svg';
import { colors } from '@shared/theme/colors';

const Logo = ({
  width = 24,
  height = 24,
  color = colors.accent.primary,
  ...others
}: IconPropsType): JSX.Element => (
  <Svg viewBox="0 0 24 24" width={width} height={height} fill="none" {...others}>
    <G>
      <Path
        d="M3 11V13M6 8V16M9 10V14M12 7V17M15 4V20M18 9V15M21 11V13"
        stroke={color}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
  </Svg>
);

export default Logo;
