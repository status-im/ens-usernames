import React from 'react'
import styled from 'styled-components'
import PropTypes from 'prop-types'
import theme from '../theme'
import { Action, Permissions } from './IconInfo'

const Info = ({ children, title, ...props }) => (
  <Main {...props}>
    {title && <Title>{title}</Title>}
    {children}
  </Main>
);
Info.propTypes = {
  background: PropTypes.string,
  children: PropTypes.node,
  title: PropTypes.node,
};
Info.defaultProps = {
  background: theme.infoBackground,
};

const Main = styled.section`
  background: ${({ background }) => background};
  padding: 18px;
  border-radius: 8px;
  word-wrap: break-word;
  box-shadow: 0px 6px 10px rgba(0, 0, 0, 0.2);
  border-radius: 8px;
`

const Title = styled.h1`
  display: flex;
  margin-top: 0px; // needed to overwrite bootstrap.css
`;

Info.Action = Action
Info.Permissions = Permissions

export default Info
