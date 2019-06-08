import styled from '@emotion/native';

export const container = {margin: 10};

export const Container = styled.View(() => ({
  display: 'flex',
  justifyContent: 'center',
  alignItems: 'center',
  ...container,
}));
