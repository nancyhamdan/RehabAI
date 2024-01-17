// Importing necessary libraries and components
import {Component} from 'react'
import PropTypes from 'prop-types'
import * as tf from '@tensorflow/tfjs'
import '@tensorflow/tfjs-backend-webgl'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { DataFrame } from 'pandas-js'

// Custom components
import { Box } from '@mui/material';
import ControlButtons from '../../components/ControlButtons';
import FeedbackDisplay from '../../components/FeedbackDisplay.jsx';
import TimeDisplay from '../../components/TimeDisplay';
import TopBar from '../../components/TopBar.jsx'
import VideoDisplay from '../../components/VideoDisplay';

// Renderer and utility functions
import {RendererCanvas2d} from './renderer_canvas2d'
import { csvToJSON } from './utils'

// Higher order component for routing
import {withRouter} from './withRouter.jsx'

// API functions
import { api } from '../../api';

// CSS styles
//import './Exercise.css';

class Exercise extends Component {
  // Default properties for the Exercise component
  static defaultProps = {
    videoWidth: 640,
    videoHeight: 480,
    flipHorizontal: false,
    flipVertical: false,
    showVideo: true,
    loadingText: 'Loading...please be patient...',
  }

  constructor(props) {
    super(props, Exercise.defaultProps)
    // Initial state of the component
    this.state = {
      isSaving: false,
      isExerciseFinished: false,
      startTime: null,
      elapsedTime: 0,
      lastExerciseElapsedTime: 0,
      exerciseDf: new DataFrame(), // DataFrame to store exercise data
      keypoint_dict: { // Dictionary to map keypoints to their indices
        'nose': 0,
        'left_eye': 1,
        'right_eye': 2,
        'left_ear': 3,
        'right_ear': 4,
        'left_shoulder': 5,
        'right_shoulder': 6,
        'left_elbow': 7,
        'right_elbow': 8,
        'left_wrist': 9,
        'right_wrist': 10,
        'left_hip': 11,
        'right_hip': 12,
        'left_knee': 13,
        'right_knee': 14,
        'left_ankle': 15,
        'right_ankle': 16
      },
      referenceVideo: null,
      referenceVideoPlaying: false,
      referenceDF: null, // DataFrame to store reference data
      feedbackMessages: [], // Array to store all feedback messages
      currentFeedbackMessages: [], // Array to store current feedback messages
      videoLoaded: false,
      referenceVideoLoaded: false,
      clinicalScore: null,
    }
  }

  getCanvas = elem => {
    this.canvas = elem
  }

  getVideo = elem => {
    this.video = elem
  }

  getReferenceVideo = elem => {
    this.referenceVideo = elem
  }

  // Method to setup the camera, pose detector, and renderer upon component mount
  async componentDidMount() {
    try {
      await this.setupCamera()
    } catch (error) {
      throw new Error(
        'This browser does not support video capture, or this device does not have a camera'
      )
    }

    try {
      const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER}
      
      // Set the tf backend
      console.log("awaiting tf")
      await tf.setBackend('webgl')
      await tf.ready()
      console.log("using tf backend:", tf.getBackend());
      console.log("tf setup")

      // Load the MoveNet pose detector
      this.movenet = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig)
      console.log("movenet setup")

