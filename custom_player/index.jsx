import React, { useEffect, useReducer, useRef, useState } from "react";
import s from "./index.module.css";
import {
  ExpandIcon,
  MuteIcon,
  PauseIcon,
  PipCloseIcon,
  PipOpenIcon,
  PlayIcon,
  RestartIcon,
  SettingsIcon,
  ShrinkIcon,
  UnMuteIcon,
} from "./icons";
import useVideoPlayer from "./useVideoPlayer";

const CustomPlayer = ({ url, poster }) => {
  const containerRef = useRef(null);
  
/** @param {React.MutableRefObject<HTMLVideoElement>} videoRef  */
  const videoRef = useRef(null);
  const timerRef = useRef(null);

  /** @param {Object} playerState */
  const {
    playerState,
    duration,
    volume,
    progress,
    formattedDuration,
    formattedTime,
    toggleFullScreen,
    toggleMute,
    togglePlay,
    handleOnCanPlay,
    handleOnTimeUpdate,
    handleVideoEnded,
    handleVideoProgress,
    togglePipMode,
    handleVolumeChange,
  } = useVideoPlayer(videoRef, containerRef);

  const handleOpenFullScreen = () => {
    const container = containerRef.current;
    if (!container) return;
    if (container.requestFullScreen) {
      container.requestFullScreen();
    } else if (container.webkitRequestFullScreen) {
      container.webkitRequestFullScreen();
    } else if (container.mozRequestFullScreen) {
      container.mozRequestFullScreen();
    }
    toggleFullScreen()
  };
  const handleCloseFullscreen = () => {
    if (document.exitFullscreen) {
      document.exitFullscreen();
    } else if (document.webkitExitFullscreen) {
      /* Safari */
      document.webkitExitFullscreen();
    } else if (document.msExitFullscreen) {
      /* IE11 */
      document.msExitFullscreen();
    }
  };

  const onMouseEnter = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    const container = containerRef.current;
    if (!container) return;
    const sticky = container.getAttribute("data-sticky-controls");
    if (sticky === "false") {
      container.setAttribute("data-sticky-controls", "true");
    }
  };

  const onMouseLeave = () => {
    const container = containerRef.current;
    if (!container) return;
    const sticky = container.getAttribute("data-sticky-controls");
    const mousePos = container.getAttribute("data-mouse");
    if (sticky === "true") {
      container.setAttribute("data-sticky-controls", "false");
    }
    if (mousePos === "inside") {
      timerRef.current = setTimeout(() => {
        container.setAttribute("data-mouse", "outside");
      }, 4000);
    }
  };

  useEffect(() => {
    const container = containerRef.current;
    const videoNotPlaying = !playerState.isPlaying
    if (!container || videoNotPlaying) return;

    let controls = container.querySelector('div[data-elem="control"]');
    let timeOutId;

    const mouseMoveHandler = () => {
      const mousePos = container.getAttribute("data-mouse");
      if (mousePos === "outside") {
        container.setAttribute("data-mouse", "inside");
      }
    };
    const transitionEndHandler = () => {
      const mousePos = container.getAttribute("data-mouse");
      if (mousePos === "inside") {
        timeOutId = setTimeout(() => {
          const sticky = container.getAttribute("data-sticky-controls");
          if (sticky === "true") return;
          container.setAttribute("data-mouse", "outside");
        }, 4000);
      }
    };
    container.addEventListener("mousemove", mouseMoveHandler);
    controls.addEventListener("transitionend", transitionEndHandler);

    return () => {
      container.removeEventListener("mousemove", mouseMoveHandler);
      controls.removeEventListener("transitionend", transitionEndHandler);
      clearTimeout(timeOutId);
    };
  }, [containerRef, playerState]);

  const showControls = !playerState.isPlaying || playerState.isVideoEnded;
  useEffect(() => {
    videoRef.current?.load()
  }, [url])
  return (
    <div
      className={s.container}
      ref={containerRef}
      data-mouse="outside"
      data-sticky-controls="false"
    >
      <div className={s.screen}>
        <video
          autoPlay={true}
          width="100%"
          height="auto"
          preload="auto"
          ref={videoRef}
          poster={poster}
          onCanPlay={handleOnCanPlay}
          onTimeUpdate={handleOnTimeUpdate}
          onEnded={handleVideoEnded}
        >
          <source src={url} type="video/mp4" />
          <source src={url} type="video/webm" />
          <source src={url} type="video/ogg" />
          <source src={url} type="video/mkv" />
          <source src={url} type="video/avi" />
          <p>
            Your browser doesn't support HTML video. Here is a
            <a href={url}>link to the video</a> instead.
          </p>
        </video>
      </div>
      <div
        className={`${s.controls} ${showControls ? s.show : ""}`}
        data-elem="control"
      >
        <div className={s.top} data-control="top">
          <div className={s.right}>
            <button>
              <SettingsIcon className={s.icon} />
            </button>
          </div>
        </div>
        <div className={s.middle} data-control="middle">
          <div style={{ width: "fit-content", paddingTop: "1.5rem" }}>
            {!playerState.isLoaded ? (
              <div className={s.spinner} />
            ) : playerState.isVideoEnded ? (
              <button onClick={togglePlay}>
                <RestartIcon className={`${s.icon} ${s.large}`} />
              </button>
            ) : (
              <button onClick={togglePlay}>
                {!playerState.isPlaying ? (
                  <PlayIcon className={`${s.icon} ${s.large}`} />
                ) : (
                  <PauseIcon className={`${s.icon} ${s.large}`} />
                )}
              </button>
            )}
          </div>
        </div>
        <div
          className={s.bottom}
          data-control="bottom"
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
        >
          <div className={s.timeProgress}>
            <label htmlFor="cvpVideoProgress">{formattedTime}</label>
            <input
              type="range"
              id="cvpVideoProgress"
              name="video-progress"
              className={s.progress}
              min="0"
              step="0.1"
              max={duration}
              value={progress}
              onChange={handleVideoProgress}
            />
            <label htmlFor="cvpVideoProgress">{formattedDuration}</label>
          </div>
          <div className={s.mainControls}>
            <div className={s.sub}>
              <button onClick={togglePlay}>
                {!playerState.isPlaying ? (
                  <PlayIcon className={s.icon} />
                ) : (
                  <PauseIcon className={s.icon} />
                )}
              </button>
              <button onClick={toggleMute}>
                {!playerState.isMuted ? (
                  <UnMuteIcon className={s.icon} />
                ) : (
                  <MuteIcon className={s.icon} />
                )}
              </button>
              <div className={s.volProgress}>
                <input
                  type="range"
                  id="volume"
                  name="volume"
                  className={s.progress}
                  min="0"
                  max="1"
                  step="0.001"
                  value={volume}
                  onChange={handleVolumeChange}
                />
              </div>
            </div>
            <div className={s.sub}>
              <button onClick={togglePipMode}>
                {!playerState.isPip ? (
                  <PipOpenIcon className={s.icon} />
                ) : (
                  <PipCloseIcon className={s.icon} />
                )}
              </button>

              {!playerState.isFullScreen ? (
                <button onClick={handleOpenFullScreen}>
                  <ExpandIcon className={s.icon} />
                </button>
              ) : (
                <button onClick={handleCloseFullscreen}>
                  <ShrinkIcon className={s.icon} />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomPlayer;
