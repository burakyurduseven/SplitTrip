package com.splittrip.common.storage;

import java.io.InputStream;

public interface FileStorageService {
    void store(String key, InputStream content);
    StoredFile read(String key);
    void delete(String key);
    record StoredFile(InputStream content, long size) {}
}
