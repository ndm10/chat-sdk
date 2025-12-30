// ================== CONFIGURATION ==================
const BASE_URL = 'https://localhost:7004/';
const PAGE_SIZE = 10;
const SCROLL_THRESHOLD = 20;
const SCROLL_LOAD_MORE_THRESHOLD = 100;
const DEBOUNCE_DELAY = 200;

// ================== USER INPUT ==================
let token = prompt("Nhập access token của bạn:", "");
if (!token) token = "Anonymous";

let userId = prompt("Nhập mã của bạn:", "");
if (!userId) userId = "Anonymous";

let fullName = prompt("Nhập tên đầy đủ của bạn:");
if (!fullName) fullName = "Khách hàng";

let ePartnerCode = prompt("Nhập ePartnerCode của bạn:", "BENH_VIEN");
if (!ePartnerCode) ePartnerCode = "PORTAL";

document.querySelector('#welcome-text').innerHTML = `Xin chào, ${token}!`;

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

// 1.0.8
let attachedFiles = [];

// ================== DOM ELEMENTS ==================
const listEl = document.querySelector("#list-items ul");
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
const textarea = document.getElementById('message-input');
const emojiButton = document.getElementById('emoji-button');
const messageInput = document.getElementById('message-input');
// 1.0.8
const fileInput = document.getElementById('file-input');
const filePreview = document.getElementById('file-preview');
const btnAttachFile = document.getElementById('attach-button');

userNameInput.value = fullName;

// ================== UTILITY FUNCTIONS ==================
function parseCustomDateString(str) {
    // Expected format: dd/MM/yyyy HH:mm:ss
    const [date, time] = str.split(' ');
    const [day, month, year] = date.split('/');
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
    this.style.height = 'auto';
    this.style.height = this.scrollHeight + 'px';
}

function scrollToBottom() {
    if (messageContainer) {
        messageContainer.scrollTop = messageContainer.scrollHeight;
    }
}

// ================== CHAT LIST FUNCTIONS ==================
function renderChatList(items, append = false) {
    const htmlContent = items
        .map(item => `
            <li data-id="${item.MA}">
                <img class="logo-item" src="${item.LINK_LOGO}" alt="Logo" />
                <h4 class="title-item">${item.TEN}</h4>
            </li>
        `)
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

    if (scrollHeight <= clientHeight && chatListHasMore && !chatListIsLoading) {
        console.log('Danh sách chưa đủ để scroll, load thêm...');
        await loadMoreChatList();
        setTimeout(() => ensureChatListFilled(), 100);
    }
}

async function loadChatList(searchTerm, page = 1, append = false) {
    try {
        const body = {
            trang: page,
            so_dong: PAGE_SIZE,
            nd_tim: searchTerm || ""
        };

        const header = {
            ConnectionId: connection.connectionId || "",
            eAction: "OO78LLZ0T7NLEZ3",
        };

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
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

        return data.data.length;
    } catch (error) {
        console.error('Error loading chat list:', error);
        if (!append) {
            listEl.innerHTML = '<li style="padding: 20px; text-align: center;">Không thể tải danh sách chat</li>';
        }
        return 0;
    }
}

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
        chatListCurrentPage--;
    } finally {
        chatListIsLoading = false;
    }
}

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

