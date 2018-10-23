import React from 'react';
import WarningIcon from '../../ui/icons/svg/warning.svg';
import styled from "styled-components";

const StyledContainer = styled.div`
  text-align: center;
  margin-top: 40vh;
`;

const StyledIcon = styled.img`
  display: block;
  margin: 0 auto 15px;
`;

const Warning = ({ text, ...props }) => (
  <StyledContainer>
    <StyledIcon src={WarningIcon} />
    {props.children}
  </StyledContainer>
);

export default Warning;