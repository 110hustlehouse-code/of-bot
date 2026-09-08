const SELECTORS = {
  // Chat list — unread indicators
  unreadChat: '.b-chats__item--unread, [class*="chat"] [class*="unread"]',
  chatUserIdAttr: 'data-user-id',
  chatUserLink: 'a',

  // Messages in open chat
  fanMessage: '.b-chat__message:not(.m-from-me), [class*="message"]:not([class*="own"])',
  chatHeaderName: '.b-chat__header__name, [class*="chat-header"] [class*="name"]',

  // Chat input
  chatTextarea: [
    '.b-chat__input textarea',
    '[class*="chat-input"] textarea',
    'textarea[placeholder*="message"]',
    'textarea[placeholder*="Message"]',
  ].join(', '),

  // Send button
  sendButton: [
    'button[type="submit"]',
    'button[class*="send"]',
    '.b-chat__btn-submit',
  ].join(', '),
};