import {Box, AppBar, Toolbar, IconButton, Typography} from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import AvatarMenu from './AvatarMenu';
//import { Link } from 'react-router-dom';

export default function TopBar() {
    return (
    <Box>
      <AppBar position="sticky" sx={{top:0}}>
        <Toolbar>
            <IconButton
                size="large"
                edge="start"
                color="inherit"
                sx={{ mr: 2 }}
            >
                <SpaIcon sx={{fontSize: "3rem"}} />

            </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            RehabAI
          </Typography>
          <AvatarMenu />
        </Toolbar>
      </AppBar>
    </Box>
    )
}