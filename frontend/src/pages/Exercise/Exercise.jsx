import {Component} from 'react'
import PropTypes from 'prop-types'
import * as tf from '@tensorflow/tfjs'
import * as poseDetection from '@tensorflow-models/pose-detection'
import { DataFrame } from 'pandas-js'
//import DTW from 'dtw';
//import axios from 'axios';

import { Box } from '@mui/material';
import ControlButtons from '../../components/ControlButtons';
import FeedbackDisplay from '../../components/FeedbackDisplay.jsx';
import TimeDisplay from '../../components/TimeDisplay';
import TopBar from '../../components/TopBar.jsx'
import VideoDisplay from '../../components/VideoDisplay';

import {RendererCanvas2d} from './renderer_canvas2d'
import { csvToJSON } from './utils'
import {withRouter} from './withRouter.jsx'
import { api } from '../../api';
import './Exercise.css';

class Exercise extends Component {
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
    this.state = {
      isSaving: false,
      isExerciseFinished: false,
      jointPositions: [],
      startTime: null,
      elapsedTime: 0,
      lastExerciseElapsedTime: 0,
      exerciseDf: new DataFrame(),
      keypoint_dict: {
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
      referenceDF: null,
      feedbackMessages: [],
      currentFeedbackMessages: [],
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
      console.log("awaiting tf")
      await tf.ready()
      console.log("tf setup")
      this.movenet = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig)
      console.log("movenet setup")

      this.renderer = new RendererCanvas2d(this.canvas)
      console.log("renderer setup")
    } catch (error) {
      throw new Error(error)
    } finally {
    //   setTimeout(() => {
    //     this.setState({loading: false})
    //   }, 200)
    }

    this.detectPose()
    this.loadReferenceVideo()
    this.loadReferenceJointPositions()
  }

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

    return new Promise(resolve => {
      video.onloadedmetadata = () => {
        video.play()
        resolve(video)
        this.setState({ videoLoaded: true })
      }
    })
  }

  loadReferenceVideo = async () => {
    const referenceVideo = this.referenceVideo
    const exerciseInfo = this.props.router.location.state.exercise
    console.log(exerciseInfo)
    referenceVideo.src = exerciseInfo.video_url
    await this.referenceVideo.load()
    //referenceVideo.width = this.props.videoWidth
    //referenceVideo.height = this.props.videoHeight
    referenceVideo.loop = true
    referenceVideo.addEventListener('ended', this.handleReferenceVideoEnded)
    this.setState({ referenceVideoLoaded: true })
  }

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

    const findPoseDetectionFrame = async () => {
      let poses = null

      poses = await movenetModel.estimatePoses(video, {flipHorizontal: flipHorizontal, flipVertical: flipVertical})
      
      let normalizedKeypoints = null
      if(poses[0]) {
        normalizedKeypoints = poseDetection.calculators.keypointsToNormalizedKeypoints(poses[0].keypoints, video);
      }
      
      if (this.state.isSaving) {
        if(poses[0]) {
          this.setState({ jointPositions: [...this.state.jointPositions, poses] })
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
        canvasContext.scale(-1, 1)
        canvasContext.translate(-videoWidth, 0)
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight)
        this.renderer.drawResults(poses)
        canvasContext.restore()
      }
      requestAnimationFrame(findPoseDetectionFrame)
    } 
    findPoseDetectionFrame()
  }

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
      if(this.state.exerciseDf.length >= 30 && this.state.exerciseDf.length % 30 === 0) {
        this.compareJointsWithReference()
      }
    });
  }

  getDTWCost = async (currentJointValues, referenceJointValues) => {
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
  
  compareJointsWithReference =  async () => {
    const currentJointPositions = this.state.exerciseDf; 
    const currentFrameIndex = currentJointPositions.length - 1; 
    const referenceFrames = this.state.referenceDF.iloc([0, currentFrameIndex + 1]);

    let currentFeedbackMessages = [];
    console.log("frame", currentJointPositions.length, ":")
    for (const [jointName, jointIndex] of Object.entries(this.state.keypoint_dict)) {
      if (jointIndex <= 4 || jointIndex > 12) {
        continue;
      }

      const jointNameWithSpaces = jointName.replace(/_/g, ' ');

      const col_x = jointName + '_x'
      const currentJointXValues = currentJointPositions.get(col_x).values.toArray();
      const referenceJointXValues = referenceFrames.get(col_x).values.toArray();

      // const dtwX = new DTW();
      //const costX = dtwX.compute(currentJointXValues, referenceJointXValues);
      const costX = await this.getDTWCost(currentJointXValues, referenceJointXValues);
      console.log(`cost ${jointName}_x = ${costX}`)
      if (costX > 2.5) {
        currentFeedbackMessages.push({message: `Adjust your ${jointNameWithSpaces} horizontally`, index: this.state.feedbackMessages.length})
      }

      const col_y = jointName + '_y'
      const currentJointYValues = currentJointPositions.get(col_y).values.toArray();
      const referenceJointYValues = referenceFrames.get(col_y).values.toArray();

      //const dtwY = new DTW();
      //const costY = dtwY.compute(currentJointYValues, referenceJointYValues);
      const costY = await this.getDTWCost(currentJointYValues, referenceJointYValues);
      console.log(`cost ${jointName}_y = ${costY}`)
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

  fetchClinicalScore = async () => {
    const exerciseInfo = this.props.router.location.state.exercise
    const exerciseId = exerciseInfo.exercise_id
    console.log("Sending exercise id", exerciseId)
    try {
      const response = await api.post(`/api/clinical_score/${exerciseId}`, {
        csvString: this.state.exerciseDf.to_csv(),
      })
      if (response.data) {
        this.setState({ clinicalScore: response.data.clinical_score[0] })
      } else {
        console.error('No data returned from API')
      }
    } catch (error) {
      console.error('Failed to fetch clinical score:', error)
    }
  }

  handleStartExercise = () => {
    this.setState({ isSaving: true, isExerciseFinished: false, feedbackMessages: [] })

    if (this.referenceVideo) {
      this.setState({ referenceVideoPlaying: true, referenceVideoTime: 0 })
      this.referenceVideo.play().catch((error) => {
        console.error('Error playing reference video:', error)
      })
    }
  }

  handleStopExercise = async () => {
    this.setState({ isSaving: false, finalElapsedTime: this.state.elapsedTime })
    const json_joints = this.state.exerciseDf.to_json({orient: 'columns'})
    console.log(json_joints)
    console.log("total frames", this.state.exerciseDf.length)
    
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
          />
          <FeedbackDisplay
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