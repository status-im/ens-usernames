import React from 'react';
import RightIcon from '../../ui/icons/svg/right.svg';
import styled from "styled-components";

const StyledContainer = styled.button`
  border: 0;
  background: none;
  color: #4360DF;
  display: flex;
  flex-direction: row;
  font-size: 15px;
  line-height: 18px;
  padding-top: 4px;
  padding-bottom: 4px;
`;

const StyledIcon = styled.img`
  margin-left: 14px;
`;

const ArrowButton = ({ text, ...props }) => (
  <StyledContainer {...props}>
    {props.children}
    <StyledIcon src={RightIcon} />
  </StyledContainer>
)

export default ArrowButton;