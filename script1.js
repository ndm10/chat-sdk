// Nhập tên user khi load trang
let currentUser = prompt("Nhập id của bạn:", crypto.randomUUID());
if (!currentUser) { currentUser = "Anonymous"; }
else { document.querySelector('#welcome-text').innerHTML = `Xin chào, ${currentUser}!`; }

// Render chat list
const listEl = document.querySelector("#list-items ul");

function renderChatList(items) {
    listEl.innerHTML = items
        .map(
            item => `
        <li data-id="${item.id}">
          <img class="logo-item" src="${item.logo}" alt="Logo" />
          <h4 class="title-item">${item.name}</h4>
        </li>
      `
        )
        .join("");
}

// Load chat list from API
async function loadChatList() {
    try {
        const response = await fetch(`https://localhost:7299/api/User/users/${currentUser}`);
        if (!response.ok) throw new Error('Failed to fetch chat list');

        const data = await response.json();
        renderChatList(data);
        wireChatItemClicks();
    } catch (error) {
        console.error('Error loading chat list:', error);
        listEl.innerHTML = '<li style="padding: 20px; text-align: center;">Không thể tải danh sách chat</li>';
    }
}

// Selected chat item
let selectedChat = null;

// Auto-resize textarea
const textarea = document.getElementById('message-input');
textarea.addEventListener('input', autoResize, false);
function autoResize() {
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}

// Chat box toggle and navigation
let chatBoxContainerDisplay = true;
let chatBoxListContainerDisplay = false;
let chatBoxInputInfoDisplay = true;
let chatDetailsDisplay = true;

const infoTitle = document.querySelector('#info-input .info-header h4');
const chatBoxIcon = document.querySelector('#chat-icon');
const chatBoxContainer = document.querySelector('#chat-box');
const chatBoxFilter = document.querySelector('#chat-box-header');
const chatBoxListContainer = document.querySelector('#list-items');
const chatBoxInputInfo = document.querySelector('#info-input');
const turnBackButton = document.querySelector('#turn-back-button');
const continueButton = document.querySelector('#continue-button');
const chatDetails = document.querySelector('#chat-details');
const btnX = document.querySelector('#btn-x');
const detailsBackButton = document.querySelector('#btn-details-back');
const messageContainer = document.querySelector('#message-container');
const hsblInput = document.querySelector('#input-shsbl');
const userNameInput = document.querySelector('#input-username');
const errorInfoInput = document.querySelector('#error-info-input');
const btnSendMessage = document.querySelector('#btn-send-message');

function validateInfoInputs() {
    let isValid = true;

    if (!hsblInput.value.trim()) {
        hsblInput.classList.add('error');
        isValid = false;
    } else {
        hsblInput.classList.remove('error');
    }

    if (!userNameInput.value.trim()) {
        userNameInput.classList.add('error');
        isValid = false;
    } else {
        userNameInput.classList.remove('error');
    }

    return isValid;
}

let contract = '';
function validateContractId(contractId) {
    return fetch(`https://localhost:7299/api/Contract?contractName=${contractId}`)
        .then(response => {
            if (!response.ok) {
                errorInfoInput.textContent = `Mã hợp đồng không tồn tại.`;
                return false;
            }
            return true;
        })
        .catch(() => {
            errorInfoInput.textContent = `Hệ thống lỗi.`;
            return false;
        });
}

hsblInput.addEventListener('input', function () {
    if (this.value.trim()) {
        this.classList.remove('error');
    }
});

userNameInput.addEventListener('input', function () {
    if (this.value.trim()) {
        this.classList.remove('error');
    }
});

// Function to wire click events on chat list items
function wireChatItemClicks() {
    const chatBoxListItem = document.querySelectorAll('#list-items li');
    chatBoxListItem.forEach((item) => {
        item.addEventListener('click', function () {
            if (chatBoxInputInfo) {
                chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
                chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
                chatBoxFilter.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';

                chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
                chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

                const { id } = item.dataset;
                const name = item.querySelector('.title-item')?.textContent?.trim() || '';

                selectedChat = { id, name };
                infoTitle.textContent = name || 'Không tìm thấy cuộc trò chuyện!';
                userNameInput.value = currentUser;
            }
        });
    });
}

// Function to scroll to the bottom of message container
function scrollToBottom() {
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

chatBoxContainer.style.display = chatBoxContainerDisplay ? 'none' : 'flex';
chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';
chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';

chatBoxIcon.addEventListener('click', function () {
    if (chatBoxContainer) {
        loadChatList();
        chatBoxContainerDisplay = !chatBoxContainerDisplay;
        chatBoxContainer.style.display = chatBoxContainerDisplay ? 'none' : 'flex';
    }
});

btnX.addEventListener('click', function () {
    if (chatBoxContainer) {
        chatBoxContainerDisplay = true;
        chatBoxContainer.style.display = 'none';
    }
});

turnBackButton.addEventListener('click', function () {
    if (chatBoxInputInfo) {
        chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
        chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
        chatBoxFilter.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        userNameInput.classList.remove('error');
        hsblInput.classList.remove('error');
        errorInfoInput.textContent = '';
        hsblInput.value = '';
    }
});

continueButton.addEventListener('click', async function () {
    if (chatDetails) {
        if (!validateInfoInputs() || !(await validateContractId(hsblInput.value.trim()))) {
            return;
        }

        if (selectedChat) {
            selectedChat.hsbl = hsblInput.value.trim();
            selectedChat.userName = userNameInput.value.trim();
        }

        errorInfoInput.textContent = '';

        connection.invoke("JoinGroup", selectedChat.hsbl).then(() => {
            console.log(`Đã tham gia nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';

        // Scroll to bottom after a short delay to ensure content is rendered
        setTimeout(scrollToBottom, 0);
    }
})

detailsBackButton.addEventListener('click', function () {
    if (chatDetails) {
        connection.invoke("LeaveGroup", selectedChat.hsbl).then(() => {
            console.log(`Đã rời nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';
    }
});

btnSendMessage.addEventListener('click', async function () {
    const message = document.getElementById('message-input').value.trim();
    if (message) {
        try {
            await connection.invoke("SendGroupMessage", currentUser, selectedChat.hsbl, message);
            document.getElementById("message-input").value = "";

            // reset textarea rows
            const textarea = document.getElementById('message-input');
            textarea.style.height = 'auto';
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
        }
    }
});

// SignalR connection setup
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`https://localhost:7299/chatHub?userId=${encodeURIComponent(currentUser)}`, {
        withCredentials: false,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

// Nhận tin nhắn từ server
connection.on("ReceiveGroupMessage", (user, message) => {
    console.log('Tin nhắn nhận được:', user, message);
    // Check if message come from the current user or not
    const isMe = user.id.toString().toLowerCase() === currentUser.toString().toLowerCase();
    const msg = document.createElement("div");
    msg.classList.add(isMe ? 'me' : 'partner');
    msg.innerHTML = `
        <div class="info">
        ${isMe ?
            `<h5>${user.name}</h5>
            <img class="logo-item" src="${user.logo}" alt="Logo" />`
            :
            `<img class="logo-item" src="${user.logo}" alt="Logo" />
            <h5>${user.name}</h5>`
        }
        </div>
        <div class="message">
            <p>
                ${message}
            </p>
        </div>
    `;
    document.getElementById("message-container").appendChild(msg);
    scrollToBottom();
});

// Kết nối
connection
    .start()
    .then(() => {
        console.log("Kết nối thành công!");
    })
    .catch((err) => console.error(err));