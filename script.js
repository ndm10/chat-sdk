// Render chat list
const chatList = [
    { id: 1, name: "ATACC - Công ty CP Tư vấn và Hỗ trợ quản lý ATACC", logo: "/assets/logo-atacc.png" },
    { id: 2, name: "MIC - Tổng công ty Cổ phần Bảo hiểm Quân đội", logo: "/assets/logo-mic.png" },
    { id: 3, name: "PJICO - Tổng Công ty Bảo hiểm PJICO", logo: "/assets/logo-pjico.png" }
];

const listEl = document.querySelector("#list-items ul");

function renderChatList(items) {
    listEl.innerHTML = items
        .map(
            item => `
        <li data-id="${item.id}">
          <img class="logo-item" src="${item.logo}" alt="Logo" />
          <h4 class="item-header">${item.name}</h4>
        </li>
      `
        )
        .join("");
}

renderChatList(chatList);

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
const chatBoxListItem = document.querySelectorAll('#list-items li');
const chatBoxInputInfo = document.querySelector('#info-input');
const turnBackButton = document.querySelector('#turn-back-button');
const continueButton = document.querySelector('#continue-button');
const chatDetails = document.querySelector('#chat-details');
const detailsBackButton = document.querySelector('#btn-details-back');
const messageContainer = document.querySelector('#message-container');

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
        chatBoxContainerDisplay = !chatBoxContainerDisplay;
        chatBoxContainer.style.display = chatBoxContainerDisplay ? 'none' : 'flex';
    }
});

chatBoxListItem.forEach((item) => {
    item.addEventListener('click', function () {
        if (chatBoxInputInfo) {
            chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
            chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
            chatBoxFilter.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';

            chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
            chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

            const { id } = item.dataset;
            const name = item.querySelector('.item-header')?.textContent?.trim() || '';

            selectedChat = { id, name };
            infoTitle.textContent = name || 'Chọn cuộc trò chuyện';
        }
    });
});

turnBackButton.addEventListener('click', function () {
    if (chatBoxInputInfo) {
        chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
        chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';
        chatBoxFilter.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';

        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';
    }
});

continueButton.addEventListener('click', function () {
    if (chatDetails) {
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
        chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
        chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';

        chatDetailsDisplay = !chatDetailsDisplay;
        chatDetails.style.display = chatDetailsDisplay ? 'none' : 'flex';
    }
});