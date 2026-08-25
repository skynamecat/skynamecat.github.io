package com.skynamecat.testproject.common.api;

public record ApiResponse<T>(int code, T data) {

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>(0, data);
    }
}