// ================== MESSAGE FUNCTIONS ==================
async function loadMessageHistory(groupName, page = 1) {
    try {
        const body = {
            trang: page,
            so_dong: PAGE_SIZE,
            nhom: groupName || ""
        };

        const header = {
            ConnectionId: connection.connectionId || "",
            eAction: "P75EVW99A84IGNK",
        };

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
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

    const oldScrollHeight = messageContainer.scrollHeight;
    const oldScrollTop = messageContainer.scrollTop;

    try {
        currentPage++;
        const messages = await loadMessageHistory(selectedChat.hsbl, currentPage);

        if (messages.length === 0) {
            hasMoreMessages = false;
            console.log('Đã tải hết tin nhắn');
            return;
        }

        await appendMessageHistory(messages, true);

        const newScrollHeight = messageContainer.scrollHeight;
        messageContainer.scrollTop = newScrollHeight - oldScrollHeight + oldScrollTop;

    } catch (error) {
        console.error('Lỗi khi load thêm tin nhắn:', error);
        currentPage--;
    } finally {
        isLoading = false;
    }
}

// ================== VALIDATION FUNCTIONS ==================
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

async function validateContractId(contractId) {
    try {
        const body = {
            so_hsbl_bv: contractId,
            ma_doi_tac_nsd_partner: selectedChat.id
        };

        const header = {
            ConnectionId: connection.connectionId || "",
            eAction: "XNN3Q5NN1PLC12R",
        };

        const response = await fetch(`${BASE_URL}api/chat/execute`, {
            method: 'POST',
            headers: header,
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const data = await response.json();
            return data.message || 'Lỗi khi xác thực hợp đồng';
        }

        return null;
    } catch {
        return 'Dịch vụ tạm thời không khả dụng, thử lại sau';
    }
}

// ================== EVENT LISTENERS ==================
// Auto resize textarea
textarea.addEventListener('input', autoResize, false);

// Scroll handlers
const handleScroll = debounce(function () {
    if (messageContainer.scrollTop < SCROLL_THRESHOLD) {
        loadMoreMessages();
    }
}, DEBOUNCE_DELAY);

messageContainer.addEventListener('scroll', handleScroll);

const handleChatListScroll = debounce(function () {
    console.log('Scroll chat list:', chatBoxListContainer.scrollTop);
    const scrollTop = chatBoxListContainer.scrollTop;
    const scrollHeight = chatBoxListContainer.scrollHeight;
    const clientHeight = chatBoxListContainer.clientHeight;

    if (scrollTop + clientHeight >= scrollHeight - SCROLL_LOAD_MORE_THRESHOLD) {
        loadMoreChatList();
    }
}, DEBOUNCE_DELAY);

chatBoxListContainer.addEventListener('scroll', handleChatListScroll);

// Input validation listeners
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

// Display initialization
chatBoxContainer.style.display = chatBoxContainerDisplay ? 'none' : 'flex';
chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';
chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';

// Chat box icon click
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

// Close button
btnX.addEventListener('click', function () {
    if (chatBoxContainer) {
        chatBoxContainerDisplay = true;
        chatBoxContainer.style.display = 'none';
    }
});

// Search handlers
searchChatIcon.addEventListener('click', function () {
    const searchTerm = searchChatInput.value.trim();
    currentSearchTerm = searchTerm;

    chatListCurrentPage = 1;
    chatListIsLoading = false;

    loadChatList(currentSearchTerm);
});

searchChatInput.addEventListener('keypress', function (event) {
    if (event.key === 'Enter') {
        const searchTerm = searchChatInput.value.trim();
        currentSearchTerm = searchTerm;

        chatListCurrentPage = 1;
        chatListIsLoading = false;

        loadChatList(currentSearchTerm);
    }
});

// Turn back button
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

// Continue button
continueButton.addEventListener('click', async function () {
    if (chatDetails) {
        if (!validateInfoInputs()) {
            return;
        }

        if (selectedChat) {
            selectedChat.hsbl = hsblInput.value.trim();
            selectedChat.fullName = userNameInput.value.trim();
        }

        const errorMessage = await validateContractId(selectedChat.hsbl);
        if (errorMessage) {
            errorInfoInput.textContent = errorMessage;
            return;
        }

        errorInfoInput.textContent = '';

        // Join group
        connection.invoke("JoinGroupAsync", selectedChat.hsbl).then(() => {
            console.log(`Đã join nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        var messages = await loadMessageHistory(selectedChat.hsbl, 1);
        await appendMessageHistory(messages);

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';

        setTimeout(scrollToBottom, 0);
    }
});

// Details back button
detailsBackButton.addEventListener('click', function () {
    if (chatDetails) {
        // Leave group
        connection.invoke("RemoveFromGroupAsync", selectedChat.hsbl).then(() => {
            console.log(`Đã rời nhóm: ${selectedChat.hsbl}`);
        }).catch(err => console.error(err.toString()));

        // Reset state before go back
        currentPage = 1;
        hasMoreMessages = true;
        isLoading = false;
        messageContainer.innerHTML = '';

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';
    }
});

// Send message button
btnSendMessage.addEventListener('click', async function () {
    const message = document.getElementById('message-input').value;
    console.log('Gửi tin nhắn:', message);
    if (message) {
        try {
            await connection.invoke("SendMessageToGroupAsync", selectedChat.hsbl, message, userNameInput.value.trim());
            document.getElementById("message-input").value = "";

            const textarea = document.getElementById('message-input');
            textarea.style.height = 'auto';
        } catch (err) {
            console.error("Lỗi gửi tin nhắn:", err);
        }
    }
});

// (1.0.8)
// Khi người dùng chọn file
fileInput.addEventListener('change', (e) => {
    const files = Array.from(e.target.files);
    files.forEach(file => {
        attachedFiles.push(file);
        renderFilePreview(file);
    });
    fileInput.value = ''; // Reset để có thể chọn lại cùng file
});

// Hiển thị preview
function renderFilePreview(file) {
    const item = document.createElement('div');
    item.className = 'file-item';

    if (file.type.startsWith('image/')) {
        item.classList.add('image');
        const img = document.createElement('img');
        img.src = URL.createObjectURL(file);
        item.appendChild(img);
    } else {
        item.classList.add('file');
        const nameDiv = document.createElement('div');
        nameDiv.className = 'file-name';
        nameDiv.textContent = file.name.length > 12 ? file.name.substring(0, 10) + '...' : file.name;
        item.appendChild(nameDiv);
    }

    // Nút X xóa
    const removeBtn = document.createElement('button');
    removeBtn.textContent = '×';
    removeBtn.className = 'remove-file';
    removeBtn.onclick = () => {
        attachedFiles = attachedFiles.filter(f => f !== file);
        item.remove();
        if (file.type.startsWith('image/')) {
            URL.revokeObjectURL(img.src); // Giải phóng bộ nhớ
        }
    };
    item.appendChild(removeBtn);

    filePreview.appendChild(item);
}

// // Gửi tin nhắn + file (sửa hàm send hiện tại)
// btnSendMessage.addEventListener('click', sendMessageWithFiles);

// function sendMessageWithFiles() {
//     const text = messageInput.value.trim();

//     // Gửi văn bản nếu có
//     if (text) {
//         addTextMessage(text, 'me');
//     }

//     // Gửi từng file nếu có
//     attachedFiles.forEach(file => {
//         if (file.type.startsWith('image/')) {
//             addImageMessage(file, 'me');
//         } else {
//             addFileMessage(file, 'me');
//         }
//     });

//     // Nếu dùng SignalR → bạn có thể gửi base64 hoặc upload riêng (phần nâng cao sau)

//     // Reset sau khi gửi
//     messageInput.value = '';
//     messageInput.style.height = 'auto';
//     attachedFiles = [];
//     filePreview.innerHTML = '';
//     scrollToBottom();
// }

// Thêm tin nhắn văn bản
function addTextMessage(text, sender) {
    const container = document.createElement('div');
    container.className = sender;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';
    const p = document.createElement('p');
    p.textContent = text;
    msgDiv.appendChild(p);

    container.appendChild(msgDiv);
    messageContainer.appendChild(container);
    scrollToBottom();
}

// Thêm ảnh vào chat
function addImageMessage(file, sender) {
    const container = document.createElement('div');
    container.className = sender;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';

    const img = document.createElement('img');
    img.src = URL.createObjectURL(file);
    img.className = 'chat-image';
    img.alt = file.name;

    msgDiv.appendChild(img);
    container.appendChild(msgDiv);
    messageContainer.appendChild(container);
    scrollToBottom();
}

// Thêm file không phải ảnh
function addFileMessage(file, sender) {
    const container = document.createElement('div');
    container.className = sender;

    const msgDiv = document.createElement('div');
    msgDiv.className = 'message';

    const fileDiv = document.createElement('div');
    fileDiv.className = 'chat-file';

    const link = document.createElement('a');
    link.href = URL.createObjectURL(file);
    link.download = file.name;
    link.textContent = `📄 ${file.name}`;

    const size = document.createElement('span');
    size.textContent = `${(file.size / 1024).toFixed(1)} KB`;

    fileDiv.appendChild(link);
    fileDiv.appendChild(size);
    msgDiv.appendChild(fileDiv);
    container.appendChild(msgDiv);
    messageContainer.appendChild(container);
    scrollToBottom();
}

// ================== EMOJI PICKER ==================
// Tạo picker động (chỉ tạo một lần)
const picker = document.createElement('emoji-picker');

// Thêm picker vào DOM (dưới message-sending để popup đúng vị trí)
document.querySelector('.message-sending').appendChild(picker);

// Xử lý chọn emoji → chèn vào textarea
picker.addEventListener('emoji-click', (event) => {
    const emoji = event.detail.unicode;

    const start = messageInput.selectionStart;
    const end = messageInput.selectionEnd;
    const text = messageInput.value;

    messageInput.value = text.substring(0, start) + emoji + text.substring(end);

    const newPos = start + emoji.length;
    messageInput.setSelectionRange(newPos, newPos);
    messageInput.focus();

    picker.classList.remove('show');

    messageInput.dispatchEvent(new Event('input'));
});

// Toggle hiển thị picker khi click nút emoji
emojiButton.addEventListener('click', (e) => {
    e.stopPropagation();
    picker.classList.toggle('show');
});

// Đóng picker khi click bên ngoài
document.addEventListener('click', (e) => {
    if (!picker.contains(e.target) && e.target !== emojiButton) {
        picker.classList.remove('show');
    }
});

// ================== SIGNALR CONNECTION ==================
const connection = new signalR.HubConnectionBuilder()
    .withUrl(`${BASE_URL}chatHub?token=${token}&ePartnerCode=${ePartnerCode}`, {
        withCredentials: false,
    })
    .configureLogging(signalR.LogLevel.Information)
    .withAutomaticReconnect()
    .build();

// Nhận tin nhắn từ server
connection.on("ReceiveGroupMessage", (data) => {
    console.log('Tin nhắn nhận được:', data);
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

// Start connection
connection
    .start()
    .then(() => {
        console.log("Kết nối SignalR thành công!");
    })
    .catch((err) => console.error("Lỗi kết nối SignalR:", err));
// ================== END OF FILE ==================