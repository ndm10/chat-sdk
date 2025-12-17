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

var chatBoxIcon = document.querySelector('#chat-icon');
var chatBoxContainer = document.querySelector('#chat-box');
var chatBoxListContainer = document.querySelector('#list-items');
var chatBoxListItem = document.querySelectorAll('#list-items li');
var chatBoxInputInfo = document.querySelector('#info-input');
var turnBackButton = document.querySelector('#turn-back-button');
var continueButton = document.querySelector('#continue-button');
var chatDetails = document.querySelector('#chat-details');
var detailsBackButton = document.querySelector('#btn-details-back');
var messageContainer = document.querySelector('#message-container');

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

            chatBoxInputInfoDisplay = !chatBoxInputInfoDisplay;
            chatBoxInputInfo.style.display = chatBoxInputInfoDisplay ? 'none' : 'flex';
        }
    });
});

turnBackButton.addEventListener('click', function () {
    if (chatBoxInputInfo) {
        chatBoxListContainerDisplay = !chatBoxListContainerDisplay;
        chatBoxListContainer.style.display = chatBoxListContainerDisplay ? 'none' : 'flex';

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
        setTimeout(scrollToBottom, 100);
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