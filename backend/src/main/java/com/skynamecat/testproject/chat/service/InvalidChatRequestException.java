package com.skynamecat.testproject.chat.service;

public class InvalidChatRequestException extends RuntimeException {

    public InvalidChatRequestException(String message) {
        super(message);
    }
}
