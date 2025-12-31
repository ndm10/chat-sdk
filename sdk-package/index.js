class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: "open" });
    this.connection = null;
  }

  async connectedCallback() {
    this.render();

    // Ensure SignalR is loaded
    if (typeof signalR === "undefined") {
      await this.loadSignalR();
    }

    this.initLogic();

    if (!customElements.get("emoji-picker")) {
      // If not loaded yet, load the script
      const script = document.createElement("script");
      script.type = "module";
      script.src =
        "https://cdn.jsdelivr.net/npm/emoji-picker-element@^1/index.js";
      script.onload = () => {
        console.log("emoji-picker-element loaded");
        // After loading, initialize the emoji picker
        this.setupEmojiPickerAfterLoad();
      };
      script.onerror = () =>
        console.error("Failed to load emoji-picker-element");
      document.head.appendChild(script);
    } else {
      // If already loaded (multiple widgets on the page) → initialize immediately
      this.setupEmojiPickerAfterLoad();
    }
  }

  render() {
    // Determine position styles based on attributes
    let position = "";
    const top = this.getAttribute("top");
    const left = this.getAttribute("left");
    const bottom = this.getAttribute("bottom");
    const right = this.getAttribute("right");

    if (top) {
      position += `top: ${top};`;
    }
    if (left) {
      position += `left: ${left};`;
    }
    if (bottom) {
      position += `bottom: ${bottom};`;
    }
    if (right) {
      position += `right: ${right};`;
    }

    if (!position) {
      position = `bottom: 20px; left: 20px;`;
    }

    const template = document.createElement("template");
    template.innerHTML = `
      <style>
        * {
          margin: 0;
          padding: 0;
          font-family: Arial, sans-serif;
          box-sizing: border-box;
        }

        /* ================================================================================
          CHAT CONTAINER & MAIN BOX LAYOUT
          ================================================================================ */
        .chat-container {
          position: fixed;
          ${position}
        }

        #chat-icon {
          display: flex;
          width: 60px;
          height: 60px;
          justify-content: center;
          align-items: center;
        }

        #widget-container {
          position: absolute;
          top: -78vh;
          left: 42px;
        }

        #chat-box {
          position: relative;
          height: 80vh;
          width: 500px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(63, 63, 63, 0.5);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .chat-box-container {
          display: flex;
          flex-direction: column;
          background-color: #ffffffff;
          flex: 1;
          overflow: hidden;
        }

        /* ================================================================================
          CHAT HEADER & FILTER
          ================================================================================ */
        #chat-box-header {
          background-color: #ffffffff;
          border-bottom: 1px solid #e7e7e7ff;
          box-shadow: 0 2px 4px rgba(165, 165, 165, 0.1);
          padding: 10px;
          position: relative;
        }

        .chat-filter {
          display: flex;
          align-items: center;
          justify-content: start;
          padding: 5px;
          gap: 10px;
          border: 1px solid #9e9e9eff;
          width: 80%;
          margin: 0 auto;
          border-radius: 220px;
          background-color: #eeeeeeff;
          padding-left: 15px;
        }

        .chat-filter svg {
          width: 24px;
          height: 24px;
          cursor: pointer;
        }

        .chat-filter input {
          border: none;
          background-color: inherit;
          width: 100%;
          font-size: 1rem;
        }

        .chat-filter input:focus {
          outline: none;
          background-color: inherit;
        }

        .chat-filter input:-internal-autofill-selected {
          background-color: #eeeeeeff !important;
        }

        #btn-list-x {
          background-color: #e0e0e0ff;
          border: none;
          border-radius: 50px;
          height: 28px;
          width: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: black;
          fill: black;
          gap: 0.5rem;
          white-space: nowrap;
          position: absolute;
          top: 50%;
          right: 10px;
          transform: translate(0, -50%);
        }

        #btn-list-x:hover {
          background-color: #cececeff;
        }

        /* ================================================================================
          CHAT LIST & LIST ITEMS
          ================================================================================ */
        #list-items {
          position: relative;
          background-color: #ffffffff;
          display: flex;
          flex-direction: column;
          width: 100%;
          overflow-y: auto;
        }

        #list-items ul {
          list-style-type: none;
        }

        #list-items ul li {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 10px;
        }

        #list-items ul li:hover {
          background-color: #f0f0f0;
        }

        .logo-item {
          width: 45px;
          height: 45px;
          border-radius: 50%;
          background-color: #ffffffff;
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 5px;
          border: 1px solid #ccc;
        }

        .readed {
          color: gray;
        }

        /* ================================================================================
          CHAT INFO INPUT (User Information Dialog)
          ================================================================================ */
        #info-input {
          background-color: #ffffffff;
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        #info-input .info-header {
          padding: 1% 3%;
          background-color: #dadadaff;
          border-radius: 12px;
          box-shadow: 0 5px 10px rgba(109, 109, 109, 0.1);
        }

        #info-input input {
          width: 70%;
          padding: 10px 10px;
          border: 1px solid #ccc;
          border-radius: 50px;
          font-size: 1rem;
        }

        #info-input input:focus {
          outline: none;
        }

        #info-input input.error {
          border: 2px solid #ff4444;
          animation: shake 0.3s;
        }

        #info-input-buttons {
          display: flex;
          gap: 0.825rem;
        }

        #info-input #turn-back-button,
        #continue-button {
          display: flex;
          align-items: center;
          padding: 10px 20px;
          border: none;
          border-radius: 50px;
          background-color: #aac96f;
          color: white;
          font-size: 1rem;
          cursor: pointer;
        }

        #info-input svg {
          fill: white;
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }

        #info-input #error-info-input {
          color: red;
          font-size: 1rem;
        }

        @keyframes shake {
          0%,
          100% {
            transform: translateX(0);
          }
          25% {
            transform: translateX(-5px);
          }
          75% {
            transform: translateX(5px);
          }
        }

        /* ================================================================================
          CHAT DETAILS & MESSAGE CONTAINER
          ================================================================================ */
        #chat-details {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          background-color: #ffffff;
          height: 100%;
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        #chat-details .details-header {
          padding: 12px 8px;
          display: flex;
          gap: 0.825rem;
          align-items: center;
          justify-content: space-between;
          font-size: 1rem;
          background-color: #ffffffff;
          border-bottom: 1px solid #e7e7e7ff;
          box-shadow: 0 2px 4px rgba(165, 165, 165, 0.1);
        }

        .details-header .title-header {
          background-color: #fff;
          color: black;
          border-radius: 16px;
          padding: 5px 12px;
          font-weight: 600;
        }

        .details-header #btn-details-back {
          background-color: #e0e0e0ff;
          border: none;
          border-radius: 50px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: black;
          fill: black;
          gap: 0.5rem;
          white-space: nowrap;
          padding: 0.25rem 0.55rem;
        }

        .details-header #btn-x {
          background-color: #e0e0e0ff;
          border: none;
          border-radius: 50px;
          height: 28px;
          width: 28px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1rem;
          color: black;
          fill: black;
          gap: 0.5rem;
          white-space: nowrap;
        }

        .details-header button svg {
          width: 20px;
          height: 20px;
        }

        .details-header #btn-details-back:hover,
        #btn-x:hover {
          background-color: #cececeff;
        }

        #message-container {
          scroll-behavior: smooth;
          display: flex;
          flex-direction: column;
          padding: 10px 10px;
          gap: 15px;
          width: 100%;
          height: 100%;
          overflow-y: auto;
        }

        /* ================================================================================
          MESSAGE STYLING
          ================================================================================ */
        .message {
          display: flex;
        }

        .message p {
          white-space: pre-wrap;
          max-width: 80%;
          padding: 10px;
          border-radius: 12px;
          margin: 0;
          word-break: break-word;
        }

        .partner .message {
          margin-left: 10%;
          justify-content: flex-start;
        }

        .me .message {
          margin-right: 10%;
          justify-content: flex-end;
        }

        .partner .message p {
          background-color: rgb(240, 240, 240);
        }

        .me .message p {
          background-color: rgba(75, 75, 218, 1);
          color: white;
        }

        .avatar {
          width: 35px;
          height: 35px;
          border-radius: 50%;
          background-color: #cccccc;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .info .message-time {
          font-size: 0.725rem;
          color: gray;
          font-style: italic;
        }

        .partner .info {
          justify-content: flex-start;
        }

        .me .info {
          justify-content: flex-end;
        }

        .partner .message-title {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
        }

        .me .message-title {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
        }

        /* ================================================================================
          MESSAGE INPUT & SENDING
          ================================================================================ */
        .message-sending {
          display: flex;
          align-items: center;
          padding: 10px;
          gap: 10px;
          border-top: 1px solid #e7e7e7ff;
        }

        .message-sending .message-content {
          flex: 1;
          display: flex;
          align-items: center;
          background-color: #e0e0e0ff;
          border-radius: 50px;
          padding: 8px 20px;
          overflow-y: hidden;
        }

        .message-sending #message-input {
          flex-grow: 1;
          background-color: transparent;
          border: none;
          outline: none;
          resize: none;
          overflow: hidden;
          font-size: 16px;
          white-space: normal;
          word-wrap: break-word;
        }

        .message-sending #message-input:focus {
          outline: none;
        }

        .message-sending #btn-send-message {
          background-color: #5b5bdfff;
          border: none;
          border-radius: 50px;
          padding: 10.5px;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .message-sending #btn-send-message svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .message-sending button:hover {
          background-color: #4b4bda;
        }

        /* ================================================================================
          File attach styling
          ================================================================================ */
        .file-attach {
          background: rgb(224, 224, 224);
          border: none;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 6px;
        }

        .file-attach:hover {
          background-color: rgba(201, 201, 201, 1);
        }

        .file-attach svg {
          width: 26px;
          height: 26px;
          fill: #5b5bdfff;
        }

        /* ================================================================================
          EMOJI PICKER STYLING
          ================================================================================ */
        #emoji-button {
          background: none;
          border: none;
          font-size: 18px;
          cursor: pointer;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        #emoji-button:hover {
          background-color: rgba(0, 0, 0, 0.1);
        }

        #emoji-button svg {
          width: 25px;
          height: 25px;
          fill: #5b5bdfff;
        }

        emoji-picker {
          position: absolute;
          bottom: 70px;
          right: 15px;
          display: none;
        }

        emoji-picker.show {
          display: block;
        }

        /* ================================================================================
           LOADING SPINNER STYLES
           ================================================================================ */
        #spinner-overlay {
          position: absolute;
          top: 0;
          left: 0;
          background-color: rgba(0, 0, 0, 0.5);
          height: 100%;
          width: 100%;
          z-index: 1000;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .loader {
          width: 36px;
          height: 36px;
          border: 5px solid #fff;
          border-bottom-color: transparent;
          border-radius: 50%;
          display: inline-block;
          box-sizing: border-box;
          animation: rotation 1s linear infinite;
        }

        @keyframes rotation {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        /* ================================================================================
          RESPONSIVE DESIGN - TABLET (768px and below)
          ================================================================================ */
        @media (max-width: 768px) {
          .chat-container {
            bottom: 15px;
            left: 50%;
            transform: translateX(-50%);
          }

          #chat-icon {
            width: 55px;
            height: 55px;
          }

          #chat-box {
            left: 50%;
            transform: translateX(-50%);
            width: 80vw;
            max-width: 500px;
            height: 85vh;
            top: auto;
            bottom: 75px;
          }

          .chat-filter {
            width: 90%;
          }

          .chat-filter input {
            font-size: 0.95rem;
          }

          #info-input input {
            width: 80%;
            font-size: 1rem;
          }

          #info-input #turn-back-button,
          #info-input #continue-button {
            padding: 8px 16px;
            font-size: 0.95rem;
          }

          .message p {
            max-width: 85%;
            font-size: 0.95rem;
          }

          .message-sending .message-content {
            padding: 8px 15px;
          }

          .message-sending #message-input {
            font-size: 0.95rem;
          }

          .details-header button {
            padding: 0.2rem 0.45rem;
          }

          .details-header #btn-x {
            height: 26px;
            width: 26px;
          }
        }

        /* ================================================================================
          RESPONSIVE DESIGN - MOBILE (480px and below)
          ================================================================================ */
        @media (max-width: 480px) {
          #chat-icon {
            width: 50px;
            height: 50px;
          }

          #chat-icon svg {
            width: 30px;
            height: 30px;
          }

          #chat-box {
            width: 98vw;
            height: 90vh;
            bottom: 65px;
          }

          .chat-filter {
            width: 95%;
            padding-left: 10px;
          }

          .chat-filter input {
            font-size: 0.9rem;
          }

          #info-input h3 {
            font-size: 1.2rem;
          }

          #info-input input {
            width: 85%;
            font-size: 0.95rem;
            padding: 8px 10px;
          }

          .message p {
            max-width: 80%;
            padding: 8px;
            font-size: 0.9rem;
          }

          .avatar {
            width: 30px;
            height: 30px;
            font-size: 0.8rem;
          }

          .info h5 {
            font-size: 0.9rem;
          }

          .message-sending {
            padding: 8px;
          }

          .message-sending #btn-send-message {
            padding: 8px;
          }
        }
      </style>

      <div class="chat-container">
        <div id="chat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path
              d="M64 304C64 358.4 83.3 408.6 115.9 448.9L67.1 538.3C65.1 542 64 546.2 64 550.5C64 564.6 75.4 576 89.5 576C93.5 576 97.3 575.4 101 573.9L217.4 524C248.8 536.9 283.5 544 320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304zM158 471.9C167.3 454.8 165.4 433.8 153.2 418.7C127.1 386.4 112 346.8 112 304C112 200.8 202.2 112 320 112C437.8 112 528 200.8 528 304C528 407.2 437.8 496 320 496C289.8 496 261.3 490.1 235.7 479.6C223.8 474.7 210.4 474.8 198.6 479.9L140 504.9L158 471.9zM208 336C225.7 336 240 321.7 240 304C240 286.3 225.7 272 208 272C190.3 272 176 286.3 176 304C176 321.7 190.3 336 208 336zM352 304C352 286.3 337.7 272 320 272C302.3 272 288 286.3 288 304C288 321.7 302.3 336 320 336C337.7 336 352 321.7 352 304zM432 336C449.7 336 464 321.7 464 304C464 286.3 449.7 272 432 272C414.3 272 400 286.3 400 304C400 321.7 414.3 336 432 336z"
            />
          </svg>
        </div>
        <div id="widget-container">
          <div id="chat-box">
            <div id="spinner-overlay">
              <span class="loader"></span>
            </div>
            <div id="chat-box-header">
              <div class="chat-filter">
                <input
                  id="search-chat-input"
                  type="text"
                  placeholder="Tìm kiếm đối tác..."
                />
                <svg
                  id="search-chat-icon"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 640 640"
                >
                  <path
                    d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"
                  />
                </svg>
              </div>
              <button id="btn-list-x">X</button>
            </div>
            <div class="chat-box-container">
              <!-- Chat list items -->
              <div id="list-items">
                <ul></ul>
              </div>
    
              <!-- Chat info input -->
              <div id="info-input">
                <div class="info-header">
                  <h4></h4>
                </div>
                <h3>Nhập thông tin chat</h3>
                <input id="input-shsbl" type="text" placeholder="Nhập số HSBL" />
                <input
                  id="input-username"
                  type="text"
                  placeholder="Nhập họ và tên"
                />
                <div id="info-input-buttons">
                  <button id="turn-back-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                      <path
                        d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"
                      />
                    </svg>
                    Quay lại
                  </button>
    
                  <button id="continue-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                      <path
                        d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"
                      />
                    </svg>
                    Tiếp tục
                  </button>
                </div>
                <div>
                  <p id="error-info-input"></p>
                </div>
              </div>
            </div>
    
            <!-- Chat message detail -->
            <div id="chat-details">
              <div class="details-header">
                <button id="btn-details-back">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path
                      d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"
                    />
                  </svg>
                  Quay lại
                </button>
                <button id="btn-x">X</button>
              </div>
    
              <!-- Message chat details -->
              <div id="message-container"></div>
    
              <!-- Message input -->
              <div class="message-sending">
                <div class="message-content">
                  <textarea
                    id="message-input"
                    rows="1"
                    placeholder="Nhập tin nhắn..."
                  ></textarea>
                  <button id="emoji-button">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path
                    d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM229.4 385.9C249.8 413.9 282.8 432 320 432C357.2 432 390.2 413.9 410.6 385.9C418.4 375.2 433.4 372.8 444.1 380.6C454.8 388.4 457.2 403.4 449.4 414.1C420.3 454 373.2 480 320 480C266.8 480 219.7 454 190.6 414.1C182.8 403.4 185.2 388.4 195.9 380.6C206.6 372.8 221.6 375.2 229.4 385.9zM208 272C208 254.3 222.3 240 240 240C257.7 240 272 254.3 272 272C272 289.7 257.7 304 240 304C222.3 304 208 289.7 208 272zM400 240C417.7 240 432 254.3 432 272C432 289.7 417.7 304 400 304C382.3 304 368 289.7 368 272C368 254.3 382.3 240 400 240z"
                    />
                    </svg>
                  </button>
                </div>
                <button id="btn-send-message">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path
                      d="M322.5 351.7L523.4 150.9L391 520.3L322.5 351.7zM489.4 117L288.6 317.8L120 249.3L489.4 117zM70.1 280.8L275.9 364.4L359.5 570.2C364.8 583.3 377.6 591.9 391.8 591.9C406.5 591.9 419.6 582.7 424.6 568.8L602.6 72C606.1 62.2 603.6 51.4 596.3 44C589 36.6 578.1 34.2 568.3 37.7L71.4 215.7C57.5 220.7 48.3 233.8 48.3 248.5C48.3 262.7 56.9 275.5 70 280.8z"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  initLogic() {
    const shadowRoot = this.shadowRoot;

    // ================== CONFIGURATION ==================
    const BASE_URL = this.getAttribute("base-url");
    const PAGE_SIZE = 10;
    const SCROLL_THRESHOLD = 20;
    const SCROLL_LOAD_MORE_THRESHOLD = 100;
    const DEBOUNCE_DELAY = 200;

    // ================== USER INPUT ==================
    let token = this.getAttribute("token");

    let userId = this.getAttribute("ma-doi-tac-nsd");

    let fullName = this.getAttribute("ten");

    let ePartnerCode = this.getAttribute("e-partner-code");

    // ================== STATE MANAGEMENT ==================
    let selectedChat = null;
    let currentPage = 1;
    let isLoading = false;
    let hasMoreMessages = true;

    let chatListCurrentPage = 1;
    let chatListIsLoading = false;
    let chatListHasMore = true;
    let currentSearchTerm = "";

    let chatBoxContainerDisplay = true;
    let chatBoxListContainerDisplay = false;
    let chatBoxInputInfoDisplay = true;
    let chatDetailsDisplay = true;

    // ================== DOM ELEMENTS ==================
    const listEl = shadowRoot.querySelector("#list-items ul");
    const infoTitle = shadowRoot.querySelector("#info-input .info-header h4");
    const chatBoxIcon = shadowRoot.querySelector("#chat-icon");
    const chatBoxContainer = shadowRoot.querySelector("#chat-box");
    const chatBoxFilter = shadowRoot.querySelector("#chat-box-header");
    const searchChatInput = shadowRoot.querySelector("#search-chat-input");
    const searchChatIcon = shadowRoot.querySelector("#search-chat-icon");
    const chatBoxListContainer = shadowRoot.querySelector("#list-items");
    const chatBoxInputInfo = shadowRoot.querySelector("#info-input");
    const turnBackButton = shadowRoot.querySelector("#turn-back-button");
    const continueButton = shadowRoot.querySelector("#continue-button");
    const chatDetails = shadowRoot.querySelector("#chat-details");
    const btnX = shadowRoot.querySelector("#btn-x");
    const btnListX = shadowRoot.querySelector("#btn-list-x");
    const detailsBackButton = shadowRoot.querySelector("#btn-details-back");
    const messageContainer = shadowRoot.querySelector("#message-container");
    const hsblInput = shadowRoot.querySelector("#input-shsbl");
    const userNameInput = shadowRoot.querySelector("#input-username");
    const errorInfoInput = shadowRoot.querySelector("#error-info-input");
    const btnSendMessage = shadowRoot.querySelector("#btn-send-message");
    const textarea = shadowRoot.getElementById("message-input");
    const emojiButton = shadowRoot.getElementById("emoji-button");
    const messageInput = shadowRoot.getElementById("message-input");
    const spinnerOverlay = shadowRoot.getElementById("spinner-overlay");

    userNameInput.value = fullName;

    // ================== UTILITY FUNCTIONS ==================
    function parseCustomDateString(str) {
      // Expected format: dd/MM/yyyy HH:mm:ss
      const [date, time] = str.split(" ");
      const [day, month, year] = date.split("/");
      return new Date(`${year}-${month}-${day}T${time}`);
    }

    function debounce(func, wait) {
      let timeout;
      return function executedFunction(...args) {
        const later = () => {
          clearTimeout(timeout);
          func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
      };
    }

    function autoResize() {
      this.style.height = "auto";
      this.style.height = this.scrollHeight + "px";
    }

    function scrollToBottom() {
      if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
      }
    }

    // ================== CHAT LIST FUNCTIONS ==================
    function renderChatList(items, append = false) {
      const htmlContent = items
        .map(
          (item) => `
                <li data-id="${item.MA}">
                    <img class="logo-item" src="${item.LINK_LOGO}" alt="Logo" />
                    <h4 class="title-item">${item.TEN}</h4>
                </li>
            `
        )
        .join("");

      if (append) {
        listEl.innerHTML += htmlContent;
      } else {
        listEl.innerHTML = htmlContent;
      }
    }

    async function ensureChatListFilled() {
      const scrollHeight = chatBoxListContainer.scrollHeight;
      const clientHeight = chatBoxListContainer.clientHeight;

      if (
        scrollHeight <= clientHeight &&
        chatListHasMore &&
        !chatListIsLoading
      ) {
        console.log("Danh sách chưa đủ để scroll, load thêm...");
        await loadMoreChatList();
        setTimeout(() => ensureChatListFilled(), 100);
      }
    }

    async function loadChatList(searchTerm, page = 1, append = false) {
      try {
        const body = {
          trang: page,
          so_dong: PAGE_SIZE,
          nd_tim: searchTerm || "",
        };

        const header = {
          ConnectionId: connection.connectionId || "",
          eAction: "OO78LLZ0T7NLEZ3",
        };

        spinnerOverlay.style.display = "flex";

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
          method: "POST",
          headers: header,
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error("Failed to fetch chat list");

        const data = await response.json();

        // Check if there are more items
        if (
          data.data.length === 0 ||
          data.data.length >= data.output.tong_so_dong
        ) {
          chatListHasMore = false;
        } else {
          chatListHasMore = true;
        }

        renderChatList(data.data, append);
        wireChatItemClicks();

        // If first page and not appending, ensure list is filled
        if (page === 1 && !append) {
          setTimeout(() => ensureChatListFilled(), 50);
        }

        return data.data.length;
      } catch (error) {
        console.error("Error loading chat list:", error);
        if (!append) {
          listEl.innerHTML =
            '<li style="padding: 20px; text-align: center;">Không thể tải danh sách chat</li>';
        }
        return 0;
      } finally {
        spinnerOverlay.style.display = "none";
      }
    }

    async function loadMoreChatList() {
      if (chatListIsLoading || !chatListHasMore) {
        return;
      }

      chatListIsLoading = true;

      try {
        chatListCurrentPage++;
        const count = await loadChatList(
          currentSearchTerm,
          chatListCurrentPage,
          true
        );

        if (count === 0) {
          chatListHasMore = false;
          console.log("Đã tải hết danh sách chat");
        }
      } catch (error) {
        console.error("Lỗi khi load thêm chat list:", error);
        chatListCurrentPage--;
      } finally {
        chatListIsLoading = false;
      }
    }

    function wireChatItemClicks() {
      const chatBoxListItem = shadowRoot.querySelectorAll("#list-items li");
      chatBoxListItem.forEach((item) => {
        item.addEventListener("click", function () {
          if (chatBoxInputInfo) {
            chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
            chatBoxListContainer.style.display = chatBoxListContainerDisplay
              ? "none"
              : "flex";
            chatBoxFilter.style.display = chatBoxListContainerDisplay
              ? "none"
              : "flex";

            chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
            chatBoxInputInfo.style.display = chatBoxInputInfoDisplay
              ? "none"
              : "flex";

            const { id } = item.dataset;
            const name =
              item.querySelector(".title-item")?.textContent?.trim() || "";

            selectedChat = { id, name };
            infoTitle.textContent = name || "Không tìm thấy cuộc trò chuyện!";
            userNameInput.value = fullName;
          }
        });
      });
    }

    // ================== MESSAGE HISTORY FUNCTIONS ==================
    async function loadMessageHistory(groupName, page = 1) {
      try {
        const body = {
          trang: page,
          so_dong: PAGE_SIZE,
          nhom: groupName || "",
        };

        const header = {
          ConnectionId: connection.connectionId || "",
          eAction: "P75EVW99A84IGNK",
        };

        spinnerOverlay.style.display = "flex";

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
          method: "POST",
          headers: header,
          body: JSON.stringify(body),
        });

        if (!response.ok) throw new Error("Failed to fetch chat list");

        const data = await response.json();

        // Sort messages by NGAY_GUI ascending
        console.log("Loaded messages:", data.data);
        const sortedMessages = data.data.sort((a, b) => {
          const dateA = parseCustomDateString(a.NGAY_GUI);
          const dateB = parseCustomDateString(b.NGAY_GUI);
          return dateA - dateB;
        });
        console.log("Sorted messages:", sortedMessages);

        return sortedMessages;
      } catch {
        return [];
      } finally {
        spinnerOverlay.style.display = "none";
      }
    }

    async function appendMessageHistory(messages, prepend = false) {
      const fragment = document.createDocumentFragment();

      for (const msg of messages) {
        const isMe = userId === msg.MA_DOI_TAC_NSD;
        const msgDiv = document.createElement("div");
        msgDiv.classList.add(isMe ? "me" : "partner");
        msgDiv.innerHTML = `
            <div class="info">
                ${
                  isMe
                    ? `<div class="message-title">
                  <h5>${msg.TEN}</h5>
                  <p class="message-time">${msg.NGAY_GUI}</p>
                </div>
                <img class="logo-item" src="${msg.LINK_LOGO}" alt="Logo" />`
                    : `<img class="logo-item" src="${msg.LINK_LOGO}" alt="Logo" />
                <div class="message-title">
                  <h5>${msg.TEN}</h5>
                  <p class="message-time">${msg.NGAY_GUI}</p>
                </div>`
                }
            </div>
            <div class="message">
                <p>${msg.NOI_DUNG_TIN_NHAN}</p>
            </div>
        `;
        fragment.appendChild(msgDiv);
      }

      if (prepend) {
        messageContainer.insertBefore(fragment, messageContainer.firstChild);
      } else {
        messageContainer.appendChild(fragment);
      }
    }

    async function loadMoreMessages() {
      if (isLoading || !hasMoreMessages || !selectedChat) {
        return;
      }

      isLoading = true;

      const oldScrollHeight = messageContainer.scrollHeight;
      const oldScrollTop = messageContainer.scrollTop;

      try {
        currentPage++;
        const messages = await loadMessageHistory(
          selectedChat.hsbl,
          currentPage
        );

        if (messages.length === 0) {
          hasMoreMessages = false;
          console.log("Đã tải hết tin nhắn");
          return;
        }

        await appendMessageHistory(messages, true);

        const newScrollHeight = messageContainer.scrollHeight;
        messageContainer.scrollTop =
          newScrollHeight - oldScrollHeight + oldScrollTop;
      } catch (error) {
        console.error("Lỗi khi load thêm tin nhắn:", error);
        currentPage--;
      } finally {
        isLoading = false;
      }
    }

    // ================== VALIDATION FUNCTIONS ==================
    function validateInfoInputs() {
      let isValid = true;

      if (!hsblInput.value.trim()) {
        hsblInput.classList.add("error");
        isValid = false;
      } else {
        hsblInput.classList.remove("error");
      }

      if (!userNameInput.value.trim()) {
        userNameInput.classList.add("error");
        isValid = false;
      } else {
        userNameInput.classList.remove("error");
      }

      return isValid;
    }

    async function validateContractId(contractId) {
      try {
        const body = {
          so_hsbl_bv: contractId,
          ma_doi_tac_nsd_partner: selectedChat.id,
        };

        const header = {
          ConnectionId: connection.connectionId || "",
          eAction: "XNN3Q5NN1PLC12R",
        };

        spinnerOverlay.style.display = "flex";

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
          method: "POST",
          headers: header,
          body: JSON.stringify(body),
        });

        if (!response.ok) {
          const data = await response.json();
          return data.message || "Lỗi khi xác thực hợp đồng";
        }

        return null;
      } catch {
        return "Dịch vụ tạm thời không khả dụng, thử lại sau";
      } finally {
        spinnerOverlay.style.display = "none";
      }
    }

    // ================== EVENT LISTENERS ==================
    // Auto resize textarea
    textarea.addEventListener("input", autoResize, false);

    // Scroll handlers
    const handleScroll = debounce(function () {
      if (messageContainer.scrollTop < SCROLL_THRESHOLD) {
        loadMoreMessages();
      }
    }, DEBOUNCE_DELAY);

    messageContainer.addEventListener("scroll", handleScroll);

    const handleChatListScroll = debounce(function () {
      console.log("Scroll chat list:", chatBoxListContainer.scrollTop);
      const scrollTop = chatBoxListContainer.scrollTop;
      const scrollHeight = chatBoxListContainer.scrollHeight;
      const clientHeight = chatBoxListContainer.clientHeight;

      if (
        scrollTop + clientHeight >=
        scrollHeight - SCROLL_LOAD_MORE_THRESHOLD
      ) {
        loadMoreChatList();
      }
    }, DEBOUNCE_DELAY);

    chatBoxListContainer.addEventListener("scroll", handleChatListScroll);

    // Input validation listeners
    hsblInput.addEventListener("input", function () {
      if (this.value.trim()) {
        this.classList.remove("error");
      }
    });

    userNameInput.addEventListener("input", function () {
      if (this.value.trim()) {
        this.classList.remove("error");
      }
    });

    // Display initialization
    chatBoxContainer.style.display = chatBoxContainerDisplay ? "none" : "flex";
    chatBoxListContainer.style.display = chatBoxListContainerDisplay
      ? "none"
      : "flex";
    chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? "none" : "flex";
    chatDetails.style.display = chatDetailsDisplay ? "none" : "flex";
    spinnerOverlay.style.display = "none";

    // Chat box icon click
    chatBoxIcon.addEventListener("click", function () {
      if (chatBoxContainer) {
        chatListCurrentPage = 1;
        chatListIsLoading = false;
        currentSearchTerm = "";
        searchChatInput.value = "";

        loadChatList();
        chatBoxContainerDisplay = !chatBoxContainerDisplay;
        chatBoxContainer.style.display = chatBoxContainerDisplay
          ? "none"
          : "flex";
      }
    });

    // Close button
    btnX.addEventListener("click", function () {
      if (chatBoxContainer) {
        chatBoxContainerDisplay = true;
        chatBoxContainer.style.display = "none";
      }
    });

    // Close list button
    btnListX.addEventListener("click", function () {
      if (chatBoxContainer) {
        chatBoxContainerDisplay = true;
        chatBoxContainer.style.display = "none";
      }
    });

    // Search handlers
    searchChatIcon.addEventListener("click", function () {
      const searchTerm = searchChatInput.value.trim();
      currentSearchTerm = searchTerm;

      chatListCurrentPage = 1;
      chatListIsLoading = false;

      loadChatList(currentSearchTerm);
    });

    searchChatInput.addEventListener("keypress", function (event) {
      if (event.key === "Enter") {
        const searchTerm = searchChatInput.value.trim();
        currentSearchTerm = searchTerm;

        chatListCurrentPage = 1;
        chatListIsLoading = false;

        loadChatList(currentSearchTerm);
      }
    });

    // Turn back button
    turnBackButton.addEventListener("click", function () {
      if (chatBoxInputInfo) {
        chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
        chatBoxListContainer.style.display = chatBoxListContainerDisplay
          ? "none"
          : "flex";
        chatBoxFilter.style.display = chatBoxListContainerDisplay
          ? "none"
          : "flex";

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay
          ? "none"
          : "flex";

        userNameInput.classList.remove("error");
        hsblInput.classList.remove("error");
        errorInfoInput.textContent = "";
        hsblInput.value = "";
      }
    });

    // Continue button
    continueButton.addEventListener("click", async function () {
      if (chatDetails) {
        if (!validateInfoInputs()) {
          return;
        }

        if (selectedChat) {
          selectedChat.hsbl = hsblInput.value.trim();
          selectedChat.userName = userNameInput.value.trim();
        }

        const errorMessage = await validateContractId(selectedChat.hsbl);
        if (errorMessage) {
          errorInfoInput.textContent = errorMessage;
          return;
        }

        errorInfoInput.textContent = "";

        // Join group
        connection
          .invoke("JoinGroupAsync", selectedChat.hsbl)
          .then(() => {
            console.log(`Đã join nhóm: ${selectedChat.hsbl}`);
          })
          .catch((err) => console.error(err.toString()));

        var messages = await loadMessageHistory(selectedChat.hsbl, 1);
        await appendMessageHistory(messages);

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay
          ? "none"
          : "flex";

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? "none" : "flex";

        setTimeout(scrollToBottom, 0);
      }
    });

    // Details back button
    detailsBackButton.addEventListener("click", function () {
      if (chatDetails) {
        // Leave group
        connection
          .invoke("RemoveFromGroupAsync", selectedChat.hsbl)
          .then(() => {
            console.log(`Đã rời nhóm: ${selectedChat.hsbl}`);
          })
          .catch((err) => console.error(err.toString()));

        // Reset state before go back
        currentPage = 1;
        hasMoreMessages = true;
        isLoading = false;
        messageContainer.innerHTML = "";

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay
          ? "none"
          : "flex";

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? "none" : "flex";
      }
    });

    // Send message button
    btnSendMessage.addEventListener("click", async function () {
      const message = shadowRoot.getElementById("message-input").value;
      console.log("Gửi tin nhắn:", message);
      if (message) {
        try {
          await connection.invoke(
            "SendMessageToGroupAsync",
            selectedChat.hsbl,
            message,
            userNameInput.value.trim()
          );
          shadowRoot.getElementById("message-input").value = "";

          const textarea = shadowRoot.getElementById("message-input");
          textarea.style.height = "auto";
        } catch (err) {
          console.error("Lỗi gửi tin nhắn:", err);
        }
      }
    });

    // // ================== EMOJI PICKER ==================
    // // Tạo picker động (chỉ tạo một lần)
    // const picker = document.createElement('emoji-picker');

    // // Thêm picker vào DOM (dưới message-sending để popup đúng vị trí)
    // shadowRoot.querySelector('.message-sending').appendChild(picker);

    // // Xử lý chọn emoji → chèn vào textarea
    // picker.addEventListener('emoji-click', (event) => {
    //   const emoji = event.detail.unicode;

    //   const start = messageInput.selectionStart;
    //   const end = messageInput.selectionEnd;
    //   const text = messageInput.value;

    //   messageInput.value = text.substring(0, start) + emoji + text.substring(end);

    //   const newPos = start + emoji.length;
    //   messageInput.setSelectionRange(newPos, newPos);
    //   messageInput.focus();

    //   picker.classList.remove('show');

    //   messageInput.dispatchEvent(new Event('input'));
    // });

    // // Toggle hiển thị picker khi click nút emoji
    // emojiButton.addEventListener('click', (e) => {
    //   e.stopPropagation();
    //   picker.classList.toggle('show');
    // });

    // // Đóng picker khi click bên ngoài
    // document.addEventListener('click', (e) => {
    //   if (!picker.contains(e.target) && e.target !== emojiButton) {
    //     picker.classList.remove('show');
    //   }
    // });

    // ================== SIGNALR CONNECTION ==================
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(
        `${BASE_URL}chatHub?token=${token}&ePartnerCode=${ePartnerCode}`,
        {
          withCredentials: false,
        }
      )
      .configureLogging(signalR.LogLevel.Information)
      .withAutomaticReconnect()
      .build();

    // Nhận tin nhắn từ server
    connection.on("ReceiveGroupMessage", (data) => {
      console.log("Tin nhắn nhận được:", data);
      const isMe = userId === data.ma_doi_tac_nsd;
      const msg = document.createElement("div");
      msg.classList.add(isMe ? "me" : "partner");
      msg.innerHTML = `
          <div class="info">
          ${
            isMe
              ? `<div class="message-title">
                <h5>${data.ten}</h5>
                <p class="message-time">${data.ngay_gui}</p>
              </div>
              <img class="logo-item" src="${data.link_logo}" alt="Logo" />`
              : `<img class="logo-item" src="${data.link_logo}" alt="Logo" />
              <div class="message-title">
                <h5>${data.ten}</h5>
                <p class="message-time">${data.ngay_gui}</p>
              </div>`
          }
          </div>
          <div class="message">
              <p>${data.noi_dung_tin_nhan}</p>
          </div>
      `;
      shadowRoot.getElementById("message-container").appendChild(msg);
      scrollToBottom();
    });

    // Start connection
    connection
      .start()
      .then(() => {
        console.log("Kết nối SignalR thành công!");
      })
      .catch((err) => console.error("Lỗi kết nối SignalR:", err));
    // ================== END OF FILE ==================
  }

  async initSignalR() {
    const signalR = window.signalR || (await this.loadSignalR());

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE_URL}chatHub`, { withCredentials: false })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    // Thêm các on listener nếu cần từ script.js, nhưng script.js dùng connection riêng

    try {
      await this.connection.start();
      console.log("SignalR Connected.");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
    }
  }

  loadSignalR() {
    return new Promise((resolve, reject) => {
      if (typeof signalR !== "undefined") return resolve();

      const script = document.createElement("script");
      script.src =
        "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.0/signalr.min.js";
      script.onload = () => {
        console.log("SignalR đã tải xong.");
        resolve();
      };
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  setupEmojiPickerAfterLoad() {
    const shadow = this.shadowRoot;
    const messageSending = shadow.querySelector(".message-sending");
    const emojiButton = shadow.querySelector("#emoji-button");
    const messageInput = shadow.querySelector("#message-input");

    if (!messageSending || !emojiButton || !messageInput) return;

    // Tạo emoji-picker element
    let picker = messageSending.querySelector("emoji-picker");
    if (!picker) {
      picker = document.createElement("emoji-picker");
      messageSending.appendChild(picker);
    }

    // Xử lý chọn emoji
    picker.addEventListener("emoji-click", (event) => {
      const emoji = event.detail.unicode;
      const start = messageInput.selectionStart;
      const end = messageInput.selectionEnd;
      messageInput.value =
        messageInput.value.substring(0, start) +
        emoji +
        messageInput.value.substring(end);
      const newPos = start + emoji.length;
      messageInput.setSelectionRange(newPos, newPos);
      messageInput.focus();
      picker.style.display = "none";
      messageInput.dispatchEvent(new Event("input")); // resize textarea
    });

    // Toggle picker
    emojiButton.addEventListener("click", (e) => {
      e.stopPropagation();
      picker.style.display =
        picker.style.display === "block" ? "none" : "block";
    });

    // Đóng khi click ngoài
    document.addEventListener("click", (e) => {
      if (!picker.contains(e.target) && e.target !== emojiButton) {
        picker.style.display = "none";
      }
    });
  }
}

customElements.define("chat-widget", ChatWidget);
