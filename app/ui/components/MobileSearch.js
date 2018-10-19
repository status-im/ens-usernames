import React from 'react';
import styled, { css } from 'styled-components';
import theme from '../theme';
import SearchIcon from '@material-ui/icons/Search';
import Button from '@material-ui/core/Button';

const searchWrapper = {
  width: '100%',
  height: '100%',
  position: 'absolute',
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-start',
  paddingLeft: '11px',
  boxSizing: 'border-box',
};

const SearchWrapper = styled.div`
  width: 100%;
  height: 100%;
  position: absolute;
  pointer-events: none;
  display: flex;
  align-items: center;
  justify-content: flex-start;
  padding-left: 11px;
  box-sizing: border-box;
`;

const MobileInput = styled.input`
  display: block;
  border-radius: 0;
  background-color: #eef2f5;
  font-size: 16px;
  border: none;
  height: 3.5em;
  width: ${({ wide }) => (wide ? '100%' : 'auto')};
  appearance: none;
  box-shadow: none;
  padding-left: ${({ search }) => (search ? '45px' : '15px')};
  
  &:focus {
    outline: none;
    border-color: ${theme.contentBorderActive};
  }
`;

const MobileSearch = props => (
  <div style={{ position: 'relative' }}>
    {props.search && <SearchWrapper>
      <SearchIcon style={{ color: theme.accent }} />
    </SearchWrapper>}
    <div style={{ display: 'flex' }}>
      <MobileInput {...props} autoCapitalize="none" />
    </div>
  </div>
);

export default MobileSearch;
