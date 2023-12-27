import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography } from '@mui/material';

const FeedbackDisplay = ({ currentFeedbackMessages, feedbackMessages, isExerciseFinished }) => {
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
                <Box 
                display="flex" 
                flexDirection="row" 
                overflow="auto" 
                width="100%"
                p={2}
                >
                    {feedbackMessages.map((m, i) => (
                        <Box 
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
            }
        </Box>
    );
};

FeedbackDisplay.propTypes = {
    currentFeedbackMessages: PropTypes.array.isRequired,
    feedbackMessages: PropTypes.array.isRequired,
    isExerciseFinished: PropTypes.bool.isRequired,
};

export default FeedbackDisplay;