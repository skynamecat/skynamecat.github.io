package com.skynamecat.testproject.blindbox.storage;

import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

import java.nio.file.Path;
import java.util.Set;

@Component
@ConfigurationProperties(prefix = "blindbox.assets")
public class BlindboxAssetProperties {
    private Path directory = Path.of("./data/blindbox-assets");
    private long maxSizeBytes = 52_428_800L;
    private String publicBaseUrl = "/api/public/blindbox/assets";
    private Set<String> allowedContentTypes = Set.of(
            "model/gltf-binary", "application/octet-stream",
            "image/png", "image/jpeg", "image/webp",
            "audio/mpeg", "audio/wav", "audio/x-wav", "audio/ogg",
            "application/json"
    );

    public Path getDirectory() { return directory; }
    public void setDirectory(Path directory) { this.directory = directory; }
    public long getMaxSizeBytes() { return maxSizeBytes; }
    public void setMaxSizeBytes(long maxSizeBytes) { this.maxSizeBytes = maxSizeBytes; }
    public String getPublicBaseUrl() { return publicBaseUrl; }
    public void setPublicBaseUrl(String publicBaseUrl) { this.publicBaseUrl = publicBaseUrl; }
    public Set<String> getAllowedContentTypes() { return allowedContentTypes; }
    public void setAllowedContentTypes(Set<String> allowedContentTypes) { this.allowedContentTypes = allowedContentTypes; }
}
