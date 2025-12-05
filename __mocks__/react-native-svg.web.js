import React from 'react';

export const SvgUri = (props) => {
  const { uri, width, height } = props;
  return <img src={uri} width={width} height={height} />;
};
