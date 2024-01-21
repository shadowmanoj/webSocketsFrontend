import './App.css';
import ChatMobile from "./components/ChatMobile";
import ChatDesktop from "./components/ChatDesktop";

function App() {

  function isMobile() {
    const toMatch = [
      /Android/i,
      /webOS/i,
      /iPhone/i,
      /iPad/i,
      /iPod/i,
      /BlackBerry/i,
      /Windows Phone/i
    ];


    return toMatch.some((toMatchItem) => {
      return navigator.userAgent.match(toMatchItem);
    });
  }

  return (
      <>

          {isMobile() ?
            <ChatMobile/>
             :
                <ChatDesktop/>}

      </>
  )

}
export default App;
