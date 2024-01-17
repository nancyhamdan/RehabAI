import { useState } from 'react';
import {Box, Avatar, Menu, MenuItem, ListItemIcon, Divider, IconButton, Tooltip} from '@mui/material'
import {Settings, Logout} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { api } from '../api'
import PersonIcon from '@mui/icons-material/Person';

export default function AvatarMenu() {
  const navigateTo = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  
  const open = Boolean(anchorEl);
  
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleCloseLogOut = async () => {
      console.log("logged out")
      handleClose()
      try {
        const response = await api.post('/api/logout/');
        console.log(response.data.message);
        navigateTo('/');
    } catch (error) {
        console.error('Failed to logout:', error);
    }
  }

  return (
    <>
      <Box sx={{ display: 'flex', alignItems: 'center', textAlign: 'center' }}>
        <Tooltip title="Account settings">
          <IconButton
            onClick={handleClick}
            size="large"
            edge="end"
            sx={{ ml: 2 }}
          >
            <PersonIcon sx={{fontSize: "2rem", color:"white"}} />
          </IconButton>
        </Tooltip>
      </Box>
      <Menu
        anchorEl={anchorEl}
        id="account-menu"
        open={open}
        onClose={handleClose}
        PaperProps={{
          elevation: 0,
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            '& .MuiAvatar-root': {
              width: 32,
              height: 32,
              ml: -0.5,
              mr: 1,
            },
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        <MenuItem>
          <Avatar /> Profile
        </MenuItem>
        
        <Divider />
       
        <MenuItem onClick={handleClose}>
          <ListItemIcon>
            <Settings fontSize="small" />
          </ListItemIcon>
          Settings
        </MenuItem>
        
        <MenuItem onClick={handleCloseLogOut}>
          <ListItemIcon>
            <Logout fontSize="small" />
          </ListItemIcon>
          Logout
        </MenuItem>
      </Menu>
    </>
  );
}