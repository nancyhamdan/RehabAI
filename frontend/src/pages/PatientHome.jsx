import { useState, useEffect } from 'react';
import { Box, Grid, Card, CardActionArea, CardMedia, CardContent, Typography } from '@mui/material';
import TopBar from '../components/TopBar.jsx'
import { Link } from 'react-router-dom';
import { api } from '../api';

export default function PatientHome() {
    const [assignedExercises, setAssignedExercises] = useState([]);

    // Fetch the exercises assigned to the patient
    useEffect(() => {
        api.get('/api/exercises/')
            .then(res => setAssignedExercises(res.data))
            .catch(err => console.error(err));
    }, [])

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow:"hidden" }}>
            <TopBar />
            <Box sx={{ padding: '2em', overflow: 'auto', flexGrow: 1, height: '1' }}>
                <Typography
                    gutterBottom
                    variant="body2" 
                    component="div" 
                    style={{ textAlign: 'center', fontSize: '2rem', marginBottom: '1em' }}
                >
                    Assigned Exercises
                </Typography>
                <Grid container spacing={3}>
                {assignedExercises.map((exercise, index) => {
                    return (
                        <Grid item xs={12} sm={6} md={3} key={index}>
                            <Card 
                                raised
                                sx={{
                                    maxWidth: 280,
                                    maxHeight: 300,
                                    margin: "0 auto",
                                    padding: "1em",
                                }}
                            >
                                <Link 
                                    to={`/exercises/${exercise.id}`}
                                    state={{exercise}}
                                    style={{ all:'unset' }}
                                >
                                    <CardActionArea> 
                                        <CardMedia
                                            component="img"
                                            height="250"
                                            sx={{ objectFit: "contain" }}
                                            image={exercise.image_url}
                                            alt={exercise.name}
                                        />
                                        <CardContent>
                                            <Typography
                                                gutterBottom
                                                variant="body2" 
                                                component="div" 
                                                style={{ textAlign: 'center', fontSize: '1.5rem' }}
                                            >
                                                {exercise.name}
                                            </Typography>
                                        </CardContent>
                                    </CardActionArea>   
                                </Link>
                            </Card>
                        </Grid>
                    );
                })}
                </Grid>
            </Box>
        </div>
    );
}