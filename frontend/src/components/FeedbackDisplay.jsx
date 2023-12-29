import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';

const FeedbackDisplay = ({ currentFeedbackMessages, feedbackMessages, isExerciseFinished, clinicalScore }) => {
    return (
        <Box
          width="80%"
          height="100%"
          overflow="hidden"
        >
            {!isExerciseFinished && (
                <Box 
                display="flex" 
                flexDirection="row"
                overflow="auto" 
                width="100%"
                p={2}
                >
                    {currentFeedbackMessages.map((m, i) => (
                        <Box 
                        raised
                        key={i} 
                        component={Card} 
                        mx={1} 
                        flex="1 0 auto"
                        minWidth={250} 
                        >
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="h5">
                                    Feedback {i+1}
                                </Typography>
                                <Typography variant="h5" component="p">
                                    {m.message}
                                </Typography>
                            </CardContent>
                        </Box>
                    ))}
                </Box>
            )}
            {isExerciseFinished &&
                <Box style={{marginTop: 0}}>
                <Typography variant="h6" component="div" style={{ textAlign: "center" }}>
                    Your Predicted Clinical Score is {clinicalScore !== null ? clinicalScore : <CircularProgress />}
                </Typography>
                <Box 
                display="flex" 
                flexDirection="row" 
                overflow="auto" 
                width="100%"
                p={2}
                >
                    {feedbackMessages.map((m, i) => (
                        <Box
                        raised
                        key={i} 
                        component={Card} 
                        mx={1} 
                        flex="1 0 auto"
                        minWidth={250}
                        >
                            <CardContent>
                                <Typography color="textSecondary" gutterBottom variant="h5">
                                    Feedback {i+1}
                                </Typography>
                                <Typography variant="h5" component="p">
                                    {m.message}
                                </Typography>
                            </CardContent>
                        </Box>
                    ))}
                </Box>
                </Box>
            }
        </Box>
    );
};

FeedbackDisplay.propTypes = {
    currentFeedbackMessages: PropTypes.array.isRequired,
    feedbackMessages: PropTypes.array.isRequired,
    isExerciseFinished: PropTypes.bool.isRequired,
    clinicalScore: PropTypes.number,
};

export default FeedbackDisplay;