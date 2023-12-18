//import {drawKeyPoints, drawSkeleton} from './utils'
import {Component} from 'react'
import PropTypes from 'prop-types';
import * as tf from '@tensorflow/tfjs';
import * as poseDetection from '@tensorflow-models/pose-detection';
import {RendererCanvas2d} from './renderer_canvas2d';

class MoveNet extends Component {
  static defaultProps = {
    videoWidth: 900,
    videoHeight: 700,
    flipHorizontal: true,
    showVideo: true,
    showSkeleton: true,
    showPoints: true,
    minPoseConfidence: 0.1,
    minPartConfidence: 0.5,
    maxPoseDetections: 2,
    nmsRadius: 20,
    outputStride: 16,
    skeletonColor: '#ffadea',
    skeletonLineWidth: 6,
    loadingText: 'Loading...please be patient...'
  }

  constructor(props) {
    super(props, MoveNet.defaultProps)
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
      outputStride, 
      minPoseConfidence, 
      minPartConfidence, 
      videoWidth, 
      videoHeight, 
      showVideo, 
      showPoints, 
      showSkeleton, 
      skeletonColor, 
      skeletonLineWidth 
      } = this.props

    const movenetModel = this.movenet
    const video = this.video

    const findPoseDetectionFrame = async () => {
      let poses = null

      poses = await movenetModel.estimatePoses(
        video,
        {flipHorizontal: flipHorizontal,
         outputStride: outputStride
        }
        )

      canvasContext.clearRect(0, 0, videoWidth, videoHeight)

      if (showVideo) {
        
        canvasContext.save()
        //canvasContext.scale(-1, 1)
        //canvasContext.translate(-videoWidth, 0)
        canvasContext.drawImage(video, 0, 0, videoWidth, videoHeight)
        canvasContext.restore()
        this.renderer.drawResults(poses)
      }

      
      /*
      poses.forEach(({score, keypoints}) => {
        console.log(score, keypoints)
        if (score >= minPoseConfidence) {
          if (showPoints) {
            drawKeyPoints(
              keypoints,
              minPartConfidence,
              skeletonColor,
              canvasContext
            )
            //console.log("drawing keypoints...")
          }
          if (showSkeleton) {
            drawSkeleton(
              keypoints,
              minPartConfidence,
              skeletonColor,
              skeletonLineWidth,
              canvasContext
            )
            console.log("drawing skeleton...")
          }
        }
      })*/

      requestAnimationFrame(findPoseDetectionFrame)
    } 
    findPoseDetectionFrame()
  }

  render() {
    return (
      <div>
        <div>
          <video id="videoNoShow" playsInline ref={this.getVideo} style={{visibility:"hidden", display:"none"}} />
          <canvas className="webcam" ref={this.getCanvas} />
        </div>
      </div>
    )
  }
}

MoveNet.propTypes = {
    videoWidth: PropTypes.number,
    videoHeight: PropTypes.number,
    flipHorizontal: PropTypes.bool,
    showVideo: PropTypes.bool,
    showSkeleton: PropTypes.bool,
    showPoints: PropTypes.bool,
    minPoseConfidence: PropTypes.number,
    minPartConfidence: PropTypes.number,
    maxPoseDetections: PropTypes.number,
    nmsRadius: PropTypes.number,
    outputStride: PropTypes.number,
    skeletonColor: PropTypes.string,
    skeletonLineWidth: PropTypes.number,
    loadingText: PropTypes.string
};

export default MoveNet