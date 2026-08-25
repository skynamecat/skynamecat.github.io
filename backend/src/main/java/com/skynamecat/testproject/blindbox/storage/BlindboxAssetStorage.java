package com.skynamecat.testproject.blindbox.storage;

import com.skynamecat.testproject.blindbox.service.BlindboxValidationException;
import com.skynamecat.testproject.blindbox.entity.AssetKind;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.security.DigestInputStream;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.Locale;

@Component
public class BlindboxAssetStorage {

    private static final byte[] GLB_MAGIC = {'g', 'l', 'T', 'F'};
    private final BlindboxAssetProperties properties;

    public BlindboxAssetStorage(BlindboxAssetProperties properties) {
        this.properties = properties;
    }

    public StoredAssetFile store(String assetKey, MultipartFile file) {
        return store(assetKey, AssetKind.MODEL, file);
    }

    public StoredAssetFile store(String assetKey, AssetKind kind, MultipartFile file) {
        String extension = validateUpload(kind, file);
        Path root = normalizedRoot();
        Path temporary = null;
        try {
            Files.createDirectories(root);
            temporary = Files.createTempFile(root, ".upload-", ".tmp");
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            long size;
            try (InputStream source = new BufferedInputStream(file.getInputStream());
                 DigestInputStream hashing = new DigestInputStream(source, digest)) {
                size = Files.copy(hashing, temporary, StandardCopyOption.REPLACE_EXISTING);
            }
            if (size > properties.getMaxSizeBytes()) {
                throw new BlindboxValidationException("素材超过允许的最大大小");
            }
            validateMagic(kind, extension, temporary);
            String hash = HexFormat.of().formatHex(digest.digest());
            String storedName = hash + "." + extension;
            Path target = safeResolve(root, storedName);
            if (Files.notExists(target)) {
                moveAtomically(temporary, target);
                temporary = null;
            }
            String baseUrl = properties.getPublicBaseUrl().replaceAll("/+$", "");
            return new StoredAssetFile(
                    sanitizedFilename(file.getOriginalFilename()),
                    normalizedContentType(file.getContentType()),
                    hash,
                    size,
                    storedName,
                    baseUrl + "/" + assetKey
            );
        } catch (IOException exception) {
            throw new IllegalStateException("无法保存盲盒素材", exception);
        } catch (NoSuchAlgorithmException exception) {
            throw new IllegalStateException("运行环境不支持 SHA-256", exception);
        } finally {
            if (temporary != null) {
                try {
                    Files.deleteIfExists(temporary);
                } catch (IOException ignored) {
                    // The upload has already failed; cleanup is best effort.
                }
            }
        }
    }

    public Path resolveStoredPath(String storagePath) {
        return safeResolve(normalizedRoot(), storagePath);
    }

    private String validateUpload(AssetKind kind, MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BlindboxValidationException("请选择非空的 GLB 素材文件");
        }
        if (file.getSize() > properties.getMaxSizeBytes()) {
            throw new BlindboxValidationException("素材超过允许的最大大小");
        }
        String filename = sanitizedFilename(file.getOriginalFilename());
        String extension = extensionOf(filename);
        if (!allowedExtensions(kind).contains(extension)) {
            throw new BlindboxValidationException("该素材类型不支持 ." + extension + " 文件");
        }
        String contentType = normalizedContentType(file.getContentType());
        if (!properties.getAllowedContentTypes().contains(contentType)) {
            throw new BlindboxValidationException("不支持的素材 Content-Type");
        }
        return extension;
    }

    private String sanitizedFilename(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            throw new BlindboxValidationException("素材文件名不能为空");
        }
        String normalized = originalFilename.replace('\\', '/');
        String leaf = normalized.substring(normalized.lastIndexOf('/') + 1);
        if (!leaf.equals(normalized) || leaf.equals(".") || leaf.equals("..") || leaf.length() > 255) {
            throw new BlindboxValidationException("素材文件名不安全");
        }
        return leaf;
    }

    private String normalizedContentType(String contentType) {
        return contentType == null || contentType.isBlank()
                ? "application/octet-stream"
                : contentType.toLowerCase(Locale.ROOT).trim();
    }

    private void validateMagic(AssetKind kind, String extension, Path path) throws IOException {
        byte[] header = new byte[12];
        try (InputStream input = Files.newInputStream(path)) {
            int read = input.read(header);
            if (read < 4) throw new BlindboxValidationException("素材文件内容不完整");
        }
        boolean valid = switch (kind) {
            case MODEL -> startsWith(header, GLB_MAGIC);
            case TEXTURE, THUMBNAIL -> switch (extension) {
                case "png" -> startsWith(header, new byte[]{(byte) 0x89, 'P', 'N', 'G'});
                case "jpg", "jpeg" -> startsWith(header, new byte[]{(byte) 0xff, (byte) 0xd8, (byte) 0xff});
                case "webp" -> startsWith(header, new byte[]{'R','I','F','F'})
                        && header[8] == 'W' && header[9] == 'E' && header[10] == 'B' && header[11] == 'P';
                default -> false;
            };
            case AUDIO -> switch (extension) {
                case "wav" -> startsWith(header, new byte[]{'R','I','F','F'});
                case "ogg" -> startsWith(header, new byte[]{'O','g','g','S'});
                case "mp3" -> startsWith(header, new byte[]{'I','D','3'})
                        || ((header[0] & 0xff) == 0xff && (header[1] & 0xe0) == 0xe0);
                default -> false;
            };
            case OTHER -> extension.equals("json") || extension.equals("bin");
        };
        if (!valid) {
            throw new BlindboxValidationException(kind == AssetKind.MODEL
                    ? "文件内容不是有效的 GLB 二进制格式"
                    : "素材文件签名与所选类型不匹配");
        }
    }

    private boolean startsWith(byte[] value, byte[] prefix) {
        if (value.length < prefix.length) return false;
        for (int index = 0; index < prefix.length; index++) {
            if (value[index] != prefix[index]) return false;
        }
        return true;
    }

    private String extensionOf(String filename) {
        int dot = filename.lastIndexOf('.');
        if (dot <= 0 || dot == filename.length() - 1) {
            throw new BlindboxValidationException("素材文件缺少扩展名");
        }
        return filename.substring(dot + 1).toLowerCase(Locale.ROOT);
    }

    private java.util.Set<String> allowedExtensions(AssetKind kind) {
        return switch (kind) {
            case MODEL -> java.util.Set.of("glb");
            case TEXTURE, THUMBNAIL -> java.util.Set.of("png", "jpg", "jpeg", "webp");
            case AUDIO -> java.util.Set.of("mp3", "wav", "ogg");
            case OTHER -> java.util.Set.of("json", "bin");
        };
    }

    private Path normalizedRoot() {
        return properties.getDirectory().toAbsolutePath().normalize();
    }

    private Path safeResolve(Path root, String filename) {
        Path resolved = root.resolve(filename).normalize();
        if (!resolved.startsWith(root)) {
            throw new BlindboxValidationException("素材路径不安全");
        }
        return resolved;
    }

    private void moveAtomically(Path source, Path target) throws IOException {
        try {
            Files.move(source, target, StandardCopyOption.ATOMIC_MOVE);
        } catch (AtomicMoveNotSupportedException exception) {
            Files.move(source, target);
        }
    }
}
