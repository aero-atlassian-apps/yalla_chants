import React from 'react'
import Svg, { Circle, Path } from 'react-native-svg'
import { useColors } from '../../constants/Colors'

interface Props {
  size?: number
  color?: string
  style?: any
}

export const SupportersIcon: React.FC<Props> = ({ size = 20, color, style }) => {
  const Colors = useColors()
  const fill = color || Colors.white
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" style={style}>
      <Circle cx="8" cy="8" r="3" fill={fill} />
      <Circle cx="16" cy="8" r="3" fill={fill} />
      <Path d="M4 19c0-3.3 3.2-5.5 6-5.5s6 2.2 6 5.5v1H4z" fill={fill} opacity="0.9" />
      <Path d="M10 19c0-2.2 2.2-3.7 4.2-3.7S18.4 16.8 18.4 19v1H10z" fill={fill} opacity="0.8" />
    </Svg>
  )
}

