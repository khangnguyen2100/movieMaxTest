/* eslint-disable react-hooks/exhaustive-deps */
import React, { useState, useRef, useEffect, memo, useCallback, useMemo } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Box,
} from "@chakra-ui/react";

import "@vime/core/themes/default.css";
import "@vime/core/themes/light.css";
import "./index.css";
import IconShow from "./IconShow";
import ModalPopup from "./ModalPopup";
import { Player, Hls } from "@vime/react";
import ControlBar from "./ControlBar";
import { movieDetailSelector } from "../../redux/selector";
import { getMovieMedia } from "../../services/movieMediaSlice";
function VideoPlayer({
  videoSource,
  poster,
  subtitlesLink,
  definitionList,
  handleClickEpisode,
}) {
  const player = useRef();
  const dispatch = useDispatch();
  const params = useParams();

  const [modalOpen, setModalOpen] = useState(false);
  const { category, id, episodeId = 0 } = params;
  const { movieDetail } = useSelector(movieDetailSelector);
  const [currentTime, setCurrentTime] = useState(0);

  const [videoSrc, setVideoSrc] = useState();
  useEffect(() => {
    setVideoSrc(videoSource);
  }, [videoSource]);
  const [playing, setPlaying] = useState(false);
  const [volume, setVolume] = useState(100);
  const [isMuted, setIsMuted] = useState(false);
  const isPlaying = useRef(playing);

  const [subtitlesIndex, setSubtitlesIndex] = useState(0);
  const [valueRate, setValueRate] = useState("1");
  const [definition, setDefinition] = useState(definitionList[0].code);

  const handlePlayerPress = (e) => {
    if (document.activeElement.tagName !== "INPUT") {
      switch (e.key) {
        case " ":
        case "k":
          e.preventDefault();
          app.playBack();
          break;

        case "ArrowRight":
          app.seekForward();
          break;

        case "ArrowLeft":
          app.seekBackward();
          break;
        case "ArrowUp":
          e.preventDefault();
          app.increaseVolume();
          break;

        case "ArrowDown":
          e.preventDefault();
          app.decreaseVolume();
          break;
        case "m": {
          app.muteVolume();
          break;
        }
        case "f": {
          app.enterFullScreen();
          break;
        }
        default:
          break;
      }
    }
  };
  const app = {
    playBack: function () {
      if (isPlaying.current) {
        player?.current?.pause();
      } else {
        player?.current?.play();
      }
    },
    seekForward: function () {
      setCurrentTime(player?.current?.currentTime + 10);
    },
    seekBackward: function () {
      setCurrentTime(player?.current?.currentTime - 10);
    },
    increaseVolume: function () {
      setVolume(player?.current?.volume + 10);
    },
    decreaseVolume: function () {
      setVolume(player?.current?.volume - 10);
    },
    muteVolume: function () {
      setIsMuted((isMuted) => !isMuted);
    },
    enterFullScreen: function () {
      if (player?.current?.isFullscreenActive) {
        player?.current?.exitFullscreen();
      } else {
        player?.current?.enterFullscreen();
      }
    },
    onPlayingUpdate: function (event) {
      setPlaying((prev) => {
        isPlaying.current = event.detail;
        return event.detail;
      });
    },
    onTimeUpdate: function (event) {
      setCurrentTime(event.detail);
      if (event.detail !== 0) {
        document.cookie = `currentTime=${event.detail}`;
      }
    },
    onSubtitlesIndexChange: function (event) {
      setSubtitlesIndex(event.target.value);
      player?.current?.setCurrentTextTrack(event.target.value);
    },
    onValueRateChange: function (event) {
      setValueRate(event.target.value);
    },
    handleClickPlayer: function (e) {
      if (e.target.id === "vm-player-1") {
        app.playBack();
      }
    },
    onDefinitionChange: function (event) {
      setDefinition(event.target.value);
      const episodeIdCurrent =
        episodeId !== 0 ? episodeId : movieDetail?.episodeVo?.[0]?.id;

      dispatch(
        getMovieMedia({
          path: `media/previewInfo`,
          params: {
            category,
            contentId: id,
            episodeId: episodeIdCurrent,
            definition: event.target.value,
          },
        })
      );
    },
    handleDispatchMedia: function () {
      dispatch(
        getMovieMedia({
          path: `media/previewInfo`,
          params: {
            category,
            contentId: id,
            episodeId:
              episodeId !== 0 ? episodeId : movieDetail?.episodeVo?.[0]?.id,
            definition: definition,
          },
        })
      );
    },
    onPlaybackEnded: function () {
      player?.current?.exitFullscreen();

      const length = movieDetail?.episodeVo?.length;
      if (movieDetail?.episodeVo?.[length - 1].id !== +episodeId)
        setModalOpen(!modalOpen);
    },
    goToNextEpisode: useCallback(function () {
      movieDetail?.episodeVo?.forEach((item, i) => {
        const nextEpisode = movieDetail?.episodeVo?.[i + 1];
        if ((i === 0 && episodeId === 0) || +episodeId === item.id) {
          handleClickEpisode(nextEpisode?.id, i + 1);
        }
      });
    },[movieDetail]),
    onError: function (info) {
      const type = info.detail.data.type;
      if (type !== "mediaError") {
        app.handleDispatchMedia();
        console.log("RELOAD...");
      }
    },
    getCookie: function (cname) {
      let name = cname + "=";
      let decodedCookie = decodeURIComponent(document.cookie);
      let ca = decodedCookie.split(";");
      for (let i = 0; i < ca.length; i++) {
        let c = ca[i];
        while (c.charAt(0) === " ") {
          c = c.substring(1);
        }
        if (c.indexOf(name) === 0) {
          return c.substring(name.length, c.length);
        }
      }
      return "";
    },
  };

  useEffect(() => {
    document.cookie = "currentTime=0";
  }, [id, episodeId]);

  useEffect(() => {
    subtitlesLink?.forEach((sub, i) => {
      if (sub.languageAbbr === "vi") {
        setSubtitlesIndex(i);
      }
    });
  }, [subtitlesLink]);

  useEffect(() => {
    window.addEventListener("keydown", (e) => handlePlayerPress(e));
    return () =>
      window.removeEventListener("keydown", (e) => handlePlayerPress(e));
  }, []);

  return (
    <Box position={"relative"}>
      <Player
        autoplay
        theme="dark"
        style={{
          "--vm-player-theme": "#777",
          "--vm-blocker-z-index": "50",
          cursor: "pointer",
          maxHeight: "100%",
          maxWidth: "100%",
        }}
        onVmPlaybackReady={() => {
          setCurrentTime(+app.getCookie("currentTime"));
          if (!playing) setPlaying(true);
        }}
        volume={volume}
        playbackRate={valueRate}
        currentTime={currentTime}
        onVmCurrentTimeChange={app.onTimeUpdate}
        onVmPlayingChange={app.onPlayingUpdate}
        onVmPlaybackEnded={() => app.onPlaybackEnded()}
        ref={player}
        onClick={(e) => app.handleClickPlayer(e)}
      >
        <Hls
          onVmError={(info) => app.onError(info)}
          crossOrigin="anonymous"
          poster={poster}
          preload="none"
        >
          <source type="application/x-mpegURL" data-src={videoSrc} />
          {subtitlesLink?.map((sub, i) => {
            return (
              <track
                key={i}
                kind="subtitles"
                default={subtitlesIndex === i}
                src={`https://srt-to-vtt.vercel.app/?url=${sub.subtitlingUrl}`}
                srcLang={sub.languageAbbr}
                label={sub.language}
              />
            );
          })}
        </Hls>

        <ControlBar
          app={app}
          valueRate={valueRate}
          definition={definition}
          definitionList={definitionList}
          subtitlesIndex={subtitlesIndex}
          subtitlesLink={subtitlesLink}
        />
      </Player>
      
      {!playing && (
        <IconShow status='play' />
      )}
      {playing && (
        <IconShow status='pause' />
      )}
      <ModalPopup 
        modalOpen={modalOpen}
        setModalOpen={setModalOpen}
        goToNextEpisode={app.goToNextEpisode}
      />
    </Box>
  );
}
export default memo(VideoPlayer);
