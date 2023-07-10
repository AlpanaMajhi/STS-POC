import { useState } from "react";
const receiverSocket = new WebSocket("ws://localhost:8765/receiver");

const Receiver = () => {
  const [languageCode, setLanguageCode] = useState(null);
  const [UUID, setUUID] = useState(null);
  const [data, setData] = useState([]);
  const [buttonName, setButtonName] = useState("Connect!");

  const handleLanguageChange = (e) => {
    setLanguageCode(e.target.value);
  };
  const handleConnect = () => {
    receiverSocket.send(
      JSON.stringify({
        targetLanguage: languageCode,
        gender: "male",
        UUID,
      })
    );
    receiverSocket.onmessage = (data) => {
      if (data.data === "Connection established.") {
        setButtonName("Disconnect!");
      }
    };
  };

  const handleUUIDChange = (e) => {
    setUUID(e.target.value);
  };

  const setTargetData = (message) => {
    if (!!message) {
      const prevData = JSON.parse(JSON.stringify(data));
      const parsedData = JSON.parse(message);
      const result = [
        ...prevData,
        {
          source: parsedData?.pipelineResponse[0]?.output[0]?.source,
          target: parsedData?.pipelineResponse[0]?.output[0]?.target,
          audio: `data:audio/wav;base64,${parsedData?.pipelineResponse[1]?.audio[0]?.audioContent}`,
        },
      ];
      setData(result);
    }
  };

  receiverSocket.addEventListener("message", (message) => {
    if (message.data !== "Connection established.") {
      setTargetData(message.data);
    }
  });

  const handleDisconnect = () => {
    setButtonName("Connect");
    receiverSocket.close();
  };
  return (
    <div>
      <p>Receiver</p>
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
      <p>
        UUID: <input onChange={handleUUIDChange} type="text" />
      </p>
      <button
        disabled={!UUID}
        onClick={() =>
          buttonName === "Connect!" ? handleConnect() : handleDisconnect()
        }
      >
        {buttonName}
      </button>
      <div>
        {data.length ? (
          data.map((d) => {
            return (
              <>
                <p>Source: {d.source}</p>
                <p>Target: {d.target}</p>
                <audio src={`${d.audio}`} controls="controls" />
              </>
            );
          })
        ) : (
          <></>
        )}
      </div>
    </div>
  );
};

export default Receiver;
