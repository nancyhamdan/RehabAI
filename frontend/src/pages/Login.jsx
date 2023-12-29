import { useState } from 'react';
import { Stack, TextField, Button, Typography, InputAdornment, IconButton } from '@mui/material';
import SpaIcon from '@mui/icons-material/Spa';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import { useNavigate } from "react-router-dom";

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [errorMessage, setErrorMessage] = useState('');
    let navigate = useNavigate();

    const handleClickShowPassword = () => {
        setShowPassword(!showPassword);
    };

    const handleLogin = async () => {
        try {
            //const response = await axios.post('/login', { username, password });
            //setErrorMessage(error.response.data.message);
            navigate('/exercises')
        } catch (error) {
            console.error('Failed to login:', error);
        }
    };

    const handleSignup = async () => {
        try {
            const response = await axios.post('/signup', { username, password });
            setErrorMessage(error.response.data.message);
            navigate('/')
        } catch (error) {
            console.error('Failed to signup:', error);
        }
    };

    return (
        <Stack 
            justifyContent="center"
            alignItems="center"
            spacing={2}
            mt={"10rem"}
        >
            <SpaIcon sx={{fontSize: "12rem"}} color="primary" />
            <Typography variant="h5" component="p">
                RehabAI
            </Typography>
            <TextField 
                id="outlined-basic" 
                label="Username" 
                variant="outlined" 
                sx={{width: "25rem"}} 
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
                id="outlined-adornment-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                variant="outlined"
                sx={{width: "25rem"}}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                    endAdornment: (
                        <InputAdornment position="end">
                            <IconButton
                                aria-label="toggle password visibility"
                                onClick={handleClickShowPassword}
                            >
                                {showPassword ? <Visibility /> : <VisibilityOff />}
                            </IconButton>
                        </InputAdornment>
                    ),
                }}
            />
            <Stack direction="row" spacing={2}>
                <Button variant="contained" sx={{width: "12rem"}} color="secondary" onClick={handleSignup}>Signup</Button>
                <Button variant="contained" sx={{width: "12rem"}} onClick={handleLogin}>Login</Button>
            </Stack>
            {errorMessage && <Typography color="error">{errorMessage}</Typography>}
        </Stack>
    )
}