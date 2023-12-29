import PropTypes from 'prop-types';
import { Box, Card, CardContent, Typography, CircularProgress } from '@mui/material';

const VideoDisplay = ({ getReferenceVideo, getVideo, getCanvas, videoLoaded, referenceVideoLoaded }) => {
    return (
        <Box
          display="flex"
          flexDirection="row"
          alignItems="center"
          justifyContent="center"
          mb={1}
          gap={2}
        >
            <Card>
                <CardContent style={{ position: 'relative' }}>
                    <Typography variant="h6" gutterBottom>
                        Reference Exercise Feed
                    </Typography>
                    {!referenceVideoLoaded &&
                        <CircularProgress style={{ position: 'absolute', top: '50%', left: '45%', transform: 'translate(-50%, -50%)' }} />
                    }
                     <video 
                        ref={getReferenceVideo} 
                        id="webcam" 
                        style={{
                            width:"416px", 
                            height:"312px", 
                            visibility: !referenceVideoLoaded ? "hidden" : "visible"
                        }} 
                    />
                </CardContent>
            </Card>
            <Card>
            <CardContent style={{ position: 'relative' }}>
                <Typography variant="h6" gutterBottom>
                    Live Exercise Feed
                </Typography>
                {!referenceVideoLoaded &&
                    <CircularProgress style={{ position: 'absolute', top: '50%', left: '45%', transform: 'translate(-50%, -50%)' }} />
                }
                <canvas 
                    ref={getCanvas} 
                    id="canvas" 
                    style={{
                        width:"416px",
                        height:"312px",
                        visibility: !referenceVideoLoaded ? "hidden" : "visible"
                    }} 
                />
                <video ref={getVideo} playsInline id="video" style={{display: "none", width:"416px", height:"312px"}} />
            </CardContent>
            </Card>
        </Box>
    );
};

VideoDisplay.propTypes = {
    getReferenceVideo: PropTypes.func.isRequired,
    getVideo: PropTypes.func.isRequired,
    getCanvas: PropTypes.func.isRequired,
    videoLoaded: PropTypes.bool.isRequired,
    referenceVideoLoaded: PropTypes.bool.isRequired,
};

export default VideoDisplay;