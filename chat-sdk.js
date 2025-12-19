class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.connection = null;
    this.currentChatId = 'PJICO';
    this.hubUrl = this.getAttribute('hub-url') || 'https://localhost:7299/chatHub';
  }

  connectedCallback() {
    this.render();
    this.initLogic();

    if (this.hubUrl) {
      this.initSignalR();
    }
  }

  render() {
    const position = this.getAttribute('position') || 'bottom-left';

    let containerStyles = 'bottom: 20px; left: 20px;';
    let boxStyles = 'top: -78vh; left: 42px;';

    switch (position) {
      case 'bottom-right':
        containerStyles = 'bottom: 20px; right: 20px; left: auto;';
        boxStyles = 'top: -78vh; right: 42px; left: auto; transform: translateX(-100%);';
        break;
      case 'top-left':
        containerStyles = 'top: 20px; left: 20px; bottom: auto;';
        boxStyles = 'bottom: 80px; top: auto; left: 42px; transform: translateY(100%);';
        break;
      case 'top-right':
        containerStyles = 'top: 20px; right: 20px; left: auto; bottom: auto;';
        boxStyles = 'bottom: 80px; top: auto; right: 42px; left: auto; transform: translateX(-100%) translateY(100%);';
        break;
      default:
    }

    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        /* Toàn bộ CSS từ styles.css */
        html, body, * { margin: 0; padding: 0; font-family: Arial, sans-serif; box-sizing: border-box; }

        #chat-icon {
          display: flex;
          width: 60px;
          height: 60px;
          justify-content: center;
          align-items: center;
        }

        .chat-container {
          position: fixed;
          ${containerStyles}
        }

        #chat-box {
          position: absolute;
          ${boxStyles}
          height: 80vh;
          width: 500px;
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 4px 8px rgba(63, 63, 63, 0.5);
          display: flex;
          flex-direction: column;
          flex: 1;
        }

        .chat-box-header {
          background-color: #ffffffff;
          border-bottom: 1px solid #e7e7e7ff;
          box-shadow: 0 2px 4px rgba(165, 165, 165, 0.1);
          padding: 10px;
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
        }

        .chat-box-container {
          display: flex;
          flex-direction: column;
          height: 100%;
          overflow-y: auto;
          background-color: #ffffffff;
        }

        #list-items {
          position: relative;
          background-color: #ffffffff;
          display: flex;
          flex-direction: column;
          width: 100%;
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
        }

        #list-items ul li:hover {
          background-color: #f0f0f0;
        }

        #list-items .item-header {
          margin: 2% 0;
        }

        .readed {
          color: gray;
        }

        #info-input {
          background-color: #ffffffff;
          display: flex;
          flex-direction: column;
          gap: 10px;
          justify-content: center;
          align-items: center;
          height: 100%;
        }

        #info-input input {
          width: 60%;
          padding: 10px 10px;
          border: 1px solid #ccc;
          border-radius: 50px;
          font-size: 1.175rem;
        }

        #info-input input:focus {
          outline: none;
        }

        #info-input-buttons {
          display: flex;
          gap: 0.825rem;
        }

        #info-input #turn-back-button,
        #info-input #continue-button {
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
        .details-header #btn-x:hover {
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

        .partner .info {
          justify-content: flex-start;
        }

        .me .info {
          justify-content: flex-end;
        }

        .message {
          display: flex;
        }

        .message p {
          max-width: 75%;
          padding: 10px;
          border-radius: 12px;
          margin: 0;
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
          padding: 10px 20px;
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

        .message-sending #send-message-button {
          background-color: #5b5bdfff;
          border: none;
          border-radius: 50px;
          padding: 10px 10px;
          font-size: 1rem;
          cursor: pointer;
          display: flex;
          justify-content: center;
          align-items: center;
        }

        .message-sending #send-message-button svg {
          width: 20px;
          height: 20px;
          fill: white;
        }

        .message-sending button:hover {
          background-color: #4b4bda;
        }

        /* RESPONSIVE ADJUSTMENTS */
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

          #chat-icon svg {
            width: 35px;
            height: 35px;
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
            max-width: 90%;
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

          .message-sending #send-message-button {
            padding: 8px;
          }
        }
      </style>

      <div class="chat-container">
        <div id="chat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M64 304C64 358.4 83.3 408.6 115.9 448.9L67.1 538.3C65.1 542 64 546.2 64 550.5C64 564.6 75.4 576 89.5 576C93.5 576 97.3 575.4 101 573.9L217.4 524C248.8 536.9 283.5 544 320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304zM158 471.9C167.3 454.8 165.4 433.8 153.2 418.7C127.1 386.4 112 346.8 112 304C112 200.8 202.2 112 320 112C437.8 112 528 200.8 528 304C528 407.2 437.8 496 320 496C289.8 496 261.3 490.1 235.7 479.6C223.8 474.7 210.4 474.8 198.6 479.9L140 504.9L158 471.9zM208 336C225.7 336 240 321.7 240 304C240 286.3 225.7 272 208 272C190.3 272 176 286.3 176 304C176 321.7 190.3 336 208 336zM352 304C352 286.3 337.7 272 320 272C302.3 272 288 286.3 288 304C288 321.7 302.3 336 320 336C337.7 336 352 321.7 352 304zM432 336C449.7 336 464 321.7 464 304C464 286.3 449.7 272 432 272C414.3 272 400 286.3 400 304C400 321.7 414.3 336 432 336z" />
          </svg>
        </div>
        <div id="chat-box">
          <div class="chat-box-header">
            <div class="chat-filter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z" />
              </svg>
              <input type="text" placeholder="Tìm kiếm cuộc trò chuyện..." />
            </div>
          </div>
          <div class="chat-box-container">
            <!-- Chat list items -->
            <div id="list-items">
              <ul>
                <li><h4 class="item-header">ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h4></li>
                <li><h4 class="item-header">MIC - Tổng công ty Cổ phần Bảo hiểm Quân đội</h4></li>
                <li><h4 class="item-header">PJICO - Tổng Công ty Bảo hiểm PJICO</h4></li>
                <li><h4 class="item-header">ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h4></li>
                <li><h4 class="item-header">MIC - Tổng công ty Cổ phần Bảo hiểm Quân đội</h4></li>
                <li><h4 class="item-header">PJICO - Tổng Công ty Bảo hiểm PJICO</h4></li>
              </ul>
            </div>

            <!-- Chat info input -->
            <div id="info-input">
              <h3>Nhập thông tin chat</h3>
              <input type="text" placeholder="Nhập số HSBL" />
              <input type="text" placeholder="Nhập tên người dùng" />
              <div id="info-input-buttons">
                <button id="turn-back-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z" />
                  </svg>
                  Quay lại
                </button>
                <button id="continue-button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                    <path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z" />
                  </svg>
                  Tiếp tục
                </button>
              </div>
            </div>
          </div>

          <!-- Chat message detail -->
          <div id="chat-details">
            <div class="details-header">
              <button id="btn-details-back">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z" />
                </svg>
                Quay lại
              </button>
              <button id="btn-x">X</button>
            </div>

            <!-- Message chat details -->
            <div id="message-container">
              <div class="partner">
                <div class="info">
                  <div class="avatar">P</div>
                  <h5>ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h5>
                </div>
                <div class="message">
                  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil, quae!</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iusto quia facilis dolores modi natus, rem dolor eveniet suscipit veniam ipsa.</p>
                </div>
              </div>
              <div class="partner">
                <div class="info">
                  <div class="avatar">P</div>
                  <h5>ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h5>
                </div>
                <div class="message">
                  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil, quaeeeee!</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Hi</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iusto quia facilis dolores modi natus, rem dolor eveniet suscipit veniam ipsa.</p>
                </div>
              </div>
              <div class="partner">
                <div class="info">
                  <div class="avatar">P</div>
                  <h5>ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h5>
                </div>
                <div class="message">
                  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil, quaeeeee!</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Hi</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iusto quia facilis dolores modi natus, rem dolor eveniet suscipit veniam ipsa.</p>
                </div>
              </div>
              <div class="partner">
                <div class="info">
                  <div class="avatar">P</div>
                  <h5>ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h5>
                </div>
                <div class="message">
                  <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil, quaeeeee!</p>
                </div>
              </div>
              <div class="me">
                <div class="info">
                  <h5>Nguyễn Thị Dinh</h5>
                  <div class="avatar">M</div>
                </div>
                <div class="message">
                  <p>Hi</p>
                </div>
              </div>
            </div>

            <!-- Message input -->
            <div class="message-sending">
              <div class="message-content">
                <textarea id="message-input" rows="1" placeholder="Nhập tin nhắn..."></textarea>
              </div>
              <button id="send-message-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M322.5 351.7L523.4 150.9L391 520.3L322.5 351.7zM489.4 117L288.6 317.8L120 249.3L489.4 117zM70.1 280.8L275.9 364.4L359.5 570.2C364.8 583.3 377.6 591.9 391.8 591.9C406.5 591.9 419.6 582.7 424.6 568.8L602.6 72C606.1 62.2 603.6 51.4 596.3 44C589 36.6 578.1 34.2 568.3 37.7L71.4 215.7C57.5 220.7 48.3 233.8 48.3 248.5C48.3 262.7 56.9 275.5 70 280.8z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));
  }

  initLogic() {
    const chatIcon = this.shadowRoot.querySelector('#chat-icon');
    const chatBox = this.shadowRoot.querySelector('#chat-box');
    const listItems = this.shadowRoot.querySelector('#list-items');
    const infoInput = this.shadowRoot.querySelector('#info-input');
    const chatDetails = this.shadowRoot.querySelector('#chat-details');
    const listItem = this.shadowRoot.querySelectorAll('#list-items li');
    const turnBackBtn = this.shadowRoot.querySelector('#turn-back-button');
    const continueBtn = this.shadowRoot.querySelector('#continue-button');
    const detailsBackBtn = this.shadowRoot.querySelector('#btn-details-back');
    const sendBtn = this.shadowRoot.querySelector('#send-message-button');
    const messageInput = this.shadowRoot.querySelector('#message-input');
    const messageContainer = this.shadowRoot.querySelector('#message-container');
    const btnX = this.shadowRoot.querySelector('#btn-x');

    // Auto-resize textarea
    messageInput.addEventListener('input', () => {
      messageInput.style.height = 'auto';
      messageInput.style.height = `${messageInput.scrollHeight}px`;
    });

    // Scroll to bottom function
    const scrollToBottom = () => {
      messageContainer.scrollTop = messageContainer.scrollHeight;
    };

    // Initial displays (adjusted to match script.js)
    chatBox.style.display = 'none';
    listItems.style.display = 'flex';
    infoInput.style.display = 'none';
    chatDetails.style.display = 'none';

    // Toggle chat box
    chatIcon.addEventListener('click', () => {
      chatBox.style.display = chatBox.style.display === 'flex' ? 'none' : 'flex';
    });

    // Toggle chat box
    btnX.addEventListener('click', () => {
      chatBox.style.display = chatBox.style.display = 'none';
    });

    // Select list item
    listItem.forEach(item => {
      item.addEventListener('click', () => {
        listItems.style.display = listItems.style.display === 'flex' ? 'none' : 'flex';
        infoInput.style.display = infoInput.style.display === 'flex' ? 'none' : 'flex';
      });
    });

    // Turn back
    turnBackBtn.addEventListener('click', () => {
      listItems.style.display = listItems.style.display === 'flex' ? 'none' : 'flex';
      infoInput.style.display = infoInput.style.display === 'flex' ? 'none' : 'flex';
    });

    // Continue to details
    continueBtn.addEventListener('click', () => {
      infoInput.style.display = infoInput.style.display === 'flex' ? 'none' : 'flex';
      chatDetails.style.display = chatDetails.style.display === 'flex' ? 'none' : 'flex';
      setTimeout(scrollToBottom, 100);
    });

    // Details back
    detailsBackBtn.addEventListener('click', () => {
      infoInput.style.display = infoInput.style.display === 'flex' ? 'none' : 'flex';
      chatDetails.style.display = chatDetails.style.display === 'flex' ? 'none' : 'flex';
    });

    // Send message
    const sendMessage = () => {
      const text = messageInput.value.trim();
      if (!text) return;

      this.addMessage(text, 'me');
      if (this.connection) {
        this.connection.invoke("SendMessage", this.currentChatId, text)
          .catch(err => console.error("Lỗi gửi tin nhắn:", err));
      }
      messageInput.value = '';
      messageInput.style.height = 'auto';
      scrollToBottom();
    };

    sendBtn.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        sendMessage();
      }
    });
  }

  addMessage(text, sender = 'partner') {
    const messageContainer = this.shadowRoot.querySelector('#message-container');
    const messageDiv = document.createElement('div');
    messageDiv.className = sender;

    const infoDiv = document.createElement('div');
    infoDiv.className = 'info';

    if (sender === 'partner') {
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = 'P';
      infoDiv.appendChild(avatar);
      const name = document.createElement('h5');
      name.textContent = 'ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC';
      infoDiv.appendChild(name);
    } else {
      const name = document.createElement('h5');
      name.textContent = 'Nguyễn Thị Dinh';
      infoDiv.appendChild(name);
      const avatar = document.createElement('div');
      avatar.className = 'avatar';
      avatar.textContent = 'M';
      infoDiv.appendChild(avatar);
    }

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    const p = document.createElement('p');
    p.textContent = text;
    msgDiv.appendChild(p);

    messageDiv.appendChild(infoDiv);
    messageDiv.appendChild(msgDiv);
    messageContainer.appendChild(messageDiv);
  }

  async initSignalR() {
    const signalR = window.signalR || await this.loadSignalR();

    this.connection = new signalR.HubConnectionBuilder()
      .withUrl(this.hubUrl, { withCredentials: false })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Information)
      .build();

    this.connection.on("ReceiveMessage", (user, message) => {
      this.addMessage(message, 'partner');
    });

    try {
      await this.connection.start();
      console.log("SignalR Connected.");
    } catch (err) {
      console.error("SignalR Connection Error: ", err);
    }
  }

  loadSignalR() {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = "https://cdnjs.cloudflare.com/ajax/libs/microsoft-signalr/8.0.0/signalr.min.js";
      script.onload = () => resolve(window.signalR);
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }
}

customElements.define('chat-widget', ChatWidget);