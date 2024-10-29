import React, { useEffect, useState } from "react";
import { ChatMessage } from "peerprep-shared-types";
import { useAuth } from "@/contexts/auth-context";
import Textfield from "../common/text-field";
import Button from "../common/button";

type ChatProps = {
  messages: ChatMessage[];
  sendMessage: (message: string) => void;
};

const Chat: React.FC<ChatProps> = ({
  messages = [],
  sendMessage = () => {},
}) => {
  const { username } = useAuth();
  const [messageToSend, setMessageToSend] = useState("");
  const [messageCount, setMessageCount] = useState(0);
  const [notification, setNotification] = useState(false);

  useEffect(() => {
    if (
      messages.length > messageCount &&
      messages[messages.length - 1].username !== username
    ) {
      setNotification(true);
    }
    setMessageCount(messages.length);
  }, [messages]);

  function handleScroll(e: React.UIEvent<HTMLDivElement, UIEvent>) {
    const bottom =
      e.currentTarget.scrollHeight - e.currentTarget.scrollTop - 2 <=
      e.currentTarget.clientHeight;
    if (bottom) {
      console.log("At the bottom");
      setNotification(false);
    }
  }

  return (
    <div className="h-full bg-white dark:bg-slate-800 rounded-lg flex flex-col">
      <div
        id="chat-container"
        className="max-h-full w-full overflow-y-scroll flex-grow"
        onScroll={(e) => handleScroll(e)}
      >
        {notification && (
          <div className="sticky top-0 text-center text-gray-500 dark:text-gray-400 ">
            {"New Messages"}
          </div>
        )}
        <div className="flex flex-col-reverse justify-end h-full px-4">
          {messages &&
            messages.toReversed().map((message, index) => {
              return (
                <div
                  key={index}
                  className={`w-fit mb-4 bg-green-800 rounded-lg p-2
                    ${username === message.username ? "self-end place-items-end" : ""}`}
                >
                  <div className="text-sm font-medium text-gray-900 dark:text-slate-300">
                    {message.username}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-zinc-400 text-wrap">
                    {message.message}
                  </div>
                </div>
              );
            })}
        </div>
        {/* Signal to user if new messages were received */}
      </div>
      <div className="flex justify-between space-x-5 items-center px-4">
        <div className="flex-grow">
          <Textfield
            placeholder_text="Message"
            maxLength={200}
            text={messageToSend}
            onChange={(e) => {
              e.preventDefault();
              setMessageToSend(e.target.value.trim());
            }}
          />
        </div>
        <div>
          <Button
            text="Send"
            type="button"
            onClick={() => {
              sendMessage(messageToSend);
              setMessageToSend("");
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default Chat;
