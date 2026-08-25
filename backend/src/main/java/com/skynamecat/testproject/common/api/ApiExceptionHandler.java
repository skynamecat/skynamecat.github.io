package com.skynamecat.testproject.common.api;

import com.skynamecat.testproject.chat.service.InvalidChatRequestException;
import com.skynamecat.testproject.blindbox.service.BlindboxValidationException;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import jakarta.persistence.EntityNotFoundException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;

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

    @ExceptionHandler(BlindboxValidationException.class)
    ResponseEntity<ApiResponse<ApiError>> handleBlindboxValidation(BlindboxValidationException exception) {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ApiResponse<>(4002, new ApiError(exception.getMessage())));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    ResponseEntity<ApiResponse<ApiError>> handleUploadTooLarge(MaxUploadSizeExceededException exception) {
        return ResponseEntity.status(HttpStatus.PAYLOAD_TOO_LARGE)
                .body(new ApiResponse<>(4130, new ApiError("上传素材超过允许的最大大小")));
    }

    @ExceptionHandler(EntityNotFoundException.class)
    ResponseEntity<ApiResponse<ApiError>> handleNotFound(EntityNotFoundException exception) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ApiResponse<>(4041, new ApiError(exception.getMessage())));
    }

    @ExceptionHandler(IllegalStateException.class)
    ResponseEntity<ApiResponse<ApiError>> handleConflict(IllegalStateException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(4091, new ApiError(exception.getMessage())));
    }


    @ExceptionHandler(DataIntegrityViolationException.class)
    ResponseEntity<ApiResponse<ApiError>> handleDataConflict(DataIntegrityViolationException exception) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ApiResponse<>(4092, new ApiError("数据与现有配置冲突")));
    }
}
