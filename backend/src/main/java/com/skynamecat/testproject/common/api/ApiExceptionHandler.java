package com.skynamecat.testproject.common.api;

import com.skynamecat.testproject.chat.service.InvalidChatRequestException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

@RestControllerAdvice
public class ApiExceptionHandler {

    @ExceptionHandler(MethodArgumentNotValidException.class)
    ResponseEntity<ApiResponse<ApiError>> handleValidation(MethodArgumentNotValidException exception) {
        String message = exception.getBindingResult().getFieldErrors().stream()
                .findFirst()
                .map(error -> error.getDefaultMessage() == null ? "invalid request" : error.getDefaultMessage())
                .orElse("invalid request");
        return ResponseEntity.badRequest().body(new ApiResponse<>(4001, new ApiError(message)));
    }

    @ExceptionHandler(InvalidChatRequestException.class)
    ResponseEntity<ApiResponse<ApiError>> handleInvalidChatRequest(InvalidChatRequestException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(4001, new ApiError(exception.getMessage())));
    }
}
