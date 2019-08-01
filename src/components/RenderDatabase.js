import React, { useContext, useState, useEffect } from "react";
import { FixedSizeList as FixedList } from "react-window";
import AutoSizer from "react-virtualized-auto-sizer";
import { BrowserRouter as Router, Route, Link } from "react-router-dom";
import { motion } from "framer-motion";

import CompletedTick from "../images/CompletedTick.svg";
import DownloadIcon from "../images/DownloadIcon.svg";

import {
  List,
  ListItem,
  Typography,
  ListItemAvatar,
  Avatar,
  Divider,
  ListItemText
} from "@material-ui/core";

import { PlayForWork } from "@material-ui/icons";
import DownloadDeleteDialog from "./DownloadDeleteDialog";

import { GlobalContext } from "./GlobalState";

import getAudioLink from "../apis/getAudioLink";
import { downloadSong, deleteSongAudio } from "../external/saveSong";

let currentId;

const RenderDatabase = ({ songs }) => {
  const { setCurrentVideoSnippet, setSnackbarMsg } = useContext(GlobalContext);
  const [deleteDialogState, setDeleteDialogState] = useState(false);
  const [dontAskPopup, setDontAskPopup] = useState(null);

  useEffect(() => {
    //convert string to bool
    const popupLocalState = localStorage.getItem("dontAskPopup") === "true";
    setDontAskPopup(popupLocalState);
    // for popup settings
  }, []);

  const disablePopup = () => {
    localStorage.setItem("dontAskPopup", true);
    setDontAskPopup(true);
  };

  useEffect(() => {
    console.log("dont ask state", dontAskPopup);
  }, [dontAskPopup]);

  const handleClick = song => {
    // set all the info of current clicked video in this object
    setCurrentVideoSnippet({
      id: song.videoId,
      audio: song.audio,
      title: song.title,
      channelTitle: song.channelTitle,
      maxThumbnail: `https://img.youtube.com/vi/${
        song.videoId
      }/maxresdefault.jpg`,
      sdThumbnail: `https://img.youtube.com/vi/${song.videoId}/sddefault.jpg`
      // this is the url of the max resolution of thumbnail
    });
  };

  const handleDownload = async (id, event) => {
    const targetElement = event.currentTarget;
    // add class to parent element to make downloading animtion
    targetElement.classList.add("downloading-animation");
    const res = await getAudioLink.get("/song", {
      params: { id: id }
    });
    // first we will fetch the song link then we will download it
    // the download song function takes id and the url
    const status = await downloadSong(id, res.data);
    // after the downloading is done we will remove the downloading class
    targetElement.classList.remove("downloading-animation");
    targetElement.firstElementChild.innerHTML = ` <img src=${CompletedTick} alt="downloading completed icon"/>`;
    // set the snackbar message
    setSnackbarMsg("Song Downloaded");
    console.log("song status", status);
  };

  const deleteTheSong = async checkBox => {
    const deleted = await deleteSongAudio(currentId);
    setDeleteDialogState(false);
    setSnackbarMsg("Deleted Successfully")

    console.log(currentId, checkBox);
    // we will set it to localstorage the popup option
    if (checkBox) {
      disablePopup();
    }
  };

  // hadnling download dialog
  const handleRemoveSong = id => {
    currentId = id;
    // when user clicks on the download badge we will check the state
    // then delete the song without showing the popup if dontAskPopup is true
    // and delete the song by calling deleteTheSong
    dontAskPopup ? deleteTheSong() : setDeleteDialogState(true);
  };

  const renderResult = songs.map((song, index) => {
    return (
      <div className="render-list-container" key={song.videoId}>
        <ListItem
          alignItems="flex-start"
          button
          onClick={() => handleClick(song)}
          component={Link}
          to={`/song/${song.videoId}`}
        >
          <ListItemAvatar>
            <Avatar
              className="searchThumb"
              style={{ width: "60px", height: "60px", marginRight: "15px" }}
              alt={song.title}
              src={`https://img.youtube.com/vi/${
                song.videoId
              }/maxresdefault.jpg`}
            />
          </ListItemAvatar>
          {/* we will play the song when clicked on title */}
          <ListItemText
            primary={song.title}
            secondary={
              <React.Fragment>
                <Typography
                  component="span"
                  variant="body2"
                  color="textPrimary"
                >
                  {song.channelTitle}
                </Typography>
              </React.Fragment>
            }
          />
        </ListItem>
        <div
          className="download-container"
          onClick={e =>
            song.audio
              ? handleRemoveSong(song.videoId, e)
              : handleDownload(song.videoId, e)
          }
        >
          <div className="badge-container">
            {/* if there is audio file then we will show tick mark icon */}
            <img
              src={song.audio ? CompletedTick : DownloadIcon}
              alt="downloading icon"
            />
          </div>
        </div>
        <Divider />
      </div>
    );
  });

  return (
    <List>
      {/* we will render this component only if popup is false */}
      {dontAskPopup ? null : (
        <DownloadDeleteDialog
          isOpen={deleteDialogState}
          handleCancel={() => setDeleteDialogState(false)} // we will just hide the dialog on cancel
          handleDelete={deleteTheSong} //if user wants to delete the song we will just do it
        />
      )}

      {renderResult}
    </List>
  );
};

export default RenderDatabase;
