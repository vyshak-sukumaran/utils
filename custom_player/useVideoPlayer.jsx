import React, { useEffect, useRef, useState } from "react";
import { formatToMMSS } from "./formatToMMSS";

/** @param {React.MutableRefObject<HTMLVideoElement>} videoRef  */
/** @param {React.MutableRefObject<HTMLDivElement>} containerRef  */

const useVideoPlayer = (videoRef, containerRef) => {
  const timer2Ref = useRef(null);
  const [playerState, setPlayerState] = useState({
    isPlaying: false,
    isVideoEnded: false,
    isLoaded: false,
    isMuted: false,
    isFullScreen: false,
    isPip: false,
  });
  const [volume, setVolume] = useState(0.5);
  const [prevVolume, setPrevVolume] = useState(0.5);
  const [duration, setDuration] = useState(0);
  let [formattedDuration, setFormattedDuration] = useState("00:00");
  let [progress, setProgress] = useState(0);
  // let [speed, setSpeed] = useState(0);
  let [formattedTime, setFormattedTime] = useState("00:00");

  function togglePlay() {
    const video = videoRef.current;
    if (!video) return;

    if (playerState.isPlaying) {
      video.pause();
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
      if (timer2Ref.current) {
        clearTimeout(timer2Ref.current);
      }
    } else {
      video.play();
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: true,
      }));
      const container = containerRef.current;
      if (!container) return;
        const mousePos = container.getAttribute("data-mouse");
        if (mousePos === "inside") {
          timer2Ref.current = setTimeout(() => {
            container.setAttribute("data-mouse", "outside");
          }, 4000);
        }
    }
  }
  function toggleMute() {
    const video = videoRef.current;
    if (!video) return;
    if (video.muted) {
      video.muted = false;
      video.volume = prevVolume;
      setPlayerState((prev) => ({
        ...prev,
        isMuted: false,
      }));
    } else {
      setPrevVolume(video.volume || 0.5);
      video.muted = true;
      video.volume = 0;
      setPlayerState((prev) => ({
        ...prev,
        isMuted: true,
      }));
    }
  }
  
  function handleVolumeChange(e) {
    const video = videoRef.current;
    if (!video) return;
    let newValue = e.target.value;
    video.volume = newValue;
    setVolume(newValue);
  }
  function handleOnCanPlay() {
    const video = videoRef.current;
    if (!video) return;
    let duration = video.duration || 0;
    duration = duration.toFixed();
    setDuration(duration);
    let fmtDuration = formatToMMSS(duration);
    setFormattedDuration(fmtDuration);
    setPlayerState((prev) => ({
      ...prev,
      isLoaded: true,
    }));
  }
  function handleOnTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;
    let cur = video.currentTime;
    cur = cur.toFixed();
    setProgress(cur);
    let fmtTime = formatToMMSS(cur);
    setFormattedTime(fmtTime);
  }
  function handleVideoProgress(e) {
    const video = videoRef.current;
    if (!video) return;
    let newValue = e.target.value;
    video.currentTime = newValue;
    setProgress(newValue);
    if (newValue !== duration && playerState.isVideoEnded) {
      setPlayerState(prev => ({
        ...prev,
        isVideoEnded: false
      }))
    }
  }
  function handleVideoSpeed() {}
  function toggleFullScreen() {
    setPlayerState((prev) => ({
      ...prev,
      isFullScreen: !prev.isFullScreen,
    }));
  }
  function togglePipMode() {
    const video = videoRef.current;
    if (!video) return;
    if (document.pictureInPictureElement) {
      document.exitPictureInPicture();
      setPlayerState((prev) => ({
        ...prev,
        isPip: false,
      }));
    } else if (document.pictureInPictureEnabled) {
      video.requestPictureInPicture();
      setPlayerState((prev) => ({
        ...prev,
        isPip: true,
      }));
    }
  }
  function handleVideoEnded() {
    setPlayerState((prev) => ({
      ...prev,
      isVideoEnded: true,
      isPlaying: false,
    }));
  }
  //   useEffect(() => {
  //     if (!videoRef.current) return;
  //     const vid = videoRef.current;

  //     document.addEventListener("keydown", (event) => {
  //       if (event.key === "k" || event.key === " ") {
  //         togglePlay();
  //       }
  //     });
  //   }, [videoRef]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const enterPipHandler = () => {
      setPlayerState((prev) => ({
        ...prev,
        isPip: true,
      }));
    };
    const leavePipHandler = () => {
      setPlayerState((prev) => ({
        ...prev,
        isPip: false,
      }));
    };
    const playingHandler = () => {
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: true,
        isVideoEnded: false
      }));
    };
    const pauseHandler = () => {
      setPlayerState((prev) => ({
        ...prev,
        isPlaying: false,
      }));
    };

    video.addEventListener("enterpictureinpicture", enterPipHandler);
    video.addEventListener("leavepictureinpicture", leavePipHandler);
    video.addEventListener("playing", playingHandler);
    video.addEventListener("pause", pauseHandler);

    return () => {
      video.removeEventListener("enterpictureinpicture", enterPipHandler);
      video.removeEventListener("leavepictureinpicture", leavePipHandler);
      video.removeEventListener("playing", playingHandler);
      video.removeEventListener("pause", pauseHandler);
    };
  }, [videoRef]);

  useEffect(() => {
    const exitHandler = () => {
      if (
        !document.fullscreenElement &&
        !document.webkitIsFullScreen &&
        !document.mozFullScreen &&
        !document.msFullscreenElement
      ) {
        toggleFullScreen();
      }
    };
    document.addEventListener("fullscreenchange", exitHandler);
    document.addEventListener("webkitfullscreenchange", exitHandler);
    document.addEventListener("mozfullscreenchange", exitHandler);
    document.addEventListener("MSFullscreenChange", exitHandler);

    return () => {
      document.removeEventListener("fullscreenchange", exitHandler);
      document.removeEventListener("webkitfullscreenchange", exitHandler);
      document.removeEventListener("mozfullscreenchange", exitHandler);
      document.removeEventListener("MSFullscreenChange", exitHandler);
    };
  }, []);
  return {
    playerState,
    progress,
    volume,
    duration,
    formattedDuration,
    formattedTime,
    toggleFullScreen,
    toggleMute,
    togglePlay,
    handleOnCanPlay,
    handleOnTimeUpdate,
    handleVideoEnded,
    handleVideoProgress,
    handleVideoSpeed,
    togglePipMode,
    handleVolumeChange,
  };
};

export default useVideoPlayer;
