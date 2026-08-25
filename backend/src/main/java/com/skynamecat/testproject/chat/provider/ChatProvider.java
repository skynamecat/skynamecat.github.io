package com.skynamecat.testproject.chat.provider;

import com.skynamecat.testproject.chat.model.ChatReply;

public interface ChatProvider {

    ChatReply reply(String message);
}
