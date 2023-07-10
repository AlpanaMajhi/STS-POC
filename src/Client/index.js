import { useEffect, useRef, useState } from "react";
import { RecordState } from "audio-react-recorder";
import { StreamingClient, SocketStatus } from "@project-sunbird/open-speech-streaming-client";
import Start from "../assets/start.svg";
import Stop from "../assets/stopIcon.svg";

const senderSocket = new WebSocket("ws://localhost:8765/sender");

const Client = () => {
  const [languageCode, setLanguageCode] = useState(null);
  const [UUID, setUUID] = useState(null);
  const [recordAudio, setState] = useState(RecordState.STOP);
  const [streaming, ] = useState(new StreamingClient());
  const [audioData, setAudioData ] = useState([]);
  const prevSentence = useRef("");

  const handleLanguageChange = (e) => {
    senderSocket.send(JSON.stringify({ sourceLanguage: e.target.value }));
    senderSocket.onmessage = (data) => {
        if (data.data !== "Received Input") setUUID(data.data);
    };
    setLanguageCode(e.target.value);
  };

  const stopRecording = () =>{
    setState(RecordState.STOP);
    streaming.disconnect();
  }

  useEffect(()=>{
    if(SocketStatus.TERMINATED){
        setAudioData([])
    }
  },[SocketStatus])

  const startRecording = () => {
    setState(RecordState.START);
    streaming.connect("wss://meity-dev-asr.ulcacontrib.org", languageCode, (action, id)=>{
      if (action === SocketStatus.CONNECTED) {
        streaming.startStreaming(
          function (transcript) {
              console.log("beforeSetting", prevSentence.current);
              console.log("afterSetting", prevSentence.current);
            if (prevSentence.current === "") {
              prevSentence.current = transcript;
              senderSocket.send(
                JSON.stringify({
                  UUID,
                  input: transcript,
                })
              );
            } else {
                const remainingSentence = transcript.split(" ").slice(prevSentence.current.split(" ").length ).join(" ");
                console.log("remainingSentence", transcript.split(" ").slice(prevSentence.current.split(" ").length),transcript.split(" "), prevSentence.current.split(" ").length);
                senderSocket.send(
                    JSON.stringify({
                      UUID,
                      input: remainingSentence,
                    })
                  );
              prevSentence.current = transcript;
            }
            // setAudioData((prev, i) => {
            //     console.log("prev", prev, transcript);
            //   if (!!prev.length) {
            //     let totalLength = 0;
            //     prev.forEach((p) => {
            //       totalLength = p.length + totalLength;
            //     });
            //     senderSocket.send(
            //       JSON.stringify({
            //         UUID,
            //         input: transcript.split(" ").slice(totalLength).join(" "),
            //       })
            //     );
            //     return [...prev, transcript.split(" ").slice(totalLength)];
            //   }
            //     senderSocket.send(
            //       JSON.stringify({
            //         UUID,
            //         input: transcript.split(" ").join(" "),
            //       })
            //     );
            //     console.log([prev, transcript.split(" ")]);
            //   return [prev, transcript.split(" ")];
            // });
          },
          function (errorMsg) {
            console.log("errorMsg", errorMsg);
          }
        );
      }
    })
  };

  const renderAudioIcon = () => {
    return (
      <div>
        {recordAudio === RecordState.STOP ? (
          <img src={Start} style={{ color: "green" }} onClick={startRecording} />
        ) : (
          <img src={Stop} onClick={stopRecording} />
        )}
      </div>
    );
  };

  return (
    <div>
      <p>Speaker</p>
      <select onChange={handleLanguageChange}>
        <option value={null}>---Select Language---</option>
        <option value="en">English</option>
        <option value="hi">Hindi</option>
        <option value="bn">Bengali</option>
        <option value="ta">Tamil</option>
        <option value="mr">Marathi</option>
        <option value="kn">Kannada</option>
        <option value="te">Telugu</option>
        <option value="gu">Gujarati</option>
        <option value="pa">Punjabi</option>
        <option value="ml">Malayalam</option>
        <option value="as">Assamese</option>
        <option value="ks">Kashmiri</option>
        <option value="ne">Nepali</option>
        <option value="or">Odia</option>
      </select>
      {!!UUID ? <p>UUID: {UUID} </p> : <></>}
      {!!UUID ? renderAudioIcon() : <></>}
    </div>
  );
};

export default Client;
