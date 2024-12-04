function PopupApp() {
  return (
    <>
      <h1 className="text-xl">Popup</h1>
      <button type="button" onClick={() => {
        console.log(chrome.runtime.getURL("index.html"))
        chrome.tabs.create({url: chrome.runtime.getURL("index.html")})
      }}>
        Open Extension Page
      </button>
    </>
  )
}

export default PopupApp;
