import {Component} from 'react'
import PropTypes from 'prop-types';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {RendererCanvas2d} from './renderer_canvas2d';

class Exercise extends Component {
  static defaultProps = {
    videoWidth: 640,
    videoHeight: 480,
    flipHorizontal: true,
    showVideo: true,
    loadingText: 'Loading...please be patient...'
  }

  constructor(props) {
    super(props, Exercise.defaultProps)
  }

  getCanvas = elem => {
    this.canvas = elem
  }

  getVideo = elem => {
    this.video = elem
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
        height: videoHeight
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

  render() {
    return (
      <div>
        <div>
          <video id="videoNoShow" playsInline ref={this.getVideo} style={{visibility:"hidden", display:"none"}} />
          <canvas className="webcam" ref={this.getCanvas}/>
        </div>
      </div>
    )
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