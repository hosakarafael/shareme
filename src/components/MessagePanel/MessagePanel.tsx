import React, { useEffect, useRef, useState } from "react";
import { useUser } from "../../context/userContext";
import { useBase64Image } from "../../hook/useBase64Image";
import { useInput } from "../../hook/useInput";
import { MessageEntity } from "../../models/message";
import UserProfileEntity from "../../models/userProfile";
import { getMessages, sendMessage } from "../../services/messageService";
import { getUserById, userImageDownload } from "../../services/userService";
import { formatDate } from "../../utils/formatDate";
import css from "./MessagePanel.module.scss";

interface MessagePanelProps {
  chattingUserId: string;
  minimized: boolean;
  onMinimized: (userId: string, imageUrl: string | undefined) => void;
  onClose: (userId: string) => void;
}

const MessagePanel = ({
  chattingUserId,
  minimized,
  onMinimized,
  onClose,
}: MessagePanelProps) => {
  const { user: currentUser } = useUser();
  const [chattingUser, setChattingUser] = useState<UserProfileEntity>();
  const [messages, setMessages] = useState<MessageEntity[]>([]);
  const { value: text, bind: bindText, reset: resetText } = useInput("");
  const { image: userImage, setService: setUserImageService } =
    useBase64Image(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  async function updateMessages() {
    if (currentUser && chattingUser) {
      const { data } = await getMessages(currentUser.id, chattingUser.id);

      if (messages.length !== data.length) {
        setMessages(data);
      }
    }
  }

  useEffect(() => {
    async function getUserMessages() {
      if (currentUser) {
        const user = await getUserById(chattingUserId);
        setUserImageService(userImageDownload(chattingUserId));
        setChattingUser(user);

        const { data } = await getMessages(currentUser.id, user.id);
        setMessages(data);
      }
    }
    getUserMessages();
  }, [currentUser]);

  useEffect(() => {
    const interval = setInterval(() => {
      updateMessages();
    }, 1000);
    return () => clearInterval(interval);
  });

  useEffect(() => {
    bottomRef.current?.scrollIntoView({
      behavior: "auto",
    });
  }, [messages, minimized]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser) {
      sendMessage(currentUser.id, chattingUserId, text);
    }
    resetText();
  };

  const mouseOver = (e: React.MouseEvent, id: string) => {
    const tooltip = document.getElementById(`date-sent-${id}`);
    if (tooltip && e.currentTarget instanceof HTMLDivElement) {
      let msgDivOffset = e.currentTarget.getBoundingClientRect();
      tooltip.style.top = msgDivOffset.top + "px";
      tooltip.style.left = msgDivOffset.left - 300 + "px";
    }
  };

  const mouseOut = (id: string) => {
    const tooltip = document.getElementById(`date-sent-${id}`);
    if (tooltip) {
    }
  };

  return (
    <>
      {!minimized && (
        <div className={`${css["message-panel"]}`}>
          <div className={css["header"]}>
            <div className={css["user-info"]}>
              <img className={css["user-image"]} src={userImage} />
              <span className={css["user-name"]}>{chattingUser?.fullName}</span>
            </div>
            <div className={css["btn-area"]}>
              <i
                onClick={() => {
                  onMinimized(chattingUserId, userImage);
                }}
                className={`${css["icon"]} fa-solid fa-minus fa-lg`}
              ></i>
              <i
                onClick={() => onClose(chattingUserId)}
                className={`${css["icon"]} fa-solid fa-xmark fa-lg`}
              ></i>
            </div>
          </div>

          <div className={css["body"]}>
            {messages.map((message) => (
              <div key={message.id} className={css["message__container"]}>
                <div
                  onMouseOver={(e) => mouseOver(e, message.id)}
                  onMouseOut={() => mouseOut(message.id)}
                  className={`${css["message"]} ${
                    message.sender.id === currentUser?.id ? css["mine"] : ""
                  }`}
                >
                  <span>{message.content}</span>
                </div>
                <div
                  id={`date-sent-${message.id}`}
                  className={css["date-sent"]}
                >
                  {formatDate(message.dateSent!)}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
          <form onSubmit={handleSendMessage}>
            <div className={css["footer"]}>
              <input type="text" {...bindText} />
            </div>
          </form>
        </div>
      )}
    </>
  );
};

export default MessagePanel;