      // Create an instance of the canvas renderer
      this.renderer = new RendererCanvas2d(this.canvas)
      console.log("renderer setup")
    } catch (error) {
      throw new Error(error)
    }

    this.detectPose()
    this.loadReferenceVideo()
    this.loadReferenceJointPositions()
  }

  // Method to setup the camera
  async setupCamera() {
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error(
        'Browser API navigator.mediaDevices.getUserMedia not available'
      )
    }
    const {videoWidth, videoHeight} = this.props
    const video = this.video
    video.width = videoWidth
    video.height = videoHeight

    // Get the video stream from the webcam
    const stream = await navigator.mediaDevices.getUserMedia({
      audio: false,
      video: {
        facingMode: 'user',
        width: videoWidth,
        height: videoHeight,
        frameRate: {
          ideal: 30,
        }
      }
    })

    video.srcObject = stream

    // Return a promise that resolves when the video is loaded
    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play()
        resolve(video)
        this.setState({ videoLoaded: true })
      }
    })
  }

  // Method to load the reference video
  loadReferenceVideo = async () => {
    const referenceVideo = this.referenceVideo
    const exerciseInfo = this.props.router.location.state.exercise
    console.log(exerciseInfo)
    referenceVideo.src = exerciseInfo.video_url
    await this.referenceVideo.load()
    referenceVideo.loop = true
    referenceVideo.addEventListener('ended', this.handleReferenceVideoEnded)
    this.setState({ referenceVideoLoaded: true })
  }

  // Method to load the reference joint positions from the CSV file
  loadReferenceJointPositions = async () => {
    try {
      const exerciseInfo = this.props.router.location.state.exercise
      console.log(exerciseInfo)
      const response = await fetch(exerciseInfo.csv)
      const csvText = await response.text()
      const referenceJointPositions = csvToJSON(csvText)
      const referenceDF = new DataFrame(referenceJointPositions)
      this.setState({ referenceDF })
      console.log(referenceDF.to_json({orient: 'columns'}))
    } catch (error) {
      console.error('Error loading reference joint positions:', error)
    }
  }

  detectPose() {
    const {videoWidth, videoHeight} = this.props
    const canvas = this.canvas
    const canvasContext = canvas.getContext('2d')

    canvas.width = videoWidth
    canvas.height = videoHeight

    this.poseDetectionFrame(canvasContext)
  }

  // Method to detect pose in each frame
  poseDetectionFrame(canvasContext) {
    const {
      flipHorizontal,
      flipVertical,
      videoWidth,
      videoHeight, 
      showVideo, 
      } = this.props

    const movenetModel = this.movenet
    const video = this.video
    
    // Function to find pose in each frame
    const findPoseDetectionFrame = async () => {
      let poses = null

      // Estimate poses in the current video frame
      poses = await movenetModel.estimatePoses(video, {flipHorizontal: flipHorizontal, flipVertical: flipVertical})
      
      let normalizedKeypoints = null
      if(poses[0]) {
        // Convert keypoints to normalized keypoints
        normalizedKeypoints = poseDetection.calculators.keypointsToNormalizedKeypoints(poses[0].keypoints, video);
      }
      
      // If the exercise data is being saved, populate the DataFrame
      if (this.state.isSaving) {
        if(poses[0]) {
          this.populateDataFrame(normalizedKeypoints)
        }
        if (!this.state.startTime) {
          this.setState({ startTime: Date.now() }) // start timer when saving begins
        } else {
          this.setState({ elapsedTime: (Date.now() - this.state.startTime) / 1000 }) // update elapsed time in seconds
        }
      } else {
        this.setState({ lastExerciseElapsedTime: this.state.elapsedTime })
        this.setState({ startTime: null, elapsedTime: 0 }) // reset timer when saving stops
      }

      canvasContext.clearRect(0, 0, videoWidth, videoHeight)

      if (showVideo) {
        canvasContext.save()
        // Scale and translate the canvas context to flip the video
        canvasContext.scale(-1, 1)
        canvasContext.translate(-videoWidth, 0)
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight) // Draw the video on the canvas
        this.renderer.drawResults(poses) // Draw the detected poses on the canvas
        canvasContext.restore()
      }
      // Request the next animation frame
      requestAnimationFrame(findPoseDetectionFrame)
    } 
    // Call the function to start pose detection
    findPoseDetectionFrame()
  }

  // Method to populate the DataFrame with keypoints
  populateDataFrame(keypoints) {
    const frameData = {}

    for (const [jointName, jointIndex] of Object.entries(this.state.keypoint_dict)) {
      const keypoint = keypoints[jointIndex]
      frameData[jointName + '_x'] = keypoint.x
      frameData[jointName + '_y'] = keypoint.y
      frameData[jointName + '_confidence'] = keypoint.score
    }
    const frameDataFrame = new DataFrame([frameData])
    this.setState({ exerciseDf: this.state.exerciseDf.append(frameDataFrame, true) }, () => {
      // If the length of the exercise DataFrame is a multiple of 30 (one sec passed if fps=30)
      if(this.state.exerciseDf.length >= 30 && this.state.exerciseDf.length % 30 === 0) {
        // Compare the current joint positions with the reference
        this.compareJointsWithReference()
      }
    });
  }

  // Method to get the DTW value between the current and reference joint values
  getDTWCost = async (currentJointValues, referenceJointValues) => {
    // Get the exercise information from the router state
    const exerciseInfo = this.props.router.location.state.exercise
    
    try {
      const response = await api.post(`/api/feedback/${exerciseInfo.exercise_id}/`, {
        referenceJointValues: referenceJointValues,
        currentJointValues: currentJointValues
      })

      console.log(response.data)

      if (response.data) {
        console.log(response.data.feedback_dtw[0])
        return response.data.feedback_dtw[0]
      } else {
        console.error('No data returned from DTW API')
      }
    } catch (error) {
      console.error('Failed to fetch dtw:', error)
    }
   }
  
  // Method to compare the current joint positions with the reference
  compareJointsWithReference =  async () => {
    const currentJointPositions = this.state.exerciseDf; 
    const currentFrameIndex = currentJointPositions.length - 1; // Index of the current frame
    const referenceFrames = this.state.referenceDF.iloc([0, currentFrameIndex + 1]);

    let currentFeedbackMessages = [];
    console.log("frame", currentJointPositions.length, ":")
    for (const [jointName, jointIndex] of Object.entries(this.state.keypoint_dict)) {
      // Comparing important joints only
      if (jointIndex <= 4 || jointIndex > 12) {
        continue;
      }

      const jointNameWithSpaces = jointName.replace(/_/g, ' ');

      // Compare the x-coordinates of the current joint and the reference joint
      const col_x = jointName + '_x'
      const currentJointXValues = currentJointPositions.get(col_x).values.toArray();
      const referenceJointXValues = referenceFrames.get(col_x).values.toArray();

      const costX = await this.getDTWCost(currentJointXValues, referenceJointXValues);
      console.log(`cost ${jointName}_x = ${costX}`)
      // If the cost (dissimilarity) is greater than 2.5, add feedback message
      if (costX > 2.5) {
        currentFeedbackMessages.push({message: `Adjust your ${jointNameWithSpaces} horizontally`, index: this.state.feedbackMessages.length})
      }

      // Compare the y-coordinates of the current joint and the reference joint
      const col_y = jointName + '_y'
      const currentJointYValues = currentJointPositions.get(col_y).values.toArray();
      const referenceJointYValues = referenceFrames.get(col_y).values.toArray();

      const costY = await this.getDTWCost(currentJointYValues, referenceJointYValues);
      console.log(`cost ${jointName}_y = ${costY}`)
      // If the cost (dissimilarity) is greater than 2.5, add feedback message
      if (costY > 2.5) {
        currentFeedbackMessages.push({message: `Adjust your ${jointNameWithSpaces} vertically`, index: this.state.feedbackMessages.length})
      }
    }
    this.setState(prevState => ({
      currentFeedbackMessages: currentFeedbackMessages,
      feedbackMessages: [...prevState.feedbackMessages, ...currentFeedbackMessages]
    }));
    console.log(" ")
  }

  // Method to fetch the clinical score for the exercise
  fetchClinicalScore = async () => {
    const feedbackThreshold = 75
    if (this.state.feedbackMessages.length > feedbackThreshold) {
      this.setState({ clinicalScore: 100 });
    } else {
      // Get the exercise information from the router location state
      const exerciseInfo = this.props.router.location.state.exercise
      const exerciseId = exerciseInfo.exercise_id
      console.log("Sending exercise id", exerciseId)
      try {
        const response = await api.post(`/api/clinical_score/${exerciseId}`, {
          csvString: this.state.exerciseDf.to_csv(),
        })
        if (response.data) {
          this.setState({ clinicalScore: response.data.clinical_score[0][0] })
          console.log(response.data.clinical_score[0][0])
        } else {
          console.error('No data returned from API')
        }
      } catch (error) {
        console.error('Failed to fetch clinical score:', error)
      }
    }
  }

  handleStartExercise = () => {
    // Start a 10 second countdown
    let countdown = 10;
    this.setState({ countdown });
    
    // Create an interval that decreases the countdown every second
    const countdownInterval = setInterval(() => {
      countdown--;
      this.setState({ countdown });
      
      // If the countdown reaches 0, clear the interval and start the exercise
      if (countdown < 0) {
        clearInterval(countdownInterval);
        this.setState({ isSaving: true, isExerciseFinished: false, exerciseDf: new DataFrame(), currentFeedbackMessages: [], feedbackMessages: [], clinicalScore: null })
        
        // If a reference video exists, start playing it
        if (this.referenceVideo) {
          this.setState({ referenceVideoPlaying: true, referenceVideoTime: 0 })
          this.referenceVideo.play().catch((error) => {
            console.error('Error playing reference video:', error)
          })
        }

        // Stop the exercise after 30 seconds
        const exerciseTimer = setTimeout(() => {
          this.handleStopExercise();
        }, 30000);
        this.setState({ exerciseTimer }); // Save the timer ID in the state so it can be cleared later
      }
    }, 1000);
  }

  handleStopExercise = async () => {
    // Set the final elapsed time and reset the countdown and isSaving state
    this.setState({ isSaving: false, finalElapsedTime: this.state.elapsedTime, countdown: null })
    
    // Clear the exercise timer
    if (this.state.exerciseTimer) {
      clearTimeout(this.state.exerciseTimer);
      this.setState({ exerciseTimer: null });
    }

    // Convert the exercise data frame to JSON and log it
    const json_joints = this.state.exerciseDf.to_json({orient: 'columns'})
    console.log(json_joints)
    console.log("total frames", this.state.exerciseDf.length)
    
    // Stop the reference video
    if (this.referenceVideo) {
      this.setState({ referenceVideoPlaying: false })
      this.referenceVideo.pause()
      this.referenceVideo.currentTime = 0
    }
    this.setState({ isExerciseFinished: true });
    this.fetchClinicalScore();
  }

  handleReferenceVideoEnded = () => {
    if (this.referenceVideoPlaying) {
      this.referenceVideo.play()
    }
  }

  render() {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100vh', overflow: "hidden" }}>
        <TopBar />
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          mt={4}
          gap={2}
        >
          <VideoDisplay 
            getReferenceVideo={this.getReferenceVideo}
            getVideo={this.getVideo}
            getCanvas={this.getCanvas}
            videoLoaded={this.state.videoLoaded}
            referenceVideoLoaded={this.state.referenceVideoLoaded}
          />
          <ControlButtons 
            handleStartExercise={this.handleStartExercise}
            handleStopExercise={this.handleStopExercise}
          />
          <TimeDisplay 
            isSaving={this.state.isSaving}
            finalElapsedTime={Number(this.state.finalElapsedTime) ? Number(this.state.finalElapsedTime.toFixed(2)) : 0}
            elapsedTime={Number(this.state.elapsedTime) ? Number(this.state.elapsedTime.toFixed(2)) : 0}
            countdown={this.state.countdown}
          />
          <FeedbackDisplay
            isSaving={this.state.isSaving}
            currentFeedbackMessages={this.state.currentFeedbackMessages}
            feedbackMessages={this.state.feedbackMessages} 
            isExerciseFinished={this.state.isExerciseFinished}
            clinicalScore={this.state.clinicalScore} 
          />
        </Box>
      </div>
    )
  }
}

Exercise.propTypes = {
    videoWidth: PropTypes.number,
    videoHeight: PropTypes.number,
    flipHorizontal: PropTypes.bool,
    flipVertical: PropTypes.bool,
    showVideo: PropTypes.bool,
    loadingText: PropTypes.string,
    router: PropTypes.shape({
      location: PropTypes.shape({
          state: PropTypes.shape({
              exercise: PropTypes.object.isRequired,
          }).isRequired,
      }).isRequired,
  }).isRequired,
}

export default withRouter(Exercise);