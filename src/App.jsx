import AudioChatBot from "./components/AudioChatBot";
import styled from "styled-components";
function App() {
  return (
    <StMain>
      <AudioChatBot />
    </StMain>
  );
}

export default App;

const StMain = styled.main`
  height: 100vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
`;
