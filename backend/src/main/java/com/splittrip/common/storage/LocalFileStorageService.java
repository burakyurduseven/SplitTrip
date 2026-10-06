package com.splittrip.common.storage;

import java.io.*;
import java.nio.file.*;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

@Service
public class LocalFileStorageService implements FileStorageService {
    private final Path root;
    public LocalFileStorageService(@Value("${splittrip.storage.root:uploads}") String root) {
        this.root = Path.of(root).toAbsolutePath().normalize();
    }
    @Override public void store(String key, InputStream content) {
        var target = resolve(key);
        try { Files.createDirectories(target.getParent()); Files.copy(content, target, StandardCopyOption.REPLACE_EXISTING); }
        catch (IOException exception) { throw new FileStorageException("The document could not be stored.", exception); }
    }
    @Override public StoredFile read(String key) {
        var target = resolve(key);
        try { return new StoredFile(Files.newInputStream(target), Files.size(target)); }
        catch (IOException exception) { throw new FileStorageException("The document could not be read.", exception); }
    }
    @Override public void delete(String key) {
        try { Files.deleteIfExists(resolve(key)); }
        catch (IOException exception) { throw new FileStorageException("The document could not be deleted.", exception); }
    }
    private Path resolve(String key) {
        var target = root.resolve(key).normalize();
        if (!target.startsWith(root)) throw new FileStorageException("Invalid storage key.");
        return target;
    }
}
