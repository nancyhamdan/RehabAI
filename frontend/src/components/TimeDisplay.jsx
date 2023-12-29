import PropTypes from 'prop-types';
import { Typography } from '@mui/material';

const TimeDisplay = ({ isSaving, finalElapsedTime, elapsedTime }) => {
    return (
        <div>
            {isSaving ? (
                <Typography variant="h6" component="div">
                    Elapsed time: {elapsedTime}
                </Typography>
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
};

export default TimeDisplay;