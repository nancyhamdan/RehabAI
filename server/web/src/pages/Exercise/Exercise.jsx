import * as poseDetection from '@tensorflow-models/pose-detection';
import * as tf from '@tensorflow/tfjs';
import { useRef, useState, useEffect } from 'react'
//import backend from '@tensorflow/tfjs-backend-webgl'
import Webcam from 'react-webcam'
import {RendererCanvas2d} from './renderer_canvas2d';

// 33.3333333

import './Exercise.css'

const videoConstraints = {
    width: 640,
    height: 480,
    facingMode: "user",
    frameRate: {ideal: 30, max: 60}
  };


function Exercise() {
  const webcamRef = useRef(null)
  const canvasRef = useRef(null)
  const detectorRef = useRef(null)
  const rendererRef = useRef(null)

  const [isStartPose, setIsStartPose] = useState(false)
  const [jointPositions, setJointPositions] = useState([])

  useEffect(() => {
    // try {
    //     setupCamera()
    // } catch (error) {
    //     throw new Error(
    //       'This browser does not support video capture, or this device does not have a camera'
    //     )
    // }
  
    try {
        setUpMovenet()
    } catch (error) {
        throw new Error('Movenet failed to load')
    }

  }, []);
/*
  const setupCamera = () => {
    if (
        typeof webcamRef.current == "undefined" ||
        webcamRef.current == null
      ) {
      throw new Error(
        'Webcam undefined'
      )
    }
    // Get Video Properties
    const videoWidth = webcamRef.current.video.videoWidth;
    const videoHeight = webcamRef.current.video.videoHeight;

    // Set video width
    webcamRef.current.video.width = videoWidth;
    webcamRef.current.video.height = videoHeight;

    canvasRef.current.width = webcamRef.current.video.width;
    canvasRef.current.height = webcamRef.current.video.height;
    rendererRef.current = new RendererCanvas2d(canvasRef.current);
  } */


  const setUpMovenet = async () => {
    const detectorConfig = {modelType: poseDetection.movenet.modelType.SINGLEPOSE_THUNDER};
    await tf.ready()
    detectorRef.current = await poseDetection.createDetector(poseDetection.SupportedModels.MoveNet, detectorConfig);
    console.log(detectorRef.current)
    console.log("Movenet Successfully setup")
  } 

  async function renderResult() {
    if (webcamRef.current.video.readyState < 2) {
      await new Promise((resolve) => {
        webcamRef.current.video.onloadeddata = () => {
          resolve(webcamRef.current.video);
        };
      });
    }
  
    let poses = null;
  
    // Detector can be null if initialization failed (for example when loading
    // from a URL that does not exist).
    if (detectorRef.current != null) {
      // Detectors can throw errors, for example when using custom URLs that
      // contain a model that doesn't provide the expected output.
      if (
        typeof webcamRef.current !== "undefined" &&
        webcamRef.current !== null &&
        webcamRef.current.video.readyState === 4
      ) {
        console.log("webcam current not null")
        // await new Promise((resolve) => {
        //   webcamRef.current.video.onloadeddata = () => {
        //     resolve(webcamRef.current.video);
        //   };
        // });
        
        // Get Video Properties
        const videoWidth = webcamRef.current.video.videoWidth;
        const videoHeight = webcamRef.current.video.videoHeight;

        // Set video width
        webcamRef.current.video.width = videoWidth;
        webcamRef.current.video.height = videoHeight;

        canvasRef.current.width = webcamRef.current.video.width;
        canvasRef.current.height = webcamRef.current.video.height;
        rendererRef.current = new RendererCanvas2d(canvasRef.current);
        try {
            poses = detectorRef.current.estimatePoses(webcamRef.current.video, {flipHorizontal: false});
            const keypoints = poses[0].keypoints
            setJointPositions(prevJointPositions => [...prevJointPositions, keypoints])
            console.log(jointPositions)

            const rendererParams = [webcamRef.current.video, poses];
            rendererRef.current.draw(rendererParams);
        } catch (error) {
          detectorRef.current.dispose();
          detectorRef.current = null;
          console.log(error)
        }
      }
    }
  }
  
  async function renderPrediction() {
    await renderResult();
    if(isStartPose) {
        requestAnimationFrame(renderPrediction);
    }
  }

  function startExercise(){
    setIsStartPose(true) 
    renderPrediction()
  } 

  function stopExercise() {
    setIsStartPose(false)
    //cancelAnimationFrame()
  }

    

  if(isStartPose) {
    return (
      <div className="yoga-container">
        <div>
          <Webcam 
          id="webcam"
          ref={webcamRef}
          videoConstraints={videoConstraints}
          style={{
            position: 'absolute',
            left: 120,
            top: 200,
            padding: '0px',
          }}/>
          <canvas
            ref={canvasRef}
            id="my-canvas"
            width='640px'
            height='480px'
            style={{
              position: 'absolute',
              left: 120,
              top: 100,
              zIndex: 1
            }}
          ></canvas>
        </div>
        <button
          onClick={stopExercise}
          className="secondary-btn"  id="stop-btn"  
        >
            Stop Exercise
        </button>
      </div>
    )
  }

  return (
    <div
      className="yoga-container"
    >
      <button
          onClick={startExercise}
          className="secondary-btn"    
        >Start Exercise</button>
    </div>
  )
}

export default Exercise