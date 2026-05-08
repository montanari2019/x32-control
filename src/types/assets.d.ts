import type { ColorValue } from 'react-native';
import type { SvgProps } from 'react-native-svg';

declare global {
  type IconPropsType = Omit<SvgProps, 'color'> & {
    color: ColorValue;
    colorSecondary?: ColorValue;
  };
}

export {};
