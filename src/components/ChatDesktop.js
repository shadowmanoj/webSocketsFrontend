import React, { useState, useEffect } from 'react';
import { v4 as uuidv4 } from 'uuid';
import styled from 'styled-components';

const ChatContainer = styled.div`
  background-color: white; 
  margin: auto;
  font-family: 'Arial', sans-serif;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 400px;
  }
`;

const MessageContainer = styled.div`
  max-width: 1000px; 
  background-color: white; 
  margin: auto;
  font-family: 'Arial', sans-serif;
  overflow: hidden;

  @media (max-width: 768px) {
    max-width: 400px;
  }
`;

const Header = styled.div`
  background-color: #fff;
  padding: 16px;
  text-align: center;
  border-bottom: 1px solid #ddd;
  display: flex;
  justify-content: space-between; 
  align-items: center;
`;

const MessageBubble = styled.li`
  display: inline-block; 
  background-color: ${props => props.isSender ? '#0b93f6' : '#e5e5ea'};
  color: ${props => props.isSender ? '#fff' : '#000'};
  border-radius: 10px;
  padding: 10px 14px;
  max-width: 70%; 
  margin-bottom: 10px;
  align-self: ${props => props.isSender ? 'flex-end' : 'flex-start'};
  margin-left: ${props => props.isSender ? 'auto' : '0'};
  position: relative;
  word-wrap: break-word;

  &:after {
    content: "";
    position: absolute;
    top: 3px;
    ${props => props.isSender ? 'right' : 'left'}: -5px;
    width: 10px;
    height: 10px;
    background-color: inherit;
    border-top-${props => props.isSender ? 'right' : 'left'}-radius: 16px;
    ${props => props.isSender
    ? `border-right: 1px solid #0b93f6; border-top: 1px solid #0b93f6;`
    : `border-left: 1px solid #e5e5ea; border-top: 1px solid #e5e5ea;`}
    transform: ${props => props.isSender ? 'rotate(45deg)' : 'rotate(-45deg)'};
    transform-origin: top ${props => props.isSender ? 'right' : 'left'};
    z-index: 0;
  }
`;


const MessageArea = styled.ul`
  padding: 10px;
  height: 600px;
  overflow-y: auto;
  list-style-type: none;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: flex-start; 

  & > li.isSender {
    align-self: flex-end; 
`;

const InputArea = styled.div`
  padding: 10px;
  background-color: #fff;
  display: flex;
  border-top: 1px solid #ddd;
`;

const Input = styled.input`
  flex: 1;
  padding: 10px;
  border: 1px solid #ddd;
  border-radius: 20px;
  margin-right: 10px;
`;

const SendButton = styled.button`
  background-color: #0b93f6;
  color: #fff;
  border: none;
  border-radius: 20px;
  padding: 10px 20px;
`;

const Chat = () => {
    const [user, setUser] = useState('');
    const [inputMessage, setInputMessage] = useState('');
    const [joined, setJoined] = useState(false);
    const [matchFound, setMatchFound] = useState(false);
    const [socket, setSocket] = useState(null);
    const [chatHistory, setChatHistory] = useState([]);
    const [waitMessage, setWaitMessage] = useState("You will be matched soon");
    const [disconnected, setDisconnected] = useState(false);
    const [isTyping, setIsTyping] = useState(false);

    const handleTyping = (event) => {
        if (event.target.value !== '') {
            socket.send(JSON.stringify({ type: 'typing', user }));
        } else if (event.target.value === '') {
            socket.send(JSON.stringify({ type: 'stopped_typing', user }));
        }

        setInputMessage(event.target.value);
    };
    const handleKeyPress = (event) => {
        if (event.key === 'Enter') {
            sendMessage();
        }
    };

    const sendMessage = () => {
        const messageText = inputMessage.trim();
        if (messageText === '') return;

        if (!matchFound) {
            alert('Waiting for a match. You cannot send messages yet.');
            return;
        }

        socket.send(JSON.stringify({ type: 'message', content: messageText }));

        const newMessage = { user, content: messageText };
        chatHistory.push(newMessage)

        setInputMessage('');
    };

    const endChat = () => {
        socket.send(JSON.stringify({ type: 'close', user }));
        setMatchFound(false);
        setDisconnected(true);

    };

    const joinChat = () => {

        const userId = uuidv4();
        setUser(userId);

        const newSocket = new WebSocket(`ws://localhost:8765/${userId}`);

        newSocket.onopen = () => {
            console.log('WebSocket connection established.');
            newSocket.send(JSON.stringify({ type: 'join', user: userId }));
        };
        setJoined(true);

        newSocket.onmessage = (event) => {
            const data = JSON.parse(event.data);
            switch (data.type) {
                case 'message':
                    const newMessage = { user: data.user, content: data.content };
                    setChatHistory((prevChatHistory) => [...prevChatHistory, newMessage]);
                    setIsTyping(false)
                    break;
                case 'match':
                    setMatchFound(true);
                    setWaitMessage("You are matched now. You can chat");
                    break;
                case 'close':
                    setDisconnected(true);
                    break;
                case 'typing':
                    setIsTyping(true);
                    break;
                case 'stopped_typing':
                    setIsTyping(false);
                    break;
                default:
                    break;
            }
        };

        newSocket.onclose = () => {
            console.log('WebSocket connection closed.');
            setJoined(false)
        };

        setSocket(newSocket);
    };

    useEffect(() => {
        return () => {
            if (socket) {
                socket.close();
            }
        };
    }, [socket]);


    return (
        <ChatContainer>
            <Header>
                {joined ? waitMessage : "You are now connected"}
            </Header>
                <MessageContainer>
                    <MessageArea>
                        {chatHistory.map((message, index) => (
                            <>
                                <div style={{paddingBottom:"5px"}}>
                                    {index===0 && user !== message.user? "Stranger": ""}
                                    {index>0 && user !== chatHistory[index].user && user === chatHistory[index-1].user ? "Stranger": ""}
                                </div>
                                <MessageBubble key={index} isSender={user === message.user}>
                                    {`${message.content}`}
                                </MessageBubble>
                            </>
                        ))}
                        {isTyping?"Stranger is typing":""}
                        {!joined && (
                            <InputArea>
                                <SendButton onClick={joinChat}>Join</SendButton>
                            </InputArea>
                        )}
                    </MessageArea>
                    {!disconnected && (
                        <>
                            <InputArea>
                                {joined && (
                                    <InputArea>
                                        <SendButton onClick={endChat} disabled={!joined || !matchFound}>
                                            End Chat
                                        </SendButton>
                                    </InputArea>
                                )}
                                <Input
                                    type="text"
                                    placeholder="Type a message..."
                                    value={inputMessage}
                                    onChange={(e) => handleTyping(e)}
                                    onKeyPress={handleKeyPress}
                                    disabled={!joined || !matchFound}
                                />
                                <SendButton onClick={sendMessage} disabled={!joined || !matchFound}>Send</SendButton>
                            </InputArea>
                        </>
                    )}
                    <div>
                        {disconnected ? "Your chat has been ended." : null}
                    </div>
                </MessageContainer>
        </ChatContainer>
    );
};

export default Chat;
