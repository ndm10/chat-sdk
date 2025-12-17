class ChatWidget extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });

    // Template HTML + CSS
    const template = document.createElement('template');
    template.innerHTML = `
      <style>
        /* Reset + Scrollbar */
        html, body, * { margin: 0; padding: 0; box-sizing: border-box; }
        *::-webkit-scrollbar { width: 8px; height: 8px; }
        *::-webkit-scrollbar-track { background: transparent; }
        *::-webkit-scrollbar-thumb {
          border-radius: 9999px;
          border: 4px solid rgba(0,0,0,0);
          background-clip: padding-box;
          background-color: rgba(0,0,0,0.3);
        }
        *::-webkit-scrollbar-thumb:hover {
          background-color: rgba(0,0,0,0.5);
        }

        /* Main styles from styles.css */
        :host {
          display: block;
          font-family: Arial, sans-serif;
        }

        .chat-container {
          position: fixed;
          bottom: 20px;
          left: 20px;
          z-index: 9999;
        }

        .chat-icon {
          display: flex;
          width: 60px;
          height: 60px;
          justify-content: center;
          align-items: center;
          background-color: #aac96f;
          border-radius: 50%;
          cursor: pointer;
          box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        }

        .chat-icon svg {
          width: 36px;
          height: 36px;
          fill: white;
        }

        .chat-box {
          position: absolute;
          top: -78vh;
          left: 42px;
          height: 80vh;
          width: 500px;
          border-radius: 16px;
          background-color: #fafafaff;
          overflow: hidden;
          box-shadow: 0 4px 20px rgba(100, 100, 100, 0.5);
          display: none;
        }

        .chat-box-header {
          background-color: #aac96f;
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
          fill: #666;
          cursor: pointer;
        }

        .chat-filter input {
          border: none;
          background-color: inherit;
          width: 100%;
          font-size: 1rem;
        }

        .chat-filter input:focus { outline: none; }

        .list-items {
          height: calc(70vh - 60px);
          overflow-y: auto;
        }

        .list-items ul {
          list-style-type: none;
        }

        .list-items ul li {
          padding: 10px;
          border-bottom: 1px solid #ddd;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          cursor: pointer;
        }

        .list-items ul li:hover {
          background-color: #f0f0f0;
        }

        .list-items .item-header {
          margin: 2% 0;
          font-size: 1.1rem;
        }

        .info-input {
          background-color: #f9f9f9;
          display: flex;
          flex-direction: column;
          gap: 20px;
          justify-content: center;
          align-items: center;
          height: 70vh;
          padding: 20px;
        }

        .info-input h3 {
          font-size: 1.5rem;
          color: #333;
        }

        .info-input input {
          width: 70%;
          padding: 12px 16px;
          border: 1px solid #ccc;
          border-radius: 50px;
          font-size: 1.175rem;
        }

        .info-input input:focus { outline: none; }

        #info-input-buttons {
          display: flex;
          gap: 12px;
        }

        .info-input button {
          display: flex;
          align-items: center;
          padding: 12px 24px;
          border: none;
          border-radius: 50px;
          background-color: #aac96f;
          color: white;
          font-size: 1rem;
          cursor: pointer;
        }

        .info-input button svg {
          fill: white;
          width: 20px;
          height: 20px;
          margin-right: 8px;
        }

        .chat-details {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-color: #ffffff;
          display: flex;
          flex-direction: column;
          display: none;
        }

        .details-header {
          padding: 12px 8px;
          background-color: #aac96f;
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 1rem;
        }

        .details-header .title-header {
          background-color: #fff;
          color: black;
          border-radius: 16px;
          padding: 5px 12px;
          font-weight: 600;
        }

        .details-header button {
          background: white;
          border: none;
          border-radius: 16px;
          cursor: pointer;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.25rem 0.75rem;
          color: black;
        }

        .details-header button svg {
          width: 20px;
          height: 20px;
          fill: black;
        }

        .message-container {
          flex: 1;
          display: flex;
          flex-direction: column;
          padding: 10px;
          gap: 15px;
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
          font-weight: bold;
          color: white;
        }

        .info {
          display: flex;
          gap: 10px;
          align-items: center;
        }

        .partner .info { justify-content: flex-start; }
        .me .info { justify-content: flex-end; }

        .message {
          display: flex;
        }

        .message p {
          max-width: 75%;
          padding: 10px 14px;
          border-radius: 12px;
          margin: 0;
          line-height: 1.4;
        }

        .partner .message { justify-content: flex-start; margin-left: 10%; }
        .me .message { justify-content: flex-end; margin-right: 10%; }

        .partner .message p { background-color: #f0f0f0; }
        .me .message p { background-color: rgba(75, 75, 218, 1); color: white; }

        .message-sending {
          display: flex;
          align-items: center;
          padding: 10px;
          gap: 10px;
          background-color: rgb(170, 201, 111);
        }

        .message-sending input {
          flex: 1;
          padding: 10px 16px;
          border: none;
          border-radius: 50px;
          font-size: 1rem;
        }

        .message-sending input:focus { outline: none; }

        .message-sending button {
          background-color: #5b5bdfff;
          border: none;
          border-radius: 50px;
          color: white;
          padding: 10px 24px;
          font-size: 1rem;
          cursor: pointer;
        }

        .message-sending button:hover {
          background-color: #4b4bda;
        }
      </style>

      <div class="chat-container">
        <div class="chat-icon">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
            <path d="M64 304C64 358.4 83.3 408.6 115.9 448.9L67.1 538.3C65.1 542 64 546.2 64 550.5C64 564.6 75.4 576 89.5 576C93.5 576 97.3 575.4 101 573.9L217.4 524C248.8 536.9 283.5 544 320 544C461.4 544 576 436.5 576 304C576 171.5 461.4 64 320 64C178.6 64 64 171.5 64 304zM158 471.9C167.3 454.8 165.4 433.8 153.2 418.7C127.1 386.4 112 346.8 112 304C112 200.8 202.2 112 320 112C437.8 112 528 200.8 528 304C528 407.2 437.8 496 320 496C289.8 496 261.3 490.1 235.7 479.6C223.8 474.7 210.4 474.8 198.6 479.9L140 504.9L158 471.9zM208 336C225.7 336 240 321.7 240 304C240 286.3 225.7 272 208 272C190.3 272 176 286.3 176 304C176 321.7 190.3 336 208 336zM352 304C352 286.3 337.7 272 320 272C302.3 272 288 286.3 288 304C288 321.7 302.3 336 320 336C337.7 336 352 321.7 352 304zM432 336C449.7 336 464 321.7 464 304C464 286.3 449.7 272 432 272C414.3 272 400 286.3 400 304C400 321.7 414.3 336 432 336z"/>
          </svg>
        </div>

        <div class="chat-box">
          <div class="chat-box-header">
            <div class="chat-filter">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                <path d="M480 272C480 317.9 465.1 360.3 440 394.7L566.6 521.4C579.1 533.9 579.1 554.2 566.6 566.7C554.1 579.2 533.8 579.2 521.3 566.7L394.7 440C360.3 465.1 317.9 480 272 480C157.1 480 64 386.9 64 272C64 157.1 157.1 64 272 64C386.9 64 480 157.1 480 272zM272 416C351.5 416 416 351.5 416 272C416 192.5 351.5 128 272 128C192.5 128 128 192.5 128 272C128 351.5 192.5 416 272 416z"/>
              </svg>
              <input type="text" placeholder="Tìm kiếm cuộc trò chuyện..." />
            </div>
          </div>

          <div class="list-items">
            <ul>
              <li><h4 class="item-header">ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h4></li>
              <li><h4 class="item-header">MIC - Tổng công ty Cổ phần Bảo hiểm Quân đội</h4></li>
              <li><h4 class="item-header">PJICO - Tổng Công ty Bảo hiểm PJICO</h4></li>
            </ul>
          </div>

          <div class="info-input">
            <h3>Nhập thông tin chat</h3>
            <input type="text" placeholder="Nhập số HSBL" />
            <input type="text" placeholder="Nhập tên người dùng" />
            <div id="info-input-buttons">
              <button id="turn-back-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
                </svg>
                Quay lại
              </button>
              <button id="continue-button">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M566.6 342.6C579.1 330.1 579.1 309.8 566.6 297.3L406.6 137.3C394.1 124.8 373.8 124.8 361.3 137.3C348.8 149.8 348.8 170.1 361.3 182.6L466.7 288L96 288C78.3 288 64 302.3 64 320C64 337.7 78.3 352 96 352L466.7 352L361.3 457.4C348.8 469.9 348.8 490.2 361.3 502.7C373.8 515.2 394.1 515.2 406.6 502.7L566.6 342.7z"/>
                </svg>
                Tiếp tục
              </button>
            </div>
          </div>

          <div class="chat-details">
            <div class="details-header">
              <button id="btn-details-back">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
                  <path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z"/>
                </svg>
                Quay lại
              </button>
              <h4 class="title-header">PJICO - Tổng Công ty Bảo hiểm PJICO</h4>
            </div>

            <div class="message-container">
              <!-- Sample messages -->
              <div class="partner">
                <div class="info"><div class="avatar">P</div><h5>ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC</h5></div>
                <div class="message"><p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Nihil, quae!</p></div>
              </div>
              <div class="me">
                <div class="info"><h5>Nguyễn Thị Dinh</h5><div class="avatar">M</div></div>
                <div class="message"><p>Lorem ipsum, dolor sit amet consectetur adipisicing elit. Iusto quia facilis dolores modi natus, rem dolor eveniet suscipit veniam ipsa.</p></div>
              </div>
            </div>

            <div class="message-sending">
              <input type="text" placeholder="Nhập tin nhắn..." />
              <button id="send-message-button">Gửi</button>
            </div>
          </div>
        </div>
      </div>
    `;

    this.shadowRoot.appendChild(template.content.cloneNode(true));

    // Logic JavaScript (từ script.js, đã tối ưu)
    const chatIcon = this.shadowRoot.querySelector('.chat-icon');
    const chatBox = this.shadowRoot.querySelector('.chat-box');
    const listItems = this.shadowRoot.querySelector('.list-items');
    const infoInput = this.shadowRoot.querySelector('.info-input');
    const chatDetails = this.shadowRoot.querySelector('.chat-details');
    const listItem = this.shadowRoot.querySelectorAll('.list-items li');
    const turnBackBtn = this.shadowRoot.querySelector('#turn-back-button');
    const continueBtn = this.shadowRoot.querySelector('#continue-button');
    const detailsBackBtn = this.shadowRoot.querySelector('#btn-details-back');

    // Toggle chat box
    chatIcon.addEventListener('click', () => {
      chatBox.style.display = chatBox.style.display === 'block' ? 'none' : 'block';
    });

    // Click vào item danh sách → ẩn list, hiện form nhập info
    listItem.forEach(item => {
      item.addEventListener('click', () => {
        listItems.style.display = 'none';
        infoInput.style.display = 'flex';
      });
    });

    // Quay lại từ form nhập info
    turnBackBtn.addEventListener('click', () => {
      listItems.style.display = 'block';
      infoInput.style.display = 'none';
    });

    // Tiếp tục → mở chat details
    continueBtn.addEventListener('click', () => {
      infoInput.style.display = 'none';
      chatDetails.style.display = 'flex';
    });

    // Quay lại từ chat details
    detailsBackBtn.addEventListener('click', () => {
      infoInput.style.display = 'flex';
      chatDetails.style.display = 'none';
    });
  }
}

// Đăng ký custom element
customElements.define('chat-widget', ChatWidget);