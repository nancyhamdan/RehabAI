import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

const TimeDisplay = ({ isSaving, finalElapsedTime, elapsedTime, countdown }) => {
    return (
        <div>
            {isSaving ? (
                <Typography variant="h6" component="div">
                    Elapsed time: {elapsedTime}
                </Typography>
            ) : countdown !== null ? (
                countdown >= 0 ? (
                    <Typography variant="h6" component="div">
                        Countdown: {countdown}
                    </Typography>
                ) : null
            ) : (
                <Typography variant="h6" component="div">
                    Total elapsed time: {finalElapsedTime}
                </Typography>
            )}
        </div>
    );
};

TimeDisplay.propTypes = {
    isSaving: PropTypes.bool,
    finalElapsedTime: PropTypes.number,
    elapsedTime: PropTypes.number,
    countdown: PropTypes.number,
};

export default TimeDisplay;