import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import Button from '@material-ui/core/Button';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import DialogTitle from '@material-ui/core/DialogTitle';
import Dialog from '@material-ui/core/Dialog';
import PersonIcon from '@material-ui/icons/Person';
import EditIcon from '@material-ui/icons/Edit';
import DeleteOutline from '@material-ui/icons/Delete';
import Typography from '@material-ui/core/Typography';
import blue from '@material-ui/core/colors/blue';

const styles = {
  paper: {
    margin: 0,
    maxWidth: '100%',
    borderRadius: '6px 6px 0 0',
  },
  list: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    margin: 0
  }
};

class SimpleDialog extends React.Component {
  handleClose = () => {
    this.props.onClose(this.props.selectedValue);
  };

  handleListItemClick = value => {
    this.props.onClose(value);
  };

  render() {
    const { classes, onClose, selectedValue, ...other } = this.props;

    return (
      <Dialog classes={{paper: classes.paper,}} onClose={this.handleClose} fullWidth paperFullWidth style={{alignItems: 'flex-end'}} aria-labelledby="simple-dialog-title" {...other}>
        <List>
          <ListItem button onClick={() => this.handleListItemClick('edit')} key="edit">
            <ListItemIcon>
                <EditIcon />
            </ListItemIcon>
            <ListItemText primary="Edit Contact Code" />
          </ListItem>
          <ListItem button onClick={() => this.handleListItemClick('release')}>
            <ListItemIcon>
                <DeleteOutline />
            </ListItemIcon>
            <ListItemText primary="Release Name" />
          </ListItem>
        </List>
      </Dialog>
    );
  }
}

SimpleDialog.propTypes = {
  classes: PropTypes.object.isRequired,
  onClose: PropTypes.func,
  selectedValue: PropTypes.string,
};

const SimpleDialogWrapped = withStyles(styles)(SimpleDialog);
export default SimpleDialogWrapped;

