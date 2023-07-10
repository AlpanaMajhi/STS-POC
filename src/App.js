import './App.css';
import AudioReactRecorder, { RecordState } from "audio-react-recorder";
import { useCallback, useState, useMemo } from 'react';
import { StreamingClient, SocketStatus } from "@project-sunbird/open-speech-streaming-client";


function App() {
  const [recordAudio, setState] = useState(RecordState.STOP);
  const [streaming, ] = useState(new StreamingClient());
  const [audioData,setAudioData ] = useState([]);
  const onStopRecording = () =>{
    setState(RecordState.STOP);
  };

  const streamTTS = (senderSocket, receiverSocket, input, sourceLanguage, targetLanguage, index) =>{
    senderSocket.onopen = () => {
      if (senderSocket.OPEN) {
        senderSocket.send(JSON.stringify({ sourceLanguage }));
        senderSocket.onmessage = (data) => {
          if(data.data){
            receiverSocket.onopen = () => {
              receiverSocket.send(
                JSON.stringify({
                  targetLanguage,
                  gender: "male",
                  UUID: data.data,
                })
              );
            }
          }
        };
        receiverSocket.onmessage = (message) => {
          if(message.data === "Connection established."){
            senderSocket.send(JSON.stringify({ input }));
          }else if(!!message){
            const { data } = message;
            setAudioData((prev)=>{
              console.log('prev', prev);
              if(prev.length - 1 === index)
              {
                const updatedObject = prev[index];
                const parsedData = JSON.parse(data);
                updatedObject['target'] = parsedData.pipelineResponse[0].output[0].target;
                updatedObject["audio"] = {
                  language: parsedData["targetLanguage"],
                  audio: `data:audio/wav;base64,${parsedData.pipelineResponse[1].audio[0].audioContent}`,
                };
                return [...new Set(prev, updatedObject)];
              }
            })
          }
        };
      }
    };
  }
  const startRecording = () => {
    const LANGUAGE_CODE = "hi"
    const INDEX = 0;
    setState(RecordState.START);
    streaming.connect("wss://meity-dev-asr.ulcacontrib.org", LANGUAGE_CODE, (action, id)=>{
      if (action === SocketStatus.CONNECTED) {
        streaming.startStreaming(
          function (transcript) {
            const senderSocket = new WebSocket("ws://localhost:8765/sender");
            const receiverSocket = new WebSocket(
              "ws://localhost:8765/receiver"
            );
            setAudioData((prev, i) => {
              let sentence = ""
              if(!!prev.length){
                let totalLength = 0;
                prev.forEach(p=>{
                  totalLength = (p.source.length + totalLength);
                });
                sentence = transcript.split(" ").slice(totalLength).join(" ")
                streamTTS(senderSocket, receiverSocket, sentence, LANGUAGE_CODE, "en", prev.length);
                return [
                  ...prev,
                  {source: transcript.split(" ").slice(totalLength) ,target: "", audio: "" }
                ];
              }
              sentence = transcript.split(" ").join(" ");
              streamTTS(senderSocket, receiverSocket,sentence, LANGUAGE_CODE, "en", INDEX);
              return [{source: transcript.split(" ") ,target: "", audio: "" }];
            });
          },
          function (errorMsg) {
            console.log("errorMsg", errorMsg);
          }
        );
      }
    })
  };

  const stopRecording = () =>{
    setState(RecordState.STOP);
    streaming.disconnect();
  }

  const getAudioComponent = useCallback(()=>{
    return !!audioData.length ? audioData.map((audio, index)=>{
        const source = audio?.source.join(" ");
        const target = audio?.target;
        const base64Audio = audio?.audio?.audio;
        const { language } = audio?.audio;
      return (
        <div>
          <p>{`sourcedata: ${source}`}</p>
          <p>{`targetData: ${target}`}</p>
          <p>
            <span>{ language }</span>
            <audio src={base64Audio} controls="controls" />
          </p>
        </div>
      );
      // }
    }) : <></>
  },[audioData])

  return (
    <div className="App" style={{backgroundColor:"lightyellow"}}>
      {recordAudio === RecordState.STOP ? (
        <div style={{color:"green"}}
        onClick={startRecording}
        >
          Start
        </div>
      ) : (
        <div
        onClick={stopRecording}
        >
          Stop
        </div>
      )}
      <div>
        {getAudioComponent()}
      </div>
      <div style={{ display: "none" }}>
        <AudioReactRecorder
          state={recordAudio}
          onStop={onStopRecording}
          style={{ display: "none" }}
        />
      </div>
    </div>
  );
}

export default App;
