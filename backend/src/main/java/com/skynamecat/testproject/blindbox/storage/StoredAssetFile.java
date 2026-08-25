package com.skynamecat.testproject.blindbox.storage;

public record StoredAssetFile(
        String originalFilename,
        String contentType,
        String contentHash,
        long sizeBytes,
        String storagePath,
        String fileUrl
) {
}
