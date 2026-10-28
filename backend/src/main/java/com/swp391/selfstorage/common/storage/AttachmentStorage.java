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

  public String saveImage(MultipartFile file) {
    if (file == null || file.isEmpty() || file.getSize() > 10 * 1024 * 1024)
      throw Inputs.bad("Ảnh minh chứng tối đa 10 MB");
    try {
      byte[] bytes = file.getBytes();
      boolean png = bytes.length >= 8 && (bytes[0] & 255) == 137 && bytes[1] == 80
          && bytes[2] == 78 && bytes[3] == 71 && bytes[4] == 13 && bytes[5] == 10
          && bytes[6] == 26 && bytes[7] == 10;
      boolean jpg = bytes.length >= 3 && (bytes[0] & 255) == 255
          && (bytes[1] & 255) == 216 && (bytes[2] & 255) == 255;
      if (!png && !jpg) throw Inputs.bad("Ảnh minh chứng phải là PNG hoặc JPEG hợp lệ");
      Files.createDirectories(root);
      String name = UUID.randomUUID() + (png ? ".png" : ".jpg");
      Files.write(resolve(name), bytes, StandardOpenOption.CREATE_NEW);
      return name;
    } catch (IOException e) {
      throw new IllegalStateException("Không lưu được ảnh hiện trạng", e);
    }
  }


  public Path resolve(String key) {
    Path p = root.resolve(key).normalize();
    if (
      !p.startsWith(root) || key.contains("/") || key.contains("\\")
    ) throw Inputs.bad("Đường dẫn không hợp lệ");
    return p;
  }

  public String saveOwnedImage(MultipartFile file, String owner) {
    String key = saveImage(file);
    try {
      Files.writeString(resolve(key + ".owner"), owner, StandardOpenOption.CREATE_NEW);
      return key;
    } catch (IOException ex) {
      remove(key);
      throw new IllegalStateException("Không lưu được chủ sở hữu ảnh", ex);
    }
  }

  public void requireImageOwner(String url, String owner) {
    if (url == null || !url.startsWith("/api/files/")) throw Inputs.bad("Ảnh phải được tải lên hệ thống");
    String key = url.substring("/api/files/".length());
    try {
      if (!Files.isRegularFile(resolve(key)) || !Files.readString(resolve(key + ".owner")).equals(owner)) throw Inputs.missing();
    } catch (IOException ex) { throw Inputs.missing(); }
  }

  public void remove(String key) {
    try {
      Files.deleteIfExists(resolve(key));
    } catch (IOException ignored) {}
  }
}
