package com.swp391.selfstorage.common.storage;

import com.swp391.selfstorage.common.web.Inputs;
import java.io.*;
import java.nio.file.*;
import java.util.*;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.web.multipart.MultipartFile;

@Component
public class AttachmentStorage {

  private final Path root;

  public AttachmentStorage(@Value("${app.upload-dir}") String path) {
    root = Path.of(path).toAbsolutePath().normalize();
  }

  public String save(MultipartFile file) {
    if (file.isEmpty() || file.getSize() > 10 * 1024 * 1024) throw Inputs.bad(
      "Bằng chứng tối đa 10 MB"
    );
    try {
      byte[] bytes = file.getBytes();
      boolean pdf =
        bytes.length >= 4 &&
        bytes[0] == 37 &&
        bytes[1] == 80 &&
        bytes[2] == 68 &&
        bytes[3] == 70;
      boolean png =
        bytes.length >= 8 &&
        (bytes[0] & 255) == 137 &&
        bytes[1] == 80 &&
        bytes[2] == 78 &&
        bytes[3] == 71;
      boolean jpg =
        bytes.length >= 3 &&
        (bytes[0] & 255) == 255 &&
        (bytes[1] & 255) == 216 &&
        (bytes[2] & 255) == 255;
      if (!pdf && !png && !jpg) throw Inputs.bad(
        "Chỉ nhận PDF, PNG hoặc JPEG hợp lệ"
      );
      Files.createDirectories(root);
      String name = UUID.randomUUID() + (pdf ? ".pdf" : png ? ".png" : ".jpg");
      Files.write(resolve(name), bytes, StandardOpenOption.CREATE_NEW);
      return name;
    } catch (IOException e) {
      throw new IllegalStateException("Không lưu được bằng chứng", e);
    }
  }

  public Path resolve(String key) {
    Path p = root.resolve(key).normalize();
    if (
      !p.startsWith(root) || key.contains("/") || key.contains("\\")
    ) throw Inputs.bad("Đường dẫn không hợp lệ");
    return p;
  }

  public void remove(String key) {
    try {
      Files.deleteIfExists(resolve(key));
    } catch (IOException ignored) {}
  }
}
