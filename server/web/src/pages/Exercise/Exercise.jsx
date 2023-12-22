import {Component} from 'react'
import PropTypes from 'prop-types';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {RendererCanvas2d} from './renderer_canvas2d';
import { DataFrame } from 'pandas-js';

class Exercise extends Component {
  static defaultProps = {
    videoWidth: 640,
    videoHeight: 480,
    flipHorizontal: true,
    showVideo: true,
    loadingText: 'Loading...please be patient...',
  }

  constructor(props) {
    super(props, Exercise.defaultProps)
    this.state = {
      isSaving: false,
      jointPositions: [],
      startTime: null,
      elapsedTime: 0,
      lastExerciseElapsedTime: 0,
      df: new DataFrame(),
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
      referenceVideoPlaying: false
    };
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
      const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
      await tf.ready()
      this.movenet = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
      console.log("movenet setup")

      this.renderer = new RendererCanvas2d(this.canvas);
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
      }
    })
  }

  loadReferenceVideo = async () => {
    const referenceVideo = this.referenceVideo;
    referenceVideo.src = '../public/E_ID15_Es1.mp4';
    await this.referenceVideo.load();
    referenceVideo.width = this.props.videoWidth; 
    referenceVideo.height = this.props.videoHeight;
    referenceVideo.loop = true; 
    referenceVideo.addEventListener('ended', this.handleReferenceVideoEnded);
  };

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
      videoWidth, 
      videoHeight, 
      showVideo, 
      } = this.props

    const movenetModel = this.movenet
    const video = this.video

    const findPoseDetectionFrame = async () => {
      let poses = null

      poses = await movenetModel.estimatePoses(video, {flipHorizontal: flipHorizontal, flipVertical: false})
      
      if (this.state.isSaving) {
        this.setState({ jointPositions: [...this.state.jointPositions, poses] });
        this.populateDataFrame(poses);
        if (!this.state.startTime) {
          this.setState({ startTime: Date.now() }); // start timer when saving begins
        } else {
          this.setState({ elapsedTime: (Date.now() - this.state.startTime) / 1000 }); // update elapsed time in seconds
        }
      } else {
        this.setState({ lastExerciseElapsedTime: this.state.elapsedTime })
        this.setState({ startTime: null, elapsedTime: 0 }); // reset timer when saving stops
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

  populateDataFrame(poses) {
    const frameData = {};

    for (const [jointName, jointIndex] of Object.entries(this.state.keypoint_dict)) {
      const keypoint = poses[0].keypoints[jointIndex];
      frameData[jointName + '_x'] = keypoint.x;
      frameData[jointName + '_y'] = keypoint.y;
      frameData[jointName + '_confidence'] = keypoint.score;
    }
    const frameDataFrame = new DataFrame([frameData])
    //console.log(frameDataFrame.to_json())
    this.setState({ df: this.state.df.append(frameDataFrame, true) })
  }

  handleStartExercise = () => {
    this.setState({ isSaving: true });

    if (this.referenceVideo) {
      this.setState({ referenceVideoPlaying: true, referenceVideoTime: 0 });
      this.referenceVideo.play().catch((error) => {
        console.error('Error playing reference video:', error);
      });
    }
  };

  handleStopExercise = async () => {
    this.setState({ isSaving: false, finalElapsedTime: this.state.elapsedTime });
    const json_joints = this.state.df.to_json({orient: 'index'})
    console.log(json_joints)
    //console.log(this.state.df.get("nose_x").toString())
    //console.log(this.state.df.get("left_eye_x").to_json())
    
    if (this.referenceVideo) {
      this.setState({ referenceVideoPlaying: false });
      this.referenceVideo.pause();
      this.referenceVideo.currentTime = 0;
    }
  };

  handleReferenceVideoEnded = () => {
    if (this.referenceVideoPlaying) {
      this.referenceVideo.play();
    }
  };

  render() {
    return (
      <div>
        <div>
          <video id="referenceVideo" ref={this.getReferenceVideo} />
          <video id="videoNoShow" playsInline ref={this.getVideo} style={{ visibility: 'hidden', display: 'none' }} />
          <canvas className="webcam" ref={this.getCanvas} />
        </div>
        <button onClick={this.handleStartExercise}>Start Exercise</button>
        <button onClick={this.handleStopExercise}>Stop Exercise</button>
        {!this.state.isSaving && this.state.finalElapsedTime ? (
          <div>Total Exercise Time: {this.state.finalElapsedTime.toFixed(2)} seconds</div>
        ) : (
          <div>Elapsed Time: {this.state.elapsedTime.toFixed(2)} seconds</div>
        )}
      </div>
    );
  }
}

Exercise.propTypes = {
    videoWidth: PropTypes.number,
    videoHeight: PropTypes.number,
    flipHorizontal: PropTypes.bool,
    showVideo: PropTypes.bool,
    loadingText: PropTypes.string
};

export default Exercise