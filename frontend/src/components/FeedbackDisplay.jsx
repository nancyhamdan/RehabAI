import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';
import { green } from '@mui/material/colors'

const FeedbackDisplay = ({ isSaving, currentFeedbackMessages, feedbackMessages, isExerciseFinished, clinicalScore }) => {
    return (
        <Box
          width="80%"
          height="100%"
          overflow="hidden"
        >
            {!isExerciseFinished && isSaving && currentFeedbackMessages.length === 0 && (
                <Box 
                    raised
                    component={Card} 
                    mx={1} 
                    flex="0 0 auto"
                    display="flex" 
                    justifyContent="center" 
                    width="100%"
                    sx={{ bgcolor: green[500] }}
                >
                    <CardContent>
                        <Typography 
                            color="textSecondary" 
                            gutterBottom 
                            variant="h5"
                            align="center"
                            sx={{ color: '#fff' }}
                        >
                            Keep going!
                        </Typography>
                    </CardContent>
                </Box>
            )}
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
                {clinicalScore === null ? (
                    <Typography variant="h6" component="div" align="center">
                        Finding clinical score... <CircularProgress size={20} />
                    </Typography>
                ) : (
                    clinicalScore > 50 || clinicalScore < 0 ? (
                        <Typography variant="h6" component="div" align="center">
                            It appears that you had too many mistakes in your exercise. Please try again to get a clinical score.
                        </Typography>
                    ) : (
                        <Typography variant="h6" component="div" align="center">
                            Clinical Score: {clinicalScore.toFixed(2)}
                        </Typography>
                        )
                )}
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
isSaving: PropTypes.bool,
    currentFeedbackMessages: PropTypes.array.isRequired,
    feedbackMessages: PropTypes.array.isRequired,
    isExerciseFinished: PropTypes.bool.isRequired,
    clinicalScore: PropTypes.number,
};

export default FeedbackDisplay;