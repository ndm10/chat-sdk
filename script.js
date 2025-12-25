// Nhập tên user khi load trang
let token = prompt("Nhập access token của bạn:", "");
if (!token) { token = "Anonymous"; }

let userId = prompt("Nhập mã của bạn:", "");
if (!userId) { userId = "Anonymous"; }

let fullName = prompt("Nhập tên đầy đủ của bạn:");
if (!fullName) { fullName = "Khách hàng"; }

let ePartnerCode = prompt("Nhập ePartnerCode của bạn:", "BENH_VIEN");
if (!ePartnerCode) { ePartnerCode = "PORTAL"; }

document.querySelector('#welcome-text').innerHTML = `Xin chào, ${token}!`;

const baseURL = 'https://localhost:7004/';

const pageSize = 10;

// Function to parse custom date string format
function parseCustomDateString(str) {
    // Expected format: dd/MM/yyyy HH:mm:ss
    const [date, time] = str.split(' ');
    const [day, month, year] = date.split('/');
    return new Date(`${year}-${month}-${day}T${time}`);
}

// Render chat list
const listEl = document.querySelector("#list-items ul");
function renderChatList(items, append = false) {
    const htmlContent = items
        .map(
            item => `
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

// Kiểm tra nếu danh sách không lấp đầy container, tự động load thêm
async function ensureChatListFilled() {
    // Kiểm tra xem danh sách có đủ để scroll hay chưa
    const scrollHeight = chatBoxListContainer.scrollHeight;
    const clientHeight = chatBoxListContainer.clientHeight;

    // Nếu chiều cao nội dung <= chiều cao container (không scroll được)
    // thì load thêm trang tiếp theo
    if (scrollHeight <= clientHeight && chatListHasMore && !chatListIsLoading) {
        console.log('Danh sách chưa đủ để scroll, load thêm...');
        await loadMoreChatList();

        // Recursive call để tiếp tục load nếu vẫn chưa đủ
        setTimeout(() => ensureChatListFilled(), 100);
    }
}

// Load chat list from API
// Load chat list from API
async function loadChatList(searchTerm, page = 1, append = false) {
    try {
        const body = {
            "trang": page,
            "so_dong": pageSize,
            "nd_tim": searchTerm || ""
        }

        const header = {
            "ConnectionId": connection.connectionId || "",
            "eAction": "OO78LLZ0T7NLEZ3",
        }

        const response = await fetch(`${baseURL}api/chat/execute`, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error('Failed to fetch chat list');

        const data = await response.json();

        // Check if there are more items
        if (data.data.length === 0 || data.data.length >= data.output.tong_so_dong) {
            chatListHasMore = false;
        } else {
            chatListHasMore = true;
        }

        renderChatList(data.data, append);
        wireChatItemClicks();

        // Kiểm tra và load thêm nếu cần (chỉ ở lần load đầu tiên)
        if (page === 1 && !append) {
            setTimeout(() => ensureChatListFilled(), 50);
        }

        return data.data.length; // Return số lượng items để kiểm tra
    } catch (error) {
        console.error('Error loading chat list:', error);
        if (!append) {
            listEl.innerHTML = '<li style="padding: 20px; text-align: center;">Không thể tải danh sách chat</li>';
        }
        return 0;
    }
}

// Load more chat list items (infinity scroll)
async function loadMoreChatList() {
    if (chatListIsLoading || !chatListHasMore) {
        return;
    }

    chatListIsLoading = true;

    try {
        chatListCurrentPage++;

        const count = await loadChatList(currentSearchTerm, chatListCurrentPage, true);

        if (count === 0) {
            chatListHasMore = false;
            console.log('Đã tải hết danh sách chat');
        }
    } catch (error) {
        console.error('Lỗi khi load thêm chat list:', error);
        chatListCurrentPage--; // Rollback page nếu lỗi
    } finally {
        chatListIsLoading = false;
    }
}

// Load message history
async function loadMessageHistory(groupName, page = 1) {
    try {
        const body = {
            "trang": page,
            "so_dong": pageSize,
            "nhom": groupName || ""
        }

        const header = {
            "ConnectionId": connection.connectionId || "",
            "eAction": "P75EVW99A84IGNK",
        }

        const response = await fetch(`${baseURL}api/chat/execute`, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body)
        });
        if (!response.ok) throw new Error('Failed to fetch chat list');

        const data = await response.json();
        // Sort messages by NGAY_GUI ascending
        console.log('Loaded messages:', data.data);
        const sortedMessages = data.data.sort((a, b) => {
            const dateA = parseCustomDateString(a.NGAY_GUI);
            const dateB = parseCustomDateString(b.NGAY_GUI);
            return dateA - dateB;
        });
        console.log('Sorted messages:', sortedMessages);

        return sortedMessages;
    } catch {
        return [];
    }
}

// Append message history to chat container
async function appendMessageHistory(messages, prepend = false) {
    const fragment = document.createDocumentFragment();

    for (const msg of messages) {
        const isMe = userId === msg.MA_DOI_TAC_NSD;
        const msgDiv = document.createElement("div");
        msgDiv.classList.add(isMe ? 'me' : 'partner');
        msgDiv.innerHTML = `
            <div class="info">
                ${isMe ?
                `<div class="message-title">
                  <h5>${msg.TEN}</h5>
                  <p class="message-time">${msg.NGAY_GUI}</p>
                </div>
                <img class="logo-item" src="${msg.LINK_LOGO}" alt="Logo" />`
                :
                `<img class="logo-item" src="${msg.LINK_LOGO}" alt="Logo" />
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

    // Lưu vị trí scroll hiện tại và chiều cao cũ
    const oldScrollHeight = messageContainer.scrollHeight;
    const oldScrollTop = messageContainer.scrollTop;

    try {
        // Tăng page để load tin nhắn cũ hơn
        currentPage++;

        const messages = await loadMessageHistory(selectedChat.hsbl, currentPage);

        // Kiểm tra còn tin nhắn không
        if (messages.length === 0) {
            hasMoreMessages = false;
            console.log('Đã tải hết tin nhắn');
            return;
        }

        // Thêm tin nhắn vào đầu (prepend = true)
        await appendMessageHistory(messages, true);

        // Giữ vị trí scroll (quan trọng!)
        // Tính khoảng cách mới = chiều cao mới - chiều cao cũ + vị trí cũ
        const newScrollHeight = messageContainer.scrollHeight;
        messageContainer.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;

    } catch (error) {
        console.error('Lỗi khi load thêm tin nhắn:', error);
        currentPage--; // Rollback page nếu lỗi
    } finally {
        isLoading = false;
    }
}

// Selected chat item
let selectedChat = null;
let currentPage = 1;
let isLoading = false;
let hasMoreMessages = true;

// Pagination state for chat list
let chatListCurrentPage = 1;
let chatListIsLoading = false;
let chatListHasMore = true;
let currentSearchTerm = "";

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
const searchChatInput = document.querySelector('#search-chat-input');
const searchChatIcon = document.querySelector('#search-chat-icon');
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

// Asign full name to userNameInput
userNameInput.value = fullName;

// Debounce function để tránh gọi quá nhiều lần
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

// Scroll handler với debounce
const handleScroll = debounce(function () {
    if (messageContainer.scrollTop < 20) {
        loadMoreMessages();
    }
}, 200); // Chờ 200ms sau lần scroll cuối

messageContainer.addEventListener('scroll', handleScroll);

// Scroll handler for chat list infinity scroll
const handleChatListScroll = debounce(function () {
    console.log('Scroll chat list:', chatBoxListContainer.scrollTop);
    const scrollTop = chatBoxListContainer.scrollTop;
    const scrollHeight = chatBoxListContainer.scrollHeight;
    const clientHeight = chatBoxListContainer.clientHeight;

    // Load more khi scroll gần đến cuối (còn 100px)
    if (scrollTop + clientHeight >= scrollHeight - 100) {
        loadMoreChatList();
    }
}, 200);

chatBoxListContainer.addEventListener('scroll', handleChatListScroll);

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
    return fetch(`${baseURL}api/chat/execute`)
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
                userNameInput.value = fullName;
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
        chatListCurrentPage = 1;
        chatListIsLoading = false;
        currentSearchTerm = "";
        searchChatInput.value = '';

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

searchChatIcon.addEventListener('click', function () {
    const searchTerm = searchChatInput.value.trim();
    currentSearchTerm = searchTerm;

    // Reset pagination state
    chatListCurrentPage = 1;
    chatListIsLoading = false;

    loadChatList(currentSearchTerm);
});

searchChatInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const searchTerm = searchChatInput.value.trim();
        currentSearchTerm = searchTerm;

        // Reset pagination state
        chatListCurrentPage = 1;
        chatListIsLoading = false;

        loadChatList(currentSearchTerm);
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
        if (!validateInfoInputs()
            // || !(await validateContractId(hsblInput.value.trim()))
        ) {
            return;
        }

        if (selectedChat) {
            selectedChat.hsbl = hsblInput.value.trim();
            selectedChat.userName = userNameInput.value.trim();
        }

        errorInfoInput.textContent = '';

        // Join group
        connection.invoke("JoinGroupAsync", selectedChat.hsbl).then(() => {
            console.log(`Đã rời nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        var messages = await loadMessageHistory(selectedChat.hsbl, 1);
        await appendMessageHistory(messages);

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
        // Leave group
        connection.invoke("RemoveFromGroupAsync", selectedChat.hsbl).then(() => {
            console.log(`Đã rời nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        // Reset state before go back
        currentPage = 1;
        hasMoreMessages = true;
        isLoading = false
        messageContainer.innerHTML = '';

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';
    }
});

btnSendMessage.addEventListener('click', async function () {
    const message = document.getElementById('message-input').value;
    console.log('Gửi tin nhắn:', message);
    if (message) {
        try {
            await connection.invoke("SendMessageToGroupAsync", selectedChat.hsbl, message, userNameInput.value.trim());
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
    .withUrl(`${baseURL}chatHub?token=${token}&ePartnerCode=${ePartnerCode}`, {
        withCredentials: false,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

// Nhận tin nhắn từ server
connection.on("ReceiveGroupMessage", (data) => {
    console.log('Tin nhắn nhận được:', data);
    // Check if message come from the current user or not
    const isMe = userId === data.ma_doi_tac_nsd;
    const msg = document.createElement("div");
    msg.classList.add(isMe ? 'me' : 'partner');
    msg.innerHTML = `
        <div class="info">
        ${isMe ?
            `<div class="message-title">
              <h5>${data.ten}</h5>
              <p class="message-time">${data.ngay_gui}</p>
            </div>
            <img class="logo-item" src="${data.link_logo}" alt="Logo" />`
            :
            `<img class="logo-item" src="${data.link_logo}" alt="Logo" />
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