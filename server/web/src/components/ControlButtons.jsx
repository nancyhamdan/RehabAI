import PropTypes from 'prop-types';
import { Button } from '@mui/material';

const ControlButtons = ({ handleStartExercise, handleStopExercise }) => {
    return (
        <div>
            <Button variant="contained" color="primary" onClick={handleStartExercise} sx={{ mr: 1 }}>
                Start Exercise
            </Button>
            <Button variant="contained" color="secondary" onClick={handleStopExercise}>
                Stop Exercise
            </Button>
        </div>
    );
};

ControlButtons.propTypes = {
    handleStartExercise: PropTypes.func.isRequired,
    handleStopExercise: PropTypes.func.isRequired,
};

export default ControlButtons;