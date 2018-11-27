import lang from 'i18n-js';
import React from 'react';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import Dialog from '@material-ui/core/Dialog';
import DialogActions from '@material-ui/core/DialogActions';
import DialogContent from '@material-ui/core/DialogContent';
import DialogContentText from '@material-ui/core/DialogContentText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Slide from '@material-ui/core/Slide';
import classNames from 'classnames';

function Transition(props) {
  return <Slide direction="up" {...props} />;
}

const styles = () => ({
  dialog: {
    textAlign: 'center',
  },
  actions: {
    background: 'rgba(255, 255, 255, 0.8)',
    margin: 0,
    borderTop: 'solid 1px #ccc',
  },
  button: {
    margin: '0',
    fontSize: '17px',
    color: '#007AFF',
    width: '50%',
    borderRight: 'solid 1px #ccc',
    borderRadius: 0,
    padding: '15px',
  },
});

const ReleaseDomainAlert = ({ classes, open, handleClose }) => (
  <div>
    <Dialog
      className={classNames(classes.dialog)}
      open={open}
      TransitionComponent={Transition}
      keepMounted
      onClose={handleClose}
      aria-labelledby="alert-dialog-slide-title"
      aria-describedby="alert-dialog-slide-description"
    >
      <DialogTitle id="alert-dialog-slide-title">
        {lang.t('domain.release.alert.title')}
      </DialogTitle>
      <DialogContent>
        <DialogContentText id="alert-dialog-slide-description">
          {lang.t('domain.release.alert.text')}
        </DialogContentText>
      </DialogContent>
      <DialogActions className={classNames(classes.actions)}>
        <Button onClick={() => handleClose(null)} className={classNames(classes.button)} color="primary">
          <strong>{lang.t('action.cancel')}</strong>
        </Button>
        <Button onClick={() => handleClose(true)} className={classNames(classes.button)} color="primary">
          {lang.t('action.yes')}
        </Button>
      </DialogActions>
    </Dialog>
  </div>
);


export default withStyles(styles)(ReleaseDomainAlert);
