import React, { useState } from "react";
import axios from "axios";
import ReactAudioPlayer from "react-audio-player";
import { driverInfo } from "../utils/driverInfo";
import { generatePrompt } from "../utils/generatePrompt";

const AudioChatBot = () => {
  const API_KEY = process.env.REACT_APP_OPENAI_API_KEY;
  const [userInput, setUserInput] = useState("");
  const [responseAudio, setResponseAudio] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isListening, setIsListening] = useState(false); // 음성 인식 상태

  const SpeechRecognition =
    window.SpeechRecognition || window.webkitSpeechRecognition;
  const recognition = new SpeechRecognition();

  const sleepyKeyword = "졸려";
  const quitKeyword = "종료";

  const sleepyMsg = "졸려? 근처 졸음 쉼터 안내해줄까? 라고 읽어줘";
  const quitMsg = "대화 종료할게. 안전 운전해! 라고 읽어줘";

  const botFunc = (response) => {
    const audioData = response.data.choices[0].message.audio.data;
    setResponseAudio(audioData);

    const botMessage = {
      role: "bot",
      content: response.data.choices[0].message.audio.transcript,
    };
    setMessages((prevMessages) => [...prevMessages, botMessage]);
  };

  // 시작 메세지 생성
  const handleStartConversation = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-audio-preview",
          messages: [
            {
              role: "user",
              content: "오늘 기분 어때? 어디 가는 길이야?라고 말해줘",
            },
          ],
          modalities: ["text", "audio"],
          audio: { voice: "echo", format: "wav" },
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      botFunc(response);
    } catch (err) {
      setError("Error generating audio response.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 특정 단어 감지 시 대답 지정
  const detectResponse = async (msg) => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-audio-preview",
          messages: [
            {
              role: "user",
              content: msg,
            },
          ],
          modalities: ["text", "audio"],
          audio: { voice: "echo", format: "wav" },
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      botFunc(response);
    } catch (err) {
      setError("Error generating audio response.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 음성 대화
  const handleSubmit = async (userInput) => {
    const newMessage = { role: "user", content: userInput };
    setMessages((prevMessages) => [...prevMessages, newMessage]);
    // 졸음 관련 키워드 확인 및 함수 호출
    if (newMessage.content.includes(sleepyKeyword)) {
      detectResponse(sleepyMsg); // 키워드 감지 시 detectResponse 함수 호출
      return; // 실행 후 함수 종료
    }

    // 종료 키워드 확인 및 함수 호출
    if (newMessage.content.includes(quitKeyword)) {
      detectResponse(quitMsg); // 키워드 감지 시 detectResponse 함수 호출
      return; // 실행 후 함수 종료
    }
    setLoading(true);
    setError(null);

    try {
      const response = await axios.post(
        "https://api.openai.com/v1/chat/completions",
        {
          model: "gpt-4o-audio-preview",
          messages: [
            {
              role: "system",
              content: generatePrompt(driverInfo),
            },
            { role: "user", content: userInput },
          ],
          modalities: ["text", "audio"],
          audio: { voice: "echo", format: "wav" },
        },
        {
          headers: {
            Authorization: `Bearer ${API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );

      botFunc(response);
    } catch (err) {
      setError("Error generating audio response.");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // 사용자 음성 전송
  const handleVoiceInput = () => {
    recognition.lang = "ko-KR"; // 한국어로 설정
    recognition.start();
    setIsListening(true);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setUserInput(transcript);
      setIsListening(false);
      handleSubmit(transcript);
    };

    recognition.onerror = (event) => {
      console.error("Speech recognition error:", event.error);
      setError("음성 입력 중 문제가 발생했습니다.");
      setIsListening(false);
    };

    recognition.onend = () => {
      setIsListening(false);
    };
  };

  return (
    <div>
      <h1>DriveMate - 졸음 감지 음성 챗봇</h1>
      <div>
        {messages.map((message, index) => (
          <div
            key={index}
            style={{
              textAlign: message.role === "user" ? "right" : "left",
              padding: "5px",
              marginBottom: "10px",
              backgroundColor: message.role === "user" ? "#d3f8e2" : "#f1f1f1",
              borderRadius: "10px",
              maxWidth: "60%",
              marginLeft: message.role === "user" ? "auto" : "0",
              marginRight: message.role === "bot" ? "auto" : "0",
            }}
          >
            {message.content}
          </div>
        ))}
      </div>

      <br />

      <button
        onClick={handleStartConversation}
        disabled={loading || isListening}
      >
        {loading ? "Processing..." : isListening ? "Listening..." : "대화 시작"}
      </button>

      <button onClick={handleVoiceInput} disabled={loading || isListening}>
        {loading ? "Processing..." : isListening ? "Listening..." : "음성 입력"}
      </button>

      {error && <p style={{ color: "red" }}>{error}</p>}

      {responseAudio && (
        <ReactAudioPlayer
          src={`data:audio/wav;base64,${responseAudio}`}
          autoPlay
          controls={false}
        />
      )}
    </div>
  );
};

export default AudioChatBot;
